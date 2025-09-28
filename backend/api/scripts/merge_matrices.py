import json
from pathlib import Path

ROOT = Path(__file__).parent.parent
EMISSIONS = ROOT / "data" / "emissions.json"
MATRIX = ROOT / "data" / "emissions_matrix.json"


def load_json(p: Path):
    with open(p, "r", encoding="utf-8") as f:
        return json.load(f)


def write_json(p: Path, data):
    with open(p, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


def merge():
    if not EMISSIONS.exists():
        print("emissions.json not found")
        return
    if not MATRIX.exists():
        print("emissions_matrix.json not found; nothing to merge")
        return

    emissions = load_json(EMISSIONS)
    matrices_raw = load_json(MATRIX)
    actions = matrices_raw.get("actions", [])

    # build mapping by name and by id (id fallback)
    matrices_by_name = {a.get("name"): a for a in actions if a.get("name")}
    matrices_by_id = {a.get("id"): a for a in actions if a.get("id")}

    # default heuristic mapping for common action -> emission id (customize as needed)
    DEFAULT_ACTION_TO_ID = {
        "drive_gas_car_30mi_daily": "car_gasoline",
        "drive_ev_30mi_daily": "car_ev",
        "eat_hamburger_daily": "beef_steak",
        "eat_chicken_tenders_daily": "chicken_tenders",
        "eat_fruit_bowl_daily": "fruit_bowl",
        "eat_pbj_sandwich_daily": "pbj_sandwich",
        "fly_747_longhaul_yearly": "plane_flight",
    }

    # backup original
    backup = EMISSIONS.with_suffix(".json.bak")
    write_json(backup, emissions)
    print(f"Backup written to {backup}")

    updated = False
    for item in emissions:
        name = item.get("name")
        iid = item.get("id")
        m = None
        # exact match by matrix name -> item.name
        if name and name in matrices_by_name:
            m = matrices_by_name[name]
        # exact match by id
        elif iid and iid in matrices_by_id:
            m = matrices_by_id[iid]
        # fallback: use DEFAULT_ACTION_TO_ID mapping (action name -> emission id)
        else:
            # try to find any action that maps to this item's id
            if iid:
                # find action name that maps to this id
                for action_name, mapped_id in DEFAULT_ACTION_TO_ID.items():
                    if mapped_id == iid and action_name in matrices_by_name:
                        m = matrices_by_name[action_name]
                        break
            # if still not found, try mapping where action name equals item id
            if m is None and iid and iid in matrices_by_name:
                m = matrices_by_name[iid]

        if m:
            # remove the name/id fields from matrix entry if present to avoid duplication
            mat = {k: v for k, v in m.items() if k not in ("name", "id")}
            item["emissions_matrix"] = mat
            updated = True

    if updated:
        write_json(EMISSIONS, emissions)
        print(f"Merged matrices into {EMISSIONS}")
    else:
        print("No matching matrices found; emissions.json unchanged")


if __name__ == "__main__":
    merge()
