from fastapi import APIRouter
from typing import Dict
from services import emissions

router = APIRouter()


@router.get("/person/{person_id}")
def get_person_effect(person_id: str) -> Dict:
    # For demonstration, return a synthetic profile showing how environment affects a person
    # In a real simulation this would read the world state and compute exposures
    sample = {
        "person_id": person_id,
        "name": f"Person {person_id}",
        "estimated_annual_co2_kg": 3000.0,
        "most_significant_items": emissions.load_emissions()[:3],
    }
    return sample
