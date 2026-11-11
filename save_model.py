from pathlib import Path
import joblib
import pandas as pd

from sklearn.ensemble import RandomForestClassifier

DATA_FILE = Path("data/next_day_fire_dataset.csv")
MODEL_DIR = Path("models")
MODEL_DIR.mkdir(parents=True, exist_ok=True)

MODEL_FILE = MODEL_DIR / "forest_fire_model.pkl"

FEATURES = [
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

df = pd.read_csv(DATA_FILE, parse_dates=["DATE"])
df = df.sort_values("DATE").reset_index(drop=True)

# Same chronological training cutoff used in model comparison.
train = df[df["DATE"] < "2020-01-01"].copy()

X_train = train[FEATURES]
y_train = train["FIRE_START_DAY"].astype(int)

model = RandomForestClassifier(
    n_estimators=300,
    max_depth=12,
    min_samples_leaf=5,
    class_weight="balanced",
    random_state=42,
    n_jobs=-1,
)

print("Training final Random Forest on data before 2020...")
model.fit(X_train, y_train)

artifact = {
    "model": model,
    "features": FEATURES,
    "threshold": 0.50,
    "model_name": "Random Forest Classifier",
    "target": "FIRE_START_DAY",
    "training_cutoff": "2020-01-01",
}

joblib.dump(artifact, MODEL_FILE)

# Verify that the saved artifact can be loaded.
loaded = joblib.load(MODEL_FILE)

print("\n========== MODEL SAVED ==========")
print("File:", MODEL_FILE.resolve())
print("Training rows:", len(X_train))
print("Training date range:",
      train["DATE"].min().date(), "to", train["DATE"].max().date())
print("Features:", len(loaded["features"]))
print("Threshold:", loaded["threshold"])
print("Reload verification:", type(loaded["model"]).__name__)
print("File size:", f"{MODEL_FILE.stat().st_size / 1024 / 1024:.2f} MB")
