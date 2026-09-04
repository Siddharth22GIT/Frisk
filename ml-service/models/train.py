"""
Model training — Isolation Forest (fraud) + XGBoost (returns).
Runs at service startup if serialised models are absent.
"""

import os
import logging
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import LabelEncoder
from xgboost import XGBClassifier

logger = logging.getLogger(__name__)

MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "model_artifacts")
FRAUD_MODEL_PATH = os.path.join(MODELS_DIR, "fraud_model.pkl")
FRAUD_ENCODERS_PATH = os.path.join(MODELS_DIR, "fraud_encoders.pkl")
RETURNS_MODEL_PATH = os.path.join(MODELS_DIR, "returns_model.pkl")
RETURNS_ENCODERS_PATH = os.path.join(MODELS_DIR, "returns_encoders.pkl")
RETURNS_METRICS_PATH = os.path.join(MODELS_DIR, "returns_metrics.pkl")
FRAUD_METRICS_PATH = os.path.join(MODELS_DIR, "fraud_metrics.pkl")

FRAUD_FEATURES = [
    "amount", "num_transactions_24h", "time_of_day",
    "is_international", "customer_age_days", "prev_chargebacks",
    "merchant_category_enc", "device_type_enc",
]
RETURNS_FEATURES = [
    "order_value", "customer_return_rate", "days_since_last_order",
    "customer_age_days", "num_prev_orders", "is_gift",
    "product_category_enc", "region_enc",
]


def _make_fraud_features(df: pd.DataFrame, encoders: dict | None = None):
    out = df.copy()
    if encoders is None:
        encoders = {}
        for col in ("merchant_category", "device_type"):
            le = LabelEncoder()
            out[f"{col}_enc"] = le.fit_transform(out[col].astype(str))
            encoders[col] = le
    else:
        for col in ("merchant_category", "device_type"):
            le = encoders[col]
            out[f"{col}_enc"] = out[col].astype(str).map(
                lambda x: le.transform([x])[0] if x in le.classes_ else -1
            )
    return out[FRAUD_FEATURES], encoders


def _make_returns_features(df: pd.DataFrame, encoders: dict | None = None):
    out = df.copy()
    if encoders is None:
        encoders = {}
        for col in ("product_category", "region"):
            le = LabelEncoder()
            out[f"{col}_enc"] = le.fit_transform(out[col].astype(str))
            encoders[col] = le
    else:
        for col in ("product_category", "region"):
            le = encoders[col]
            out[f"{col}_enc"] = out[col].astype(str).map(
                lambda x: le.transform([x])[0] if x in le.classes_ else -1
            )
    return out[RETURNS_FEATURES], encoders


def train_fraud_model():
    from data.seed import generate_transactions
    logger.info("Training Isolation Forest on synthetic transactions…")
    df = generate_transactions(n=600)
    X, encoders = _make_fraud_features(df)

    model = IsolationForest(
        n_estimators=200,
        contamination=0.15,
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X)

    # Compute baseline metrics on held-out 20%
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import precision_score, recall_score, f1_score

    X_train, X_test, y_train, y_test = train_test_split(
        X, df["fraud_label"], test_size=0.2, random_state=42, stratify=df["fraud_label"]
    )
    model_eval = IsolationForest(n_estimators=200, contamination=0.15, random_state=42, n_jobs=-1)
    model_eval.fit(X_train)
    preds = (model_eval.predict(X_test) == -1).astype(int)
    precision = round(precision_score(y_test, preds, zero_division=0), 4)
    recall = round(recall_score(y_test, preds, zero_division=0), 4)
    f1 = round(f1_score(y_test, preds, zero_division=0), 4)
    fp = int(((preds == 1) & (y_test == 0)).sum())
    tn = int(((preds == 0) & (y_test == 0)).sum())
    fpr = round(fp / (fp + tn) if (fp + tn) > 0 else 0.0, 4)

    metrics = {"precision": precision, "recall": recall, "f1": f1, "fpr": fpr, "source": "baseline"}
    joblib.dump(model, FRAUD_MODEL_PATH)
    joblib.dump(encoders, FRAUD_ENCODERS_PATH)
    joblib.dump(metrics, FRAUD_METRICS_PATH)
    logger.info(f"Fraud model saved. Baseline metrics: {metrics}")
    return model, encoders, metrics


def train_returns_model():
    from data.seed import generate_orders
    logger.info("Training XGBoost on synthetic orders…")
    df = generate_orders(n=600)
    X, encoders = _make_returns_features(df)
    y = df["return_label"]

    from sklearn.model_selection import train_test_split
    from sklearn.metrics import roc_auc_score, confusion_matrix

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    model = XGBClassifier(
        n_estimators=300,
        max_depth=5,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        use_label_encoder=False,
        eval_metric="logloss",
        random_state=42,
    )
    model.fit(X_train, y_train, eval_set=[(X_test, y_test)], verbose=False)

    probs = model.predict_proba(X_test)[:, 1]
    auc = round(roc_auc_score(y_test, probs), 4)
    preds = (probs >= 0.5).astype(int)
    cm = confusion_matrix(y_test, preds).tolist()
    metrics = {"auc_roc": auc, "confusion_matrix": cm, "source": "baseline"}

    joblib.dump(model, RETURNS_MODEL_PATH)
    joblib.dump(encoders, RETURNS_ENCODERS_PATH)
    joblib.dump(metrics, RETURNS_METRICS_PATH)
    logger.info(f"Returns model saved. AUC-ROC: {auc}")
    return model, encoders, metrics


def ensure_models_trained():
    os.makedirs(MODELS_DIR, exist_ok=True)
    from data.seed import seed_data
    seed_data()

    if not os.path.exists(FRAUD_MODEL_PATH):
        train_fraud_model()
    else:
        logger.info("Fraud model already exists — skipping training.")

    if not os.path.exists(RETURNS_MODEL_PATH):
        train_returns_model()
    else:
        logger.info("Returns model already exists — skipping training.")


def load_fraud_model():
    return joblib.load(FRAUD_MODEL_PATH), joblib.load(FRAUD_ENCODERS_PATH)


def load_returns_model():
    return joblib.load(RETURNS_MODEL_PATH), joblib.load(RETURNS_ENCODERS_PATH)


def load_fraud_metrics():
    return joblib.load(FRAUD_METRICS_PATH) if os.path.exists(FRAUD_METRICS_PATH) else {}


def load_returns_metrics():
    return joblib.load(RETURNS_METRICS_PATH) if os.path.exists(RETURNS_METRICS_PATH) else {}


# Re-export feature helpers for routers
def make_fraud_features(df, encoders=None):
    return _make_fraud_features(df, encoders)


def make_returns_features(df, encoders=None):
    return _make_returns_features(df, encoders)
