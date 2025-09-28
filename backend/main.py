from fastapi import FastAPI, Depends, HTTPException, Query
from pydantic import BaseModel
from supabase import create_client, Client
from decouple import config
import google.generativeai as genai
import os
from projection import generate_projection, compute_annual_emissions, generate_projection_with_action
import json
from fastapi.middleware.cors import CORSMiddleware


SUPABASE_URL = config("SUPABASE_URL")
SUPABASE_KEY = config("SUPABASE_SERVICE_ROLE_KEY")
print("Test",SUPABASE_URL)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],  # your React app
    allow_credentials=True,
    allow_methods=["*"],   # allow POST, GET, etc.
    allow_headers=["*"],
)
from typing import Optional
# Models
class UserLogin(BaseModel):
    name: Optional[str] = None
    email: str

class UserItems(BaseModel):
    items: dict

class Action(BaseModel):
    year: int
    action_type: str
    impact: dict


@app.post("/login")
def login(user: UserLogin):
    existing = supabase.table("users").select("*").eq("email", user.email).execute()
    if existing.data:
        return {"status": "ok", "mode": "login", "user_id": existing.data[0]["id"]}
    raise HTTPException(status_code=404, detail="No user found")


@app.post("/signup")
def signup(user: UserLogin):
    # first check if user already exists
    existing = supabase.table("users").select("*").eq("email", user.email).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="User already exists")

    if not user.name:
        raise HTTPException(status_code=422, detail="Name is required for signup")

    result = supabase.table("users").insert({
        "name": user.name,
        "email": user.email
    }).execute()
    return {"status": "ok", "mode": "signup", "user_id": result.data[0]["id"]}



@app.post("/items/{user_id}")
def add_items(user_id: str, data: UserItems):
    supabase.table("user_items").insert({
        "user_id": user_id,
        "items": data.items
    }).execute()
    return {"status": "ok"}

@app.get("/items/{user_id}")
def get_items(user_id: str):
    user_items_res = supabase.table("user_items")\
        .select("*")\
        .eq("user_id", user_id)\
        .order("created_at", desc=True)\
        .limit(1)\
        .execute()

    if not user_items_res.data:
        return {"items": {}}  # no items found yet

    return {"items": user_items_res.data[0]["items"]}

@app.put("/items/{user_id}")
def update_items(user_id: str, data: UserItems):
    # get the latest record id
    user_items_res = supabase.table("user_items")\
        .select("id")\
        .eq("user_id", user_id)\
        .order("created_at", desc=True)\
        .limit(1)\
        .execute()

    if not user_items_res.data:
        raise HTTPException(status_code=404, detail="No items found for user")

    record_id = user_items_res.data[0]["id"]

    # update that row
    supabase.table("user_items")\
        .update({"items": data.items})\
        .eq("id", record_id)\
        .execute()

    return {"status": "ok", "items": data.items}

@app.patch("/items/{user_id}")
def add_more_items(user_id: str, data: UserItems):
    # get the latest record
    user_items_res = supabase.table("user_items")\
        .select("*")\
        .eq("user_id", user_id)\
        .order("created_at", desc=True)\
        .limit(1)\
        .execute()

    if not user_items_res.data:
        # if no items exist, just insert new
        supabase.table("user_items").insert({
            "user_id": user_id,
            "items": data.items
        }).execute()
        return {"status": "ok", "items": data.items}

    latest = user_items_res.data[0]
    current_items = latest["items"]

    # merge counts
    merged = current_items.copy()
    for k, v in data.items.items():
        merged[k] = merged.get(k, 0) + v

    # update existing row
    supabase.table("user_items")\
        .update({"items": merged})\
        .eq("id", latest["id"])\
        .execute()

    return {"status": "ok", "items": merged}


@app.post("/actions/{user_id}")
def add_action(user_id: str, data: Action):
    supabase.table("actions").insert({
        "user_id": user_id,
        "year": data.year,
        "action_type": data.action_type,
        "impact": data.impact
    }).execute()
    return {"status": "ok"}


@app.get("/projection/{user_id}")
def get_projection(user_id: str, start_year: int = 2025):
    user_items_res = supabase.table("user_items")\
        .select("*")\
        .eq("user_id", user_id)\
        .order("created_at", desc=True)\
        .limit(1)\
        .execute()

    if not user_items_res.data:
        raise HTTPException(status_code=404, detail="No items found for user")
    
    base_items = user_items_res.data[0]["items"]

    # fetch actions
    actions_res = supabase.table("actions")\
        .select("*")\
        .eq("user_id", user_id)\
        .execute()

    actions = [
        {"year": a["year"], "impact": a["impact"]}
        for a in actions_res.data
    ]

    # generate projection
    projection = generate_projection(base_items, start_year)

    # save projection JSON in DB
    supabase.table("projections").insert({
        "user_id": user_id,
        "projection": projection
    }).execute()

    return {"projection": projection}




genai.configure(api_key=config("GEMINI_API_KEY"))

import re, json

@app.get("/ai_suggestions/{user_id}")
def ai_suggestions(user_id: str, year: int = Query(..., description="Year for which to generate suggestions")):
    # 1. fetch latest items
    user_items_res = supabase.table("user_items")\
        .select("*").eq("user_id", user_id)\
        .order("created_at", desc=True).limit(1).execute()

    if not user_items_res.data:
        raise HTTPException(status_code=404, detail="No items found for user")

    items = user_items_res.data[0]["items"]
    projection = generate_projection(items)

    # 2. validate requested year
    if str(year) not in projection:
        closest_year = min(projection.keys(), key=lambda y: abs(int(y) - year))
        snapshot = projection[closest_year]
        actual_year = int(closest_year)
    else:
        snapshot = projection[str(year)]
        actual_year = year

    # 3. Gemini prompt
    prompt = f"""
    The year is {actual_year}.
    The user owns these items: {items}.
    Environmental state snapshot: {snapshot}.
    
    Suggest 3 actionable eco-friendly changes. 
    Each suggestion must include:
      - "suggestion": short human text
      - "impact": JSON object with item changes (negative integer for reduction, or negative fraction for % reduction)
    
    Examples:
    {{"suggestion": "Switch one car to EV", "impact": {{"car": -1}}}}
    {{"suggestion": "Reduce AC usage by 20%", "impact": {{"ac": -0.2}}}}
    
    Return only a JSON array of 3 such objects, no code blocks.
    """

    model = genai.GenerativeModel("gemini-2.5-flash")
    response = model.generate_content(prompt)

    raw_text = response.text.strip()
    raw_text = re.sub(r"^```[a-zA-Z]*\n?", "", raw_text)
    raw_text = re.sub(r"```$", "", raw_text)

    # 4. parse JSON safely
    try:
        suggestions = json.loads(raw_text)
    except Exception:
        # fallback if Gemini outputs line list
        suggestions = []
        for line in raw_text.split("\n"):
            if line.strip():
                suggestions.append({"suggestion": line.strip("-• "), "impact": {}})

    return {"year": actual_year, "suggestions": suggestions}

import json
import os
from solders.keypair import Keypair

PAYER_FILE = "payer.json"

def load_or_create_keypair():
    if os.path.exists(PAYER_FILE):
        with open(PAYER_FILE, "r") as f:
            secret = json.load(f)
        return Keypair.from_bytes(bytes(secret))
    else:
        kp = Keypair()
        with open(PAYER_FILE, "w") as f:
            json.dump(list(kp.to_bytes()), f)
        return kp

from solana.rpc.api import Client as SolanaClient
import uuid
from solders.pubkey import Pubkey
from solders.transaction import Transaction
from solders.instruction import Instruction
from solders.message import Message
from solders.hash import Hash
from solana.rpc.core import RPCException

# Connect to devnet
solana_client = SolanaClient("https://api.devnet.solana.com")
payer = load_or_create_keypair()
print("Payer pubkey:", payer.pubkey())


MEMO_PROGRAM_ID = Pubkey.from_string("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr")

@app.post("/take_action/{user_id}")
def take_action(user_id: str, data: Action):
    # 1. Save action to DB
    supabase.table("actions").insert({
        "user_id": user_id,
        "year": data.year,
        "action_type": data.action_type,
        "impact": data.impact
    }).execute()

    # 2. Fetch latest items
    user_items_res = supabase.table("user_items")\
        .select("*").eq("user_id", user_id)\
        .order("created_at", desc=True).limit(1).execute()

    if not user_items_res.data:
        raise HTTPException(status_code=404, detail="No items found for user")

    base_items = user_items_res.data[0]["items"]

    # 3. Apply all actions
    actions_res = supabase.table("actions").select("*").eq("user_id", user_id).execute()
    items = base_items.copy()
    for a in actions_res.data:
        for k, v in a["impact"].items():
            if isinstance(v, float):
                items[k] = max(0, items.get(k, 0) * (1 + v))
            else:
                items[k] = max(0, items.get(k, 0) + v)

    # 4. Build Memo instruction
    memo_str = json.dumps({
        "user_id": user_id,
        "year": data.year,
        "impact": data.impact
    })
    instruction = Instruction(
        program_id=MEMO_PROGRAM_ID,
        accounts=[],
        data=bytes(memo_str, "utf-8")
    )

    # 5. Build transaction
    latest_blockhash = solana_client.get_latest_blockhash().value.blockhash
    tx = Transaction.new_signed_with_payer(
        [instruction],
        payer.pubkey(),
        [payer],
        latest_blockhash
    )

    try:
        tx_sig = solana_client.send_transaction(tx).value
    except RPCException as e:
        print("⚠️ Solana RPC error:", e)
        tx_sig = f"simulated-local-{uuid.uuid4()}"

    # 7. Generate updated projection
    projection = generate_projection_with_action(base_items, items, data.year)

    # 8. Save projection
    supabase.table("projections").insert({
        "user_id": user_id,
        "projection": projection
    }).execute()

    return {
        "status": "ok",
        "tx_sig": str(tx_sig),
        "projection": projection
    }



@app.get("/projections/{user_id}")
def get_saved_projection(user_id: str):
    result = supabase.table("projections")\
        .select("*")\
        .eq("user_id", user_id)\
        .order("created_at", desc=True)\
        .limit(1)\
        .execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="No projection found for user")

    return {
        "user_id": user_id,
        "projection": result.data[0]["projection"]
    }