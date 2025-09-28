from fastapi import APIRouter, HTTPException
from typing import List
from models import Person
from services import people

router = APIRouter()


@router.get("/", response_model=List[Person])
def list_people():
    return people.list_people()


@router.get("/{person_id}")
def get_person(person_id: str):
    p = people.get_person(person_id)
    if not p:
        raise HTTPException(status_code=404, detail="Person not found")
    return p


@router.post("/", response_model=Person)
def create_person(person: Person):
    existing = people.get_person(person.id)
    if existing:
        raise HTTPException(status_code=400, detail="Person id already exists")
    data = person.dict()
    people.create_person(data)
    return data


@router.patch("/{person_id}")
def update_person(person_id: str, patch: dict):
    p = people.update_person(person_id, patch)
    if not p:
        raise HTTPException(status_code=404, detail="Person not found")
    return p


@router.get("/{person_id}/emissions")
def person_emissions(person_id: str):
    p = people.get_person(person_id)
    if not p:
        raise HTTPException(status_code=404, detail="Person not found")
    return people.compute_person_emissions(p)
