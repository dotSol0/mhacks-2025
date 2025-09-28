import json
from pathlib import Path
from typing import List, Dict, Optional
from models import Person, SliderInput
from services import emissions

DATA_PATH = Path(__file__).parent.parent / "data" / "people.json"


def _ensure_data_path():
    if not DATA_PATH.exists():
        DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
        with open(DATA_PATH, "w", encoding="utf-8") as f:
            json.dump([], f)


def load_people() -> List[Dict]:
    _ensure_data_path()
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def save_people(lst: List[Dict]):
    _ensure_data_path()
    with open(DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(lst, f, indent=2)


def list_people() -> List[Dict]:
    return load_people()


def get_person(person_id: str) -> Optional[Dict]:
    for p in load_people():
        if p.get("id") == person_id:
            return p
    return None


def create_person(data: Dict) -> Dict:
    lst = load_people()
    lst.append(data)
    save_people(lst)
    return data


def update_person(person_id: str, patch: Dict) -> Optional[Dict]:
    lst = load_people()
    for i, p in enumerate(lst):
        if p.get("id") == person_id:
            p.update(patch)
            lst[i] = p
            save_people(lst)
            return p
    return None


def compute_person_emissions(person: Dict) -> Dict:
    # uses services.emissions.calculate_user_total
    behaviors = person.get("behaviors") or []
    total, breakdown = emissions.calculate_user_total(behaviors)
    person["estimated_annual_co2_kg"] = total
    return {"total": total, "breakdown": breakdown}
