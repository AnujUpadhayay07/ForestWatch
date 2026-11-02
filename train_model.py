from pathlib import Path

import pandas as pd
import numpy as np

from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    accuracy_score,
    balanced_accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    average_precision_score,
    roc_auc_score,
    confusion_matrix,
    classification_report,
)

DATA_FILE = Path("data/next_day_fire_dataset.csv")
MODEL_DIR = Path("models")
MODEL_DIR.mkdir(exist_ok=True)

df = pd.read_csv(DATA_FILE, parse_dates=["DATE"])
df = df.sort_values("DATE").reset_index(drop=True)

target = "FIRE_START_DAY"
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

train = df[df["DATE"] < "2020-01-01"].copy()
test = df[df["DATE"] >= "2020-01-01"].copy()

X_train = train[features]
y_train = train[target].astype(int)
X_test = test[features]
y_test = test[target].astype(int)

if train.empty or test.empty:
    raise ValueError("Training or testing split is empty.")

if y_train.nunique() < 2 or y_test.nunique() < 2:
    raise ValueError("Both splits must contain positive and negative labels.")

print("========== DATA SPLIT ==========")
print(f"Training: {len(train)} rows ({train['DATE'].min().date()} to {train['DATE'].max().date()})")
print(f"Testing : {len(test)} rows ({test['DATE'].min().date()} to {test['DATE'].max().date()})")
print("\nTraining target counts:")
print(y_train.value_counts().to_string())
print("\nTesting target counts:")
print(y_test.value_counts().to_string())

models = {
    "Logistic Regression": make_pipeline(
        StandardScaler(),
        LogisticRegression(max_iter=2000, class_weight="balanced", random_state=42),
    ),
    "Random Forest": RandomForestClassifier(
        n_estimators=300,
        max_depth=12,
        min_samples_leaf=5,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1,
    ),
}

results = []

for name, model in models.items():
    print(f"\n========== {name.upper()} ==========")
    model.fit(X_train, y_train)

    predictions = model.predict(X_test)
    probabilities = model.predict_proba(X_test)[:, 1]

    metrics = {
        "Model": name,
        "Accuracy": accuracy_score(y_test, predictions),
        "Balanced Accuracy": balanced_accuracy_score(y_test, predictions),
        "Precision": precision_score(y_test, predictions, zero_division=0),
        "Recall": recall_score(y_test, predictions, zero_division=0),
        "F1": f1_score(y_test, predictions, zero_division=0),
        "PR-AUC (Average Precision)": average_precision_score(y_test, probabilities),
        "ROC-AUC": roc_auc_score(y_test, probabilities),
    }
    results.append(metrics)

    for metric, value in metrics.items():
        if metric != "Model":
            print(f"{metric}: {value:.4f}")

    print("\nConfusion matrix [[TN, FP], [FN, TP]]:")
    print(confusion_matrix(y_test, predictions))
    print("\nClassification report:")
    print(classification_report(y_test, predictions, zero_division=0))

results_df = pd.DataFrame(results)
print("\n========== MODEL COMPARISON ==========")
print(results_df.round(4).to_string(index=False))

results_df.to_csv("output_model_comparison.csv", index=False)
print("\nComparison saved to output_model_comparison.csv")
print("No model has been saved or overwritten yet.")
