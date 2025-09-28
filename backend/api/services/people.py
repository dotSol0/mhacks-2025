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
    try:
        with open(DATA_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        # If the JSON is malformed or another IO error occurs, return an
        # empty list so callers can still function. Higher-level code may
        # choose to recreate or repair the file.
        print(f"services.people: failed to load people.json: {e}")
        return []


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


def sync_textboxes_with_emission_data(emission_data: List[Dict], save: bool = True) -> List[Dict]:
    """
    Update every textbox/person `state` value according to a derived "world"
    state computed from `emission_data` (list of dicts or models that include
    a numeric `state` field). When `save` is True the updated people data is
    written back to `data/people.json`.

    Behavior / heuristics:
    - Compute raw_max = max(entry.state) across emission_data (ignore missing).
    - If raw_max == 0 then world_state = 0.
    - If raw_max > 0 and raw_max-1 fits into a textbox's descriptions length,
      treat the emission_data states as 1-based and use world_state = raw_max-1.
      Otherwise, if raw_max fits as a 0-based index, use world_state = raw_max.
    - Clamp to each textbox's available description indices when applying.

    This approach supports both 0-based and 1-based state encodings coming
    from different parts of the system.
    """
    people = load_people()

    # collect numeric states from emission_data
    states = []
    for ed in emission_data:
        try:
            if isinstance(ed, dict):
                s = ed.get("state")
            else:
                s = getattr(ed, "state", None)
            if s is None:
                continue
            states.append(int(s))
        except Exception:
            continue

    if not states:
        # nothing to do
        return people

    raw_max = max(states)

    # Walk through people data and update any 'textboxes' arrays or person-like
    # items that contain a 'descriptions' list. We set their numeric 'state'
    # field to the computed world_state (clamped to available range).
    for top in people:
        tboxes = top.get("textboxes") if isinstance(top, dict) else None
        if not tboxes:
            continue
        for tb in tboxes:
            # only proceed for dict-like textbox/person entries
            if not isinstance(tb, dict):
                continue
            descs = tb.get("descriptions") or []
            # determine candidate world_state for this textbox
            if raw_max == 0:
                world_state = 0
            else:
                # prefer interpreting raw_max as 1-based if that maps correctly
                if 0 <= (raw_max - 1) < len(descs):
                    world_state = raw_max - 1
                elif 0 <= raw_max < len(descs):
                    world_state = raw_max
                else:
                    # clamp to last available index
                    world_state = max(0, len(descs) - 1)

            # apply the state (store as int)
            tb["state"] = int(world_state)

    if save:
        save_people(people)

    return people


