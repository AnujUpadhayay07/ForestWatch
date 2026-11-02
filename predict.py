from pathlib import Path
import joblib
import pandas as pd


MODEL_FILE = Path("models/forest_fire_model.pkl")


def load_model():
    """Load the saved model and its expected feature order."""
    if not MODEL_FILE.exists():
        raise FileNotFoundError(
            f"Model not found: {MODEL_FILE}. Run save_model.py first."
        )

    artifact = joblib.load(MODEL_FILE)

    return (
        artifact["model"],
        artifact["features"],
        artifact["threshold"],
    )


def predict_fire_risk(
    previous_day_precipitation,
    previous_day_max_temp,
    previous_day_min_temp,
    previous_day_avg_wind_speed,
    previous_7d_precipitation_sum,
    previous_7d_wind_speed_mean,
    target_month,
    target_day_of_year,
):
    """
    Predict the dataset's next-day FIRE_START_DAY label.

    Temperature is expected in Fahrenheit, precipitation in inches,
    and wind speed in mph, consistent with the source dataset.

    This is an educational dataset prediction, not an official
    real-world wildfire warning.
    """
    model, features, threshold = load_model()

    if not 1 <= target_month <= 12:
        raise ValueError("target_month must be between 1 and 12.")

    if not 1 <= target_day_of_year <= 366:
        raise ValueError("target_day_of_year must be between 1 and 366.")

    numeric_values = [
        previous_day_precipitation,
        previous_day_max_temp,
        previous_day_min_temp,
        previous_day_avg_wind_speed,
        previous_7d_precipitation_sum,
        previous_7d_wind_speed_mean,
    ]

    if not all(pd.notna(value) for value in numeric_values):
        raise ValueError("Weather inputs must be valid numeric values.")

    if previous_day_max_temp < previous_day_min_temp:
        raise ValueError("Maximum temperature cannot be below minimum temperature.")

    if any(value < 0 for value in [
        previous_day_precipitation,
        previous_day_avg_wind_speed,
        previous_7d_precipitation_sum,
        previous_7d_wind_speed_mean,
    ]):
        raise ValueError("Precipitation and wind speed cannot be negative.")

    temp_range = previous_day_max_temp - previous_day_min_temp

    wind_temp_ratio = (
        previous_day_avg_wind_speed / previous_day_max_temp
        if previous_day_max_temp != 0
        else float("nan")
    )

    if pd.isna(wind_temp_ratio):
        raise ValueError(
            "Cannot calculate wind/temperature ratio when maximum "
            "temperature is zero."
        )

    values = {
        "PREV_DAY_PRECIPITATION": previous_day_precipitation,
        "PREV_DAY_MAX_TEMP": previous_day_max_temp,
        "PREV_DAY_MIN_TEMP": previous_day_min_temp,
        "PREV_DAY_AVG_WIND_SPEED": previous_day_avg_wind_speed,
        "PREV_DAY_TEMP_RANGE": temp_range,
        "PREV_DAY_WIND_TEMP_RATIO": wind_temp_ratio,
        "PREV7D_PRECIPITATION_SUM": previous_7d_precipitation_sum,
        "PREV7D_WIND_SPEED_MEAN": previous_7d_wind_speed_mean,
        "TARGET_MONTH": target_month,
        "TARGET_DAY_OF_YEAR": target_day_of_year,
    }

    input_df = pd.DataFrame(
        [[values[feature] for feature in features]],
        columns=features,
    )

    probability = float(model.predict_proba(input_df)[0, 1])
    prediction = int(probability >= threshold)

    return {
        "prediction": prediction,
        "predicted_label": (
            "Fire-start label predicted"
            if prediction == 1
            else "No fire-start label predicted"
        ),
        "risk_score_percent": round(probability * 100, 2),
        "threshold": threshold,
        "model": "Random Forest Classifier",
        "note": (
            "Educational prediction against the dataset's label definition; "
            "not a verified real-world wildfire probability or official warning."
        ),
    }


if __name__ == "__main__":
    # Example only; these values are illustrative, not a real forecast.
    result = predict_fire_risk(
        previous_day_precipitation=0.0,
        previous_day_max_temp=85.0,
        previous_day_min_temp=55.0,
        previous_day_avg_wind_speed=6.0,
        previous_7d_precipitation_sum=0.1,
        previous_7d_wind_speed_mean=5.0,
        target_month=8,
        target_day_of_year=220,
    )

    print("\n========== SAMPLE PREDICTION ==========")
    for key, value in result.items():
        print(f"{key}: {value}")
