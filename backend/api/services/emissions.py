import json
from pathlib import Path
from typing import Dict, List, Optional, Tuple

from pydantic import parse_obj_as

from models import EmissionItem
from models import MatrixData
from models import EmmissionsData
from models import Textbox


DATA_PATH = Path(__file__).parent.parent / "data" / "emissions.json"


def load_emissions() -> List[EmissionItem]:
    """Load emissions.json as a list of EmissionItem models."""
    if not DATA_PATH.exists():
        return []
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        raw = json.load(f)
    try:
        items = parse_obj_as(List[EmissionItem], raw)
    except Exception:
        return []

    # try to load optional emissions_matrix.json and attach matrices to items
    MATRIX_PATH = Path(__file__).parent.parent / "data" / "emissions_matrix.json"
    matrices = {}
    if MATRIX_PATH.exists():
        try:
            with open(MATRIX_PATH, "r", encoding="utf-8") as mf:
                mraw = json.load(mf)
            # mraw expected to contain an "actions" list
            for entry in mraw.get("actions", []):
                name = entry.get("name")
                if not name:
                    continue
                try:
                    matrices[name] = MatrixData(**entry)
                except Exception:
                    # skip malformed entries
                    continue
        except Exception:
            matrices = {}

    # attach matrix objects to items by matching the item name or id
    name_to_item = {it.name: it for it in items}
    id_to_item = {it.id: it for it in items}
    for mname, mobj in matrices.items():
        # first try matching by item name, then try id
        target = name_to_item.get(mname) or id_to_item.get(mname)
        if target:
            target.emissions_matrix = mobj

    return items


def find_item(item_id: str) -> Optional[EmissionItem]:
    for it in load_emissions():
        if it.id == item_id:
            return it
    return None



def _scale_matrix(matrix: Optional[MatrixData], factor: float) -> Optional[MatrixData]:
    """Return a new MatrixData with all numeric fields scaled by factor.

    Non-numeric or missing fields are preserved or left as-is. If matrix is None,
    returns None.
    """
    if matrix is None:
        return None
    # model_dump for Pydantic v2, fallback to dict()
    data = None
    if hasattr(matrix, "model_dump"):
        data = matrix.model_dump()
    else:
        data = matrix.dict()

    scaled = {}
    for k, v in data.items():
        if isinstance(v, (int, float)) and v is not None:
            scaled[k] = v * factor
        else:
            scaled[k] = v

    try:
        return MatrixData(**scaled)
    except Exception:
        # If validation fails, return None to indicate scaling couldn't be applied
        return None


def multiply_emission_item(item: EmissionItem, factor: float, *, new_id: Optional[str] = None, new_name: Optional[str] = None) -> EmissionItem:
    """Return a new EmissionItem that represents `factor` copies of `item`.

    - co2_kg_per_unit is scaled by factor.
    - emissions_matrix numeric fields are scaled by factor (if present).
    - id and name can be overridden via new_id/new_name; otherwise they're derived.

    Example: multiply_emission_item(car_item, 2) -> id 'car_x2', name 'Car (x2)'
    """
    if factor == 1:
        return item

    # create sensible defaults for id and name when not provided
    safe_factor = int(factor) if float(factor).is_integer() else factor
    derived_id = new_id or f"{item.id}_x{safe_factor}"
    derived_name = new_name or f"{item.name} (x{safe_factor})"

    scaled_co2 = item.co2_kg_per_unit * factor
    scaled_matrix = _scale_matrix(item.emissions_matrix, factor)

    return EmissionItem(
        id=str(derived_id),
        name=str(derived_name),
        category=item.category,
        co2_kg_per_unit=scaled_co2,
        description=(item.description or "") + f"  (scaled x{safe_factor})",
        emissions_matrix=scaled_matrix,
    )

def propagate_state_to_textboxes(em_data: EmmissionsData, textboxes: List[Textbox]) -> None:
    """
    Whenever an EmmissionsData object's state changes, call set_state_from_emissions
    on every Textbox (or Person) with the new state.
    """
    for tb in textboxes:
        # Person inherits from Textbox and has set_state_from_emissions
        if hasattr(tb, "set_state_from_emissions"):
            tb.set_state_from_emissions(em_data.state)



def matrix_actions_to_emission_items(persist: bool = False, out_path: Optional[Path] = None) -> List[EmissionItem]:
    """Convert actions from emissions_matrix.json into EmissionItem objects.

    Heuristics used:
    - id: action['name']
    - name: prettified action name (underscores -> spaces, capitalize)
    - category: guessed from action name (drive -> vehicle, eat -> food, fly -> transport)
    - co2_kg_per_unit: derived from one_person_year (converted to kg by *1000)
      This treats the matrix's `one_person_year` field (which appears to be in tonnes)
      as the per-item annual emissions and stores it in kg to be compatible with
      existing calculate logic (which expects kg units).

    If `persist` is True, writes the generated list to `out_path` (defaults to
    data/emissions_from_matrix.json) as JSON (safe backup not implemented).
    """
    MATRIX_PATH = Path(__file__).parent.parent / "data" / "emissions_matrix.json"
    if not MATRIX_PATH.exists():
        return []
    with open(MATRIX_PATH, "r", encoding="utf-8") as mf:
        mraw = json.load(mf)

    out: List[EmissionItem] = []
    for entry in mraw.get("actions", []):
        name_key = entry.get("name")
        if not name_key:
            continue
        # pretty name: replace underscores and handle simple words
        pretty = name_key.replace("_", " ")
        pretty = pretty.replace("  ", " ").strip()
        pretty = pretty.capitalize()

        # category heuristics
        cat = "other"
        if name_key.startswith("drive_"):
            cat = "vehicle"
        elif name_key.startswith("eat_"):
            cat = "food"
        elif name_key.startswith("fly_") or name_key.startswith("plane"):
            cat = "transport"

        # co2_kg_per_unit: derive from one_person_year. If it's present and seems
        # to be in tonnes, convert to kg. If only day value present, use that *365.
        co2_kg = None
        if entry.get("one_person_year") is not None:
            try:
                co2_kg = float(entry.get("one_person_year") or 0.0) * 1000.0
            except Exception:
                co2_kg = None
        elif entry.get("one_person_day") is not None:
            try:
                co2_kg = float(entry.get("one_person_day") or 0.0) * 365.0
            except Exception:
                co2_kg = None

        if co2_kg is None:
            co2_kg = 0.0

        # Build MatrixData if possible
        try:
            matrix = MatrixData(**entry)
        except Exception:
            matrix = None

        item = EmissionItem(
            id=name_key,
            name=pretty,
            category=cat,
            co2_kg_per_unit=co2_kg,
            description=f"Auto-generated from emissions_matrix action {name_key}",
            emissions_matrix=matrix,
        )
        out.append(item)

    if persist:
        target = out_path or (Path(__file__).parent.parent / "data" / "emissions_from_matrix.json")
        # serialize to plain dicts
        serialized = [i.model_dump() if hasattr(i, "model_dump") else i.dict() for i in out]
        with open(target, "w", encoding="utf-8") as wf:
            json.dump(serialized, wf, indent=2)

    return out


def update_ppm_from_sliders(sliders: List, emission_data: List, textboxes: List[Textbox]) -> List:
    """For every active Slider in `sliders`, read its active EmissionItem's
    emissions_matrix.ppm_all_50_y (if present), sum those ppm values, and
    update the matching entries in `emission_data` (list of EmmissionsData-like
    dicts/models) by setting their `ppm` attribute.

    Matching rules:
    - First try to match emission_data entries by `item_id == slider.id`.
    - If not found, match by `item_id == active_item.id`.

    Returns the modified emission_data list.
    """
    # Build a lookup from emission_data by item_id for convenience
    lookup = {}
    for ed in emission_data:
        key = None
        if isinstance(ed, dict):
            key = ed.get("item_id")
        else:
            # assume pydantic model
            key = getattr(ed, "item_id", None)
        if key:
            lookup[key] = ed

    for slider in sliders:
        # resolve active item using Slider.get_active_item if available
        active = None
        if hasattr(slider, "get_active_item"):
            active = slider.get_active_item()
        else:
            # fallback: expect slider to be a dict-like
            try:
                items = slider.get("items", [])
                at = slider.get("active_type")
                if at:
                    for it in items:
                        if it.get("id") == at:
                            active = it
                            break
                else:
                    idx = slider.get("active_index")
                    if isinstance(idx, int) and 0 <= idx < len(items):
                        active = items[idx]
            except Exception:
                active = None

        ppm_val = None
        if active is None:
            continue
        # active may be EmissionItem model or dict
        matrix = None
        if hasattr(active, "emissions_matrix"):
            matrix = getattr(active, "emissions_matrix")
        elif isinstance(active, dict):
            matrix = active.get("emissions_matrix")

        if matrix is None:
            continue

        # read ppm_all_50_y
        ppm = None
        if isinstance(matrix, dict):
            ppm = matrix.get("ppm_all_50_y")
        else:
            ppm = getattr(matrix, "ppm_all_50_y", None)

        if ppm is None:
            continue

        # Now find emission_data entry to update
        updated = False
        # prefer matching by slider id
        sid = getattr(slider, "id", None) if not isinstance(slider, dict) else slider.get("id")
        if sid and sid in lookup:
            ed = lookup[sid]
            if isinstance(ed, dict):
                ed["ppm"] = ppm
            else:
                setattr(ed, "ppm", ppm)
            updated = True

        # fallback: match by active item id
        if not updated:
            aid = getattr(active, "id", None) if not isinstance(active, dict) else active.get("id")
            if aid and aid in lookup:
                ed = lookup[aid]
                if isinstance(ed, dict):
                    ed["ppm"] = ppm
                else:
                    setattr(ed, "ppm", ppm)

        if isinstance(ed, dict):
            if ppm < 500:
                ed["state"] = 1
            elif 500 <= ppm < 575:
                ed["state"] = 2
            elif 575 <= ppm < 630:
                ed["state"] = 3
            else:  # ppm >= 630
                ed["state"] = 4
            propagate_state_to_textboxes(ed, textboxes)

        else:
            if ppm < 500:
                setattr(ed, "state", 1)
            elif 500 <= ppm < 575:
                setattr(ed, "state", 2)
            elif 575 <= ppm < 630:
                setattr(ed, "state", 3)
            else:
                setattr(ed, "state", 4)
            propagate_state_to_textboxes(ed, textboxes)



    return emission_data


def calculate_user_total(inputs: List[Dict]) -> Tuple[float, List[Dict]]:
    """Compute total kg CO2 for inputs and a breakdown.

    inputs: list of dicts with keys 'item_id', 'frequency_per_year', optional 'units_per_use'
    """
    items = load_emissions()
    idx = {it.id: it for it in items}
    total = 0.0
    breakdown: List[Dict] = []
    for inp in inputs:
        item_id = inp.get("item_id")
        if not item_id:
            continue
        item = idx.get(item_id)
        if not item:
            continue
        per_unit = item.co2_kg_per_unit
        units = float(inp.get("units_per_use", 1.0) or 1.0)
        freq = float(inp.get("frequency_per_year", 0.0) or 0.0)
        kg = per_unit * units * freq
        total += kg
        breakdown.append({
            "item_id": item.id,
            "name": item.name,
            "kg_co2": kg,
            "per_unit": per_unit,
            "frequency_per_year": freq,
            "units_per_use": units,
        })
    return total, breakdown




