from functools import lru_cache
from pathlib import Path

import joblib
import pandas as pd
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
)

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATA_FILE = PROJECT_ROOT / "data" / "next_day_fire_dataset.csv"
MODEL_FILE = PROJECT_ROOT / "models" / "forest_fire_model.pkl"


@lru_cache(maxsize=1)
def get_model_comparison():
    if not DATA_FILE.exists():
        raise FileNotFoundError("Comparison dataset was not found.")

    if not MODEL_FILE.exists():
        raise FileNotFoundError("Saved Random Forest model was not found.")

    bundle = joblib.load(MODEL_FILE)

    features = bundle["features"]
    target = bundle["target"]
    cutoff = pd.Timestamp(bundle["training_cutoff"])
    threshold = float(bundle["threshold"])

    df = pd.read_csv(DATA_FILE, parse_dates=["DATE"])
    df = df.sort_values("DATE").reset_index(drop=True)

    train = df[df["DATE"] < cutoff].copy()
    test = df[df["DATE"] >= cutoff].copy()

    if train.empty or test.empty:
        raise ValueError("Training or testing split is empty.")

    X_train = train[features]
    y_train = train[target].astype(int)
    X_test = test[features]
    y_test = test[target].astype(int)

    if y_train.nunique() < 2 or y_test.nunique() < 2:
        raise ValueError("Both splits must contain two target classes.")

    logistic_model = make_pipeline(
        StandardScaler(),
        LogisticRegression(
            max_iter=2000,
            class_weight="balanced",
            random_state=42,
        ),
    )

    logistic_model.fit(X_train, y_train)

    random_forest = bundle["model"]

    model_definitions = [
        ("Logistic Regression", logistic_model),
        ("Random Forest", random_forest),
    ]

    results = []

    for name, model in model_definitions:
        probabilities = model.predict_proba(X_test)[:, 1]
        predictions = (probabilities >= threshold).astype(int)

        tn, fp, fn, tp = confusion_matrix(
            y_test, predictions, labels=[0, 1]
        ).ravel()

        results.append({
            "name": name,
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
        })

    return {
        "training_cutoff": cutoff.strftime("%Y-%m-%d"),
        "test_rows": int(len(test)),
        "test_date_start": test["DATE"].min().strftime("%Y-%m-%d"),
        "test_date_end": test["DATE"].max().strftime("%Y-%m-%d"),
        "threshold": threshold,
        "models": results,
        "note": (
            "Both models use the same chronological training and test split, "
            "features, and decision threshold. Results describe historical "
            "held-out dataset performance, not real-world wildfire warnings."
        ),
    }
