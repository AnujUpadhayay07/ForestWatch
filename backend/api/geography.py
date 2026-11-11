import json
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[2]

GEOJSON_PATH = (
    PROJECT_ROOT
    / "data"
    / "calfire_2024_perimeters_simplified.geojson"
)


def get_fire_perimeters():
    if not GEOJSON_PATH.exists():
        raise FileNotFoundError(
            "Simplified CAL FIRE perimeter data was not found."
        )

    with GEOJSON_PATH.open("r", encoding="utf-8") as file:
        data = json.load(file)

    return {
        "source": "CAL FIRE",
        "year": 2024,
        "total_features": len(data.get("features", [])),
        "features": data.get("features", []),
    }
