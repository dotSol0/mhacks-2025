from fastapi import APIRouter, HTTPException
from typing import List
from models import EmissionItem, CalculateRequest, CalculateResult
from services import emissions, mapper

router = APIRouter()


@router.get("/items", response_model=List[EmissionItem])
def list_items():
    items = emissions.load_emissions()
    return items


@router.post("/user", response_model=CalculateResult)
def calculate_user(req: CalculateRequest):
    # validate inputs
    if not req.user_inputs:
        raise HTTPException(status_code=400, detail="No user inputs provided")
    total, breakdown = emissions.calculate_user_total([i.dict() for i in req.user_inputs])
    population_total = total * max(req.population_count, 0)
    return CalculateResult(user_total_kg_co2=total, population_total_kg_co2=population_total, breakdown=breakdown)


@router.get("/suggest/{item_id}")
def suggest(item_id: str):
    return mapper.suggest_alternatives(item_id)
