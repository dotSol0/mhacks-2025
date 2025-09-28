import json
from pathlib import Path
from typing import Dict, List, Tuple

DATA_PATH = Path(__file__).parent.parent / "data" / "emissions.json"


def load_emissions() -> List[Dict]:
    if not DATA_PATH.exists():
        return []
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def find_item(item_id: str):
    items = load_emissions()
    for it in items:
        if it.get("id") == item_id:
            return it
    return None


def calculate_user_total(inputs: List[Dict]) -> Tuple[float, List[Dict]]:
    """Return total kg CO2 for user inputs and breakdown list"""
    items = load_emissions()
    idx = {it["id"]: it for it in items}
    total = 0.0
    breakdown = []
    for inp in inputs:
        item = idx.get(inp["item_id"])
        if not item:
            continue
        per_unit = item.get("co2_kg_per_unit", 0.0)
        kg = per_unit * inp.get("units_per_use", 1.0) * inp.get("frequency_per_year", 0.0)
        total += kg
        breakdown.append({
            "item_id": item["id"],
            "name": item.get("name"),
            "kg_co2": kg,
            "per_unit": per_unit,
            "frequency_per_year": inp.get("frequency_per_year", 0.0),
            "units_per_use": inp.get("units_per_use", 1.0),
        })
    return total, breakdown
