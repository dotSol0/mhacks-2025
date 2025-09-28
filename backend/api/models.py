from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any





class SliderInput(BaseModel):
    item_id: str
    frequency_per_year: float
    units_per_use: float = 1.0


class EmmissionsData(BaseModel):
    item_id: str
    state: int
    ppm: float


class CalculateRequest(BaseModel):
    user_inputs: List[SliderInput]
    population_count: int = 1000


class CalculateResult(BaseModel):
    user_total_kg_co2: float
    population_total_kg_co2: float
    breakdown: List[Dict]

class MatrixData(BaseModel):
    one_person_day: float
    twenty_person_day: float
    all_day: float

    one_person_year: float
    twenty_person_year: float
    all_year: float

    one_person_50_y: float
    twenty_person_50_y: float
    all_50_y: float

    ppm_all_50_y: Optional[float] = None

    def as_matrix(self) -> List[List[float]]:
        """Return a 3x3 matrix view of the stored values (day/year/50y rows)."""
        return [
            [self.one_person_day, self.twenty_person_day, self.all_day],
            [self.one_person_year, self.twenty_person_year, self.all_year],
            [self.one_person_50_y, self.twenty_person_50_y, self.all_50_y],
        ]

class EmissionItem(BaseModel):
    id: str
    name: str
    category: str
    co2_kg_per_unit: float
    description: str = ""
    emissions_matrix: Optional[MatrixData] = None


# Slider groups: a slider contains multiple emission "types" (EmissionItem)
# and the frontend will select one of them as the active type.
class Slider(BaseModel):
    """Represents a slider control composed of multiple EmissionItem options.

    Fields:
    - id: unique id for this slider group
    - name: human name for the slider (e.g., "Transportation — Car")
    - items: list of EmissionItem objects that the slider can select between
    - active_type: optional id of the currently selected EmissionItem (by id)
      The frontend may set this to switch which emission type is active.
    - active_index: optional integer index (alternative to `active_type`)

    Use `get_active_item()` to resolve the active EmissionItem (prefers
    `active_type` if provided, otherwise uses `active_index`).
    """
    id: str
    name: str
    items: List[EmissionItem] = Field(default_factory=list)
    active_type: Optional[str] = None
    active_index: Optional[int] = None

    def get_active_item(self) -> Optional[EmissionItem]:
        """Return the currently active EmissionItem or None.

        Priority:
        1. If `active_type` is set, return the item with that id.
        2. Else if `active_index` is set and valid, return item at that index.
        3. Else return None.
        """
        if self.active_type:
            for it in self.items:
                if it.id == self.active_type:
                    return it
        if self.active_index is not None:
            if 0 <= self.active_index < len(self.items):
                return self.items[self.active_index]
        return None

# New: a Textbox base class that holds id, name and a descriptions vector
class Textbox(BaseModel):
    id: str
    name: str
    # descriptions: a list of arbitrary dicts matching your people.json entries
    descriptions: List[Dict[str, Any]] = Field(default_factory=list)

    def active_description_by_index(self, state_index: int) -> str:
        """
        Return the active description string corresponding to the state_index.
        The descriptions list is expected to be ordered so that index 0 -> healthy, 1 -> stage2, etc.
        Each description entry may contain keys like 'state', 'description_1'..'description_5' etc.
        We try to pick the explicit key that matches the numeric index (e.g. index 1 -> 'description_1',
        index 2 -> 'description_2'). The function accepts either 0-based or 1-based incoming
        indexes and will try both interpretations before falling back to the first string value.
        """
        if not self.descriptions:
            return ""

        # Resolve entry using 0-based or 1-based index when possible
        entry = None
        if 0 <= state_index < len(self.descriptions):
            entry = self.descriptions[state_index]
        elif 1 <= state_index <= len(self.descriptions):
            # handle 1-based index
            entry = self.descriptions[state_index - 1]
        else:
            # clamp to last available entry
            entry = self.descriptions[max(0, len(self.descriptions) - 1)]

        # Attempt to pick an explicit description_{n} key. Prefer interpreting
        # the incoming index as 0-based first (so we look for description_{state_index+1}),
        # then as 1-based (description_{state_index}). This lets callers pass either
        # convention.
        candidates = []
        try:
            candidates.append(f"description_{int(state_index) + 1}")
        except Exception:
            pass
        try:
            candidates.append(f"description_{int(state_index)}")
        except Exception:
            pass

        for k in candidates:
            if k in entry and isinstance(entry[k], str):
                return entry[k]

        # fallback: pick the first string value whose key starts with 'description'
        for k in sorted(entry.keys()):
            if k.lower().startswith("description") and isinstance(entry[k], str):
                return entry[k]

        # final fallback: return first string value found
        for v in entry.values():
            if isinstance(v, str):
                return v
        return ""


# Person extends Textbox and adds age/location plus emissions-related helpers
class Person(Textbox):
    age: int = 0
    location: str = ""
    # current numeric state index (use to select description)
    state: int = 0

    def active_description(self) -> str:
        """Return the active description according to this person's state."""
        return self.active_description_by_index(self.state)

    def set_state_from_emissions(self, state_index: int) -> str:
        """
        Update the person's state from an emissions state index and return the active description.
        Use this when external emissions data (e.g. EmmissionsData.state) changes and you want to update the person.
        """
        self.state = state_index
        return self.active_description()
