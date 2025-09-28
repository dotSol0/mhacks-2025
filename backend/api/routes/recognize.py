from fastapi import APIRouter, UploadFile, File
from typing import Dict
from services import agent_adapter

router = APIRouter()


@router.post("/image")
async def recognize_image(file: UploadFile = File(...)) -> Dict:
    # Stub: save file temporarily or forward to a model service
    # For now, return a fake classification
    return {"filename": file.filename, "classification": "unknown", "confidence": 0.0}


@router.get("/brainstorm/{item_id}")
def brainstorm(item_id: str):
    return agent_adapter.brainstorm_improvements(item_id)
