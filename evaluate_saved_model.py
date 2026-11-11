from pathlib import Path

import joblib
import pandas as pd
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
MODEL_FILE = Path("models/forest_fire_model.pkl")
OUTPUT_DIR = Path("output")
OUTPUT_DIR.mkdir(exist_ok=True)

bundle = joblib.load(MODEL_FILE)
model = bundle["model"]
features = bundle["features"]
target = bundle["target"]
threshold = float(bundle["threshold"])
cutoff = pd.Timestamp(bundle["training_cutoff"])

df = pd.read_csv(DATA_FILE, parse_dates=["DATE"])
df = df.sort_values("DATE").reset_index(drop=True)

test = df[df["DATE"] >= cutoff].copy()

if test.empty:
    raise ValueError("Test dataset is empty.")

X_test = test[features]
y_test = test[target].astype(int)

probabilities = model.predict_proba(X_test)[:, 1]
predictions = (probabilities >= threshold).astype(int)

tn, fp, fn, tp = confusion_matrix(
    y_test, predictions, labels=[0, 1]
).ravel()

print("========== SAVED MODEL EVALUATION ==========")
print("Model:", bundle["model_name"])
print("Training cutoff:", cutoff.date())
print("Test rows:", len(test))
print("Test dates:", test["DATE"].min().date(), "to", test["DATE"].max().date())
print("Threshold:", threshold)

print("\n========== METRICS ==========")
print(f"Accuracy:           {accuracy_score(y_test, predictions):.4f}")
print(f"Balanced accuracy:  {balanced_accuracy_score(y_test, predictions):.4f}")
print(f"Precision:          {precision_score(y_test, predictions, zero_division=0):.4f}")
print(f"Recall:             {recall_score(y_test, predictions, zero_division=0):.4f}")
print(f"F1-score:           {f1_score(y_test, predictions, zero_division=0):.4f}")
print(f"PR-AUC:             {average_precision_score(y_test, probabilities):.4f}")
print(f"ROC-AUC:            {roc_auc_score(y_test, probabilities):.4f}")

print("\nConfusion matrix [[TN, FP], [FN, TP]]:")
print([[tn, fp], [fn, tp]])

print("\nClassification report:")
print(classification_report(y_test, predictions, zero_division=0))

results = pd.DataFrame({
    "DATE": test["DATE"],
    "Actual": y_test,
    "Probability": probabilities,
    "Predicted": predictions,
})
results.to_csv(OUTPUT_DIR / "saved_model_predictions.csv", index=False)

print("Predictions saved to:", (OUTPUT_DIR / "saved_model_predictions.csv").resolve())
print("Saved model was loaded only; it was not retrained or overwritten.")
