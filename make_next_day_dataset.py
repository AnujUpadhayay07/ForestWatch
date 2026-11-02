from pathlib import Path

import pandas as pd


DATA_DIR = Path("data")
INPUT_FILE = DATA_DIR / "CA_Weather_Fire_Dataset_1984-2025.csv"
OUTPUT_FILE = DATA_DIR / "next_day_fire_dataset.csv"


def main():
    df = pd.read_csv(INPUT_FILE, parse_dates=["DATE"])
    df = df.sort_values("DATE").reset_index(drop=True)

    if df["DATE"].duplicated().any():
        raise ValueError("Duplicate dates found.")

    weather = [
        "PRECIPITATION",
        "MAX_TEMP",
        "MIN_TEMP",
        "AVG_WIND_SPEED",
    ]

    for col in weather:
        df[col] = pd.to_numeric(df[col], errors="coerce")

    # A new segment starts whenever dates are not consecutive.
    df["GAP_DAYS"] = df["DATE"].diff().dt.days
    df["SEGMENT"] = df["GAP_DAYS"].ne(1).cumsum()

    parts = []

    for _, group in df.groupby("SEGMENT", sort=False):
        group = group.copy()

        # Previous-day weather: target date excluded.
        for col in weather:
            group[f"PREV_DAY_{col}"] = group[col].shift(1)

        # Previous 7 calendar days only.
        group["PREV7D_PRECIPITATION_SUM"] = (
            group["PRECIPITATION"]
            .shift(1)
            .rolling(7, min_periods=7)
            .sum()
        )

        group["PREV7D_WIND_SPEED_MEAN"] = (
            group["AVG_WIND_SPEED"]
            .shift(1)
            .rolling(7, min_periods=7)
            .mean()
        )

        group["PREV_DAY_TEMP_RANGE"] = (
            group["PREV_DAY_MAX_TEMP"]
            - group["PREV_DAY_MIN_TEMP"]
        )

        previous_max = group["PREV_DAY_MAX_TEMP"].replace(0, pd.NA)

        group["PREV_DAY_WIND_TEMP_RATIO"] = (
            group["PREV_DAY_AVG_WIND_SPEED"] / previous_max
        )

        group["TARGET_MONTH"] = group["DATE"].dt.month
        group["TARGET_DAY_OF_YEAR"] = group["DATE"].dt.dayofyear

        parts.append(group)

    df = pd.concat(parts).sort_values("DATE").reset_index(drop=True)

    features = [
        "PREV_DAY_PRECIPITATION",
        "PREV_DAY_MAX_TEMP",
        "PREV_DAY_MIN_TEMP",
        "PREV_DAY_AVG_WIND_SPEED",
        "PREV_DAY_TEMP_RANGE",
        "PREV_DAY_WIND_TEMP_RATIO",
        "PREV7D_PRECIPITATION_SUM",
        "PREV7D_WIND_SPEED_MEAN",
        "TARGET_MONTH",
        "TARGET_DAY_OF_YEAR",
    ]

    result = df[["DATE", "FIRE_START_DAY"] + features].copy()
    result = result.dropna(subset=features + ["FIRE_START_DAY"])

    result["FIRE_START_DAY"] = result["FIRE_START_DAY"].astype(bool)
    result.to_csv(OUTPUT_FILE, index=False)

    print("\n========== CORRECTED DATASET ==========")
    print("Original rows:", len(df))
    print("Usable rows:", len(result))
    print("Excluded rows:", len(df) - len(result))
    print("Date range:", result["DATE"].min().date(), "to", result["DATE"].max().date())
    print("Duplicate dates:", result["DATE"].duplicated().sum())
    print("Missing values:", int(result.isna().sum().sum()))
    print("\nTarget distribution:")
    print(result["FIRE_START_DAY"].value_counts().to_string())
    print("\nSaved:", OUTPUT_FILE.resolve())


if __name__ == "__main__":
    main()
