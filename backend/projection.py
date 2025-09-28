# backend/projection.py
from typing import Dict
from decouple import config

CAR_EMISSION = float(config("CAR_EMISSION", default=4.6))
MOTORBIKE_EMISSION = float(config("MOTORBIKE_EMISSION", default=1.0))
AIR_TRAVEL_EMISSION_PER_1000KM = float(config("AIR_TRAVEL_EMISSION_PER_1000KM", default=0.25))
REFRIGERATOR_EMISSION = float(config("REFRIGERATOR_EMISSION", default=0.3))
AC_EMISSION = float(config("AC_EMISSION", default=2.0))
WASHING_MACHINE_EMISSION = float(config("WASHING_MACHINE_EMISSION", default=0.2))
CLOTHES_DRYER_EMISSION = float(config("CLOTHES_DRYER_EMISSION", default=0.6))
STOVE_EMISSION = float(config("STOVE_EMISSION", default=0.5))
WATER_HEATER_EMISSION = float(config("WATER_HEATER_EMISSION", default=2.0))
ELECTRICITY_EMISSION_PER_KWH = float(config("ELECTRICITY_EMISSION_PER_KWH", default=0.0004))
NATURAL_GAS_EMISSION_PER_THERM = float(config("NATURAL_GAS_EMISSION_PER_THERM", default=0.0053))
TREE_ABSORPTION = float(config("TREE_ABSORPTION", default=0.022))
DEER_TREE_WEIGHT = float(config("DEER_TREE_WEIGHT", default=1.0))
FOX_TREE_WEIGHT = float(config("FOX_TREE_WEIGHT", default=0.7))
FOX_PREY_WEIGHT = float(config("FOX_PREY_WEIGHT", default=0.3))
FISH_LAKE_WEIGHT = float(config("FISH_LAKE_WEIGHT", default=1.0))
BIRD_TREE_WEIGHT = float(config("BIRD_TREE_WEIGHT", default=0.5))
BIRD_AIR_WEIGHT = float(config("BIRD_AIR_WEIGHT", default=0.5))


def clamp(v: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, v))

def interpolate_color(clarity: float) -> str:
    """
    Simple aesthetic mapping for lake color:
      clarity > 0.7  -> blue
      0.4-0.7        -> greenish
      <= 0.4         -> dark/dirty
    """
    if clarity > 0.7:
        return "#1E90FF"
    if clarity > 0.4:
        return "#3CB371"
    return "#2F4F4F"

def compute_annual_emissions(items: Dict[str, float]) -> float:
    """
    Aggregate annual CO2 emissions (tons/year) from user items.
    Supported keys (all optional, default 0):
      counts: car, motorbike, refrigerator, ac, washing_machine, clothes_dryer, stove, water_heater,
              meat_diet, clothing, electronics
      continuous: electricity_kwh (per yr), natural_gas_therms (per yr), air_travel_km (per yr)
    """
    total = 0.0
    total += items.get("car", 0) * CAR_EMISSION
    total += items.get("motorbike", 0) * MOTORBIKE_EMISSION
    total += items.get("refrigerator", 0) * REFRIGERATOR_EMISSION
    total += items.get("ac", 0) * AC_EMISSION
    total += items.get("washing_machine", 0) * WASHING_MACHINE_EMISSION
    total += items.get("clothes_dryer", 0) * CLOTHES_DRYER_EMISSION
    total += items.get("stove", 0) * STOVE_EMISSION
    total += items.get("water_heater", 0) * WATER_HEATER_EMISSION
    total += items.get("meat_diet", 0) * float(config("MEAT_DIET_EMISSION", default=2.5))
    total += items.get("clothing", 0) * float(config("CLOTHING_EMISSION", default=0.5))
    total += items.get("electronics", 0) * float(config("ELECTRONICS_EMISSION", default=0.2))
    total += items.get("electricity_kwh", 0) * ELECTRICITY_EMISSION_PER_KWH
    total += items.get("natural_gas_therms", 0) * NATURAL_GAS_EMISSION_PER_THERM
    total += (items.get("air_travel_km", 0) / 1000.0) * AIR_TRAVEL_EMISSION_PER_1000KM

    return total


def generate_projection(items: Dict[str, int], start_year: int = 2025):
    """
    Generate projection until one species goes extinct.
    Returns exactly 4 snapshots: start, two mids, and extinction.
    """

    emission_factors = {
        "car": 4.6,
        "refrigerator": 0.5,
        "ac": 1.0,
    }

    emissions = sum(items.get(k, 0) * v for k, v in emission_factors.items())

    # initial states
    carbon_score = 100.0
    trees = 100.0
    deer = fox = fish = bird = 1.0
    lake_clarity = 1.0
    fog = 0.01

    # yearly degradation multipliers (scaled by emissions)
    tree_loss = 0.001 * emissions
    animal_loss = 0.0008 * emissions
    clarity_loss = 0.001 * emissions
    fog_gain = 0.0002 * emissions
    carbon_loss = 0.002 * emissions

    # collect snapshots until extinction
    year = start_year
    snapshots = []
    while all(x > 0 for x in [deer, fox, fish, bird]):
        snapshots.append((year, carbon_score, trees, deer, fox, fish, bird, lake_clarity, fog))

        # degrade
        year += 1
        carbon_score -= carbon_loss * 100
        trees -= tree_loss * 100
        deer -= animal_loss
        fox -= animal_loss
        fish -= animal_loss * 1.2
        bird -= animal_loss * 1.3
        lake_clarity -= clarity_loss
        fog += fog_gain

        # floor values
        carbon_score = max(carbon_score, -50)
        trees = max(trees, 0)
        deer = max(deer, 0)
        fox = max(fox, 0)
        fish = max(fish, 0)
        bird = max(bird, 0)
        lake_clarity = max(lake_clarity, 0)
        fog = min(fog, 1)

    # extinction year snapshot
    snapshots.append((year, carbon_score, trees, deer, fox, fish, bird, lake_clarity, fog))

    # choose exactly 4 evenly spaced points
    projection = {}
    end_year = snapshots[-1][0]
    step = (end_year - start_year) // 3 if end_year > start_year else 1

    for i in range(4):
        target_year = start_year + i * step
        if i == 3:  # last snapshot always extinction
            snapshot = snapshots[-1]
        else:
            snapshot = min(snapshots, key=lambda s: abs(s[0] - target_year))

        projection[str(snapshot[0])] = {
            "carbonScore": round(snapshot[1], 1),
            "trees": round(snapshot[2], 1),
            "animals": {
                "deer": round(snapshot[3], 3),
                "fox": round(snapshot[4], 3),
                "fish": round(snapshot[5], 3),
                "bird": round(snapshot[6], 3),
            },
            "lake": {"color": "#1E90FF", "clarity": round(snapshot[7], 3)},
            "sky": {"fog": round(snapshot[8], 3)},
            "suggestions": [],
        }

    return projection

def generate_projection_with_action(base_items: Dict[str, int], new_items: Dict[str, int], action_year: int, start_year: int = 2025):
    """
    Merge two projections:
      - From start_year until action_year - 1: keep base projection
      - From action_year onwards: recalc with new_items
    Returns 4 snapshots (start, 2 mids, extinction).
    """
    base_proj = generate_projection(base_items, start_year)
    new_proj = generate_projection(new_items, action_year)

    # collect all years available
    years = sorted(set(list(base_proj.keys()) + list(new_proj.keys())), key=int)

    projection = {}
    for y in years:
        y_int = int(y)
        if y_int < action_year:
            projection[y] = base_proj[y] 
        else:
            if y in new_proj:
                projection[y] = new_proj[y]

    years_sorted = sorted([int(y) for y in projection.keys()])
    start = years_sorted[0]
    end = years_sorted[-1]
    step = (end - start) // 3 if end > start else 1

    final_proj = {}
    for i in range(4):
        target = start + i * step
        if i == 3:
            y = str(end)
        else:
            y = str(min(years_sorted, key=lambda yy: abs(yy - target)))
        final_proj[y] = projection[y]

    return final_proj