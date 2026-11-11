from functools import lru_cache
from pathlib import Path

import joblib
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    balanced_accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    average_precision_score,
    roc_auc_score,
)

PROJECT_ROOT = Path(__file__).resolve().parents[2]
MODEL_FILE = PROJECT_ROOT / "models" / "forest_fire_model.pkl"
DATA_FILE = PROJECT_ROOT / "data" / "next_day_fire_dataset.csv"


@lru_cache(maxsize=1)
def get_model_evaluation():
    if not MODEL_FILE.exists():
        raise FileNotFoundError("Saved model file was not found.")

    if not DATA_FILE.exists():
        raise FileNotFoundError("Evaluation dataset was not found.")

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

    report = classification_report(
        y_test,
        predictions,
        labels=[0, 1],
        target_names=["No Fire", "Fire"],
        output_dict=True,
        zero_division=0,
    )

    return {
        "model": "Random Forest Classifier",
        "training_cutoff": cutoff.strftime("%Y-%m-%d"),
        "test_rows": int(len(test)),
        "test_date_start": test["DATE"].min().strftime("%Y-%m-%d"),
        "test_date_end": test["DATE"].max().strftime("%Y-%m-%d"),
        "threshold": threshold,
        "metrics": {
            "accuracy": float(accuracy_score(y_test, predictions)),
            "balanced_accuracy": float(
                balanced_accuracy_score(y_test, predictions)
            ),
            "precision": float(
                precision_score(y_test, predictions, zero_division=0)
            ),
            "recall": float(
                recall_score(y_test, predictions, zero_division=0)
            ),
            "f1_score": float(
                f1_score(y_test, predictions, zero_division=0)
            ),
            "pr_auc": float(
                average_precision_score(y_test, probabilities)
            ),
            "roc_auc": float(
                roc_auc_score(y_test, probabilities)
            ),
        },
        "confusion_matrix": {
            "true_negative": int(tn),
            "false_positive": int(fp),
            "false_negative": int(fn),
            "true_positive": int(tp),
        },
        "classification_report": {
            "no_fire": report["No Fire"],
            "fire": report["Fire"],
            "macro_avg": report["macro avg"],
            "weighted_avg": report["weighted avg"],
        },
        "note": (
            "Metrics are calculated on historical held-out test data. "
            "They describe this dataset evaluation, not real-world "
            "wildfire prediction accuracy."
        ),
    }
