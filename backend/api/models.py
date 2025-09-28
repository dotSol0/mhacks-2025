from pydantic import BaseModel
from typing import Dict, List


class EmissionItem(BaseModel):
    id: str
    name: str
    category: str
    co2_kg_per_unit: float
    description: str = ""


class SliderInput(BaseModel):
    item_id: str
    frequency_per_year: float
    units_per_use: float = 1.0

class EmmissionsData(BaseModel):
    item_id: str
    

class CalculateRequest(BaseModel):
    user_inputs: List[SliderInput]
    population_count: int = 1000


class CalculateResult(BaseModel):
    user_total_kg_co2: float
    population_total_kg_co2: float
    breakdown: List[Dict]


class Person(BaseModel):
    id: str
    name: str
    age: int
    location: str
    description_st1: str
    description_st2: str
    description_st3: str
    description_st4: str
    description_st5: str
    state: int
    # A person's behavior as slider inputs (list of item usages)
    
    estimated_annual_co2_kg: float = 0.0
