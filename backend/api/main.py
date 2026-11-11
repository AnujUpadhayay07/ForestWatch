from pathlib import Path
import sys
import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

PROJECT_ROOT = Path(__file__).resolve().parents[2]

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from predict import predict_fire_risk
from backend.api.evaluation import get_model_evaluation
from backend.api.comparison import get_model_comparison
from backend.api.weather import get_live_weather
from backend.api.geography import get_fire_perimeters


app = FastAPI(
    title="Forest Fire Prediction API",
    description="Educational next-day fire-start prediction API.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ] + [
        origin.strip()
        for origin in os.getenv("FRONTEND_ORIGINS", "").split(",")
        if origin.strip()
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PredictionInput(BaseModel):
    previous_day_precipitation: float = Field(ge=0, description="Precipitation in inches")
    previous_day_max_temp: float = Field(description="Maximum temperature in Fahrenheit")
    previous_day_min_temp: float = Field(description="Minimum temperature in Fahrenheit")
    previous_day_avg_wind_speed: float = Field(ge=0, description="Average wind speed in mph")
    previous_7d_precipitation_sum: float = Field(ge=0, description="Previous 7-day precipitation sum in inches")
    previous_7d_wind_speed_mean: float = Field(ge=0, description="Previous 7-day average wind speed in mph")
    target_month: int = Field(ge=1, le=12)
    target_day_of_year: int = Field(ge=1, le=366)


@app.get("/")
def root():
    return {
        "message": "Forest Fire Prediction API is running.",
        "docs": "/docs",
    }


@app.get("/api/health")
def health():
    model_path = PROJECT_ROOT / "models" / "forest_fire_model.pkl"

    return {
        "status": "ok",
        "model_file_exists": model_path.exists(),
        "project": "Forest Fire Prediction",
    }


@app.post("/api/predict")
def predict(payload: PredictionInput):
    if payload.previous_day_max_temp < payload.previous_day_min_temp:
        raise HTTPException(
            status_code=422,
            detail="Maximum temperature must be greater than or equal to minimum temperature.",
        )

    if payload.previous_day_max_temp == 0:
        raise HTTPException(
            status_code=422,
            detail="Maximum temperature cannot be zero for this model's input calculation.",
        )

    try:
        result = predict_fire_risk(
            payload.previous_day_precipitation,
            payload.previous_day_max_temp,
            payload.previous_day_min_temp,
            payload.previous_day_avg_wind_speed,
            payload.previous_7d_precipitation_sum,
            payload.previous_7d_wind_speed_mean,
            payload.target_month,
            payload.target_day_of_year,
        )
        return result
    except (ValueError, TypeError) as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=500,
            detail="The trained model file could not be found. Check the models folder.",
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="Prediction failed. Check the backend terminal for details.",
        ) from exc


@app.get("/api/evaluation")
def evaluation():
    try:
        return get_model_evaluation()
    except FileNotFoundError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="Model evaluation failed. Check the backend terminal for details.",
        ) from exc


@app.get("/api/model-comparison")
def model_comparison():
    try:
        return get_model_comparison()
    except FileNotFoundError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="Model comparison failed. Check the backend terminal for details.",
        ) from exc



@app.get("/api/weather")
def live_weather(location: str):
    try:
        return get_live_weather(location)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@app.get("/api/fire-perimeters")
def fire_perimeters():
    try:
        return get_fire_perimeters()
    except FileNotFoundError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="Fire perimeter data could not be loaded.",
        ) from exc
