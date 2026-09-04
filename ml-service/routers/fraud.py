"""
Fraud Spike Detector router.
POST /fraud/detect  — accepts CSV file (multipart) or JSON array body
Returns flagged transactions with risk score 0-100, anomaly reason,
and live precision/recall/F1/FPR metrics on the uploaded batch.
"""

import io
import logging
from typing import Any

import numpy as np
import pandas as pd
from fastapi import APIRouter, File, UploadFile, HTTPException, Body
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from models.train import (
    load_fraud_model,
    load_fraud_metrics,
    make_fraud_features,
    FRAUD_FEATURES,
)

logger = logging.getLogger(__name__)
router = APIRouter()

# ── Anomaly reason logic ───────────────────────────────────────────────────────

def _anomaly_reasons(row: pd.Series) -> list[str]:
    reasons = []
    if row.get("amount", 0) > 2000:
        reasons.append("Unusually large transaction amount")
    if row.get("num_transactions_24h", 0) > 20:
        reasons.append("High transaction velocity in 24h")
    if row.get("time_of_day", 12) <= 4:
        reasons.append("Transaction at unusual hour (00:00–04:00)")
    if row.get("is_international", 0):
        reasons.append("International transaction")
    if row.get("customer_age_days", 999) < 30:
        reasons.append("New customer account (< 30 days)")
    if row.get("prev_chargebacks", 0) >= 2:
        reasons.append("Multiple previous chargebacks on account")
    return reasons or ["Statistical anomaly detected by model"]


def _risk_score(decision: float, min_d: float, max_d: float) -> int:
    """Convert Isolation Forest decision_function (higher = more normal) to 0-100 risk."""
    score = 1 - (decision - min_d) / (max_d - min_d + 1e-9)
    return int(np.clip(score * 100, 0, 100))


# ── Schema ─────────────────────────────────────────────────────────────────────

class Transaction(BaseModel):
    transaction_id: str | None = None
    amount: float = 100.0
    merchant_category: str = "Electronics"
    num_transactions_24h: int = 5
    time_of_day: int = 14
    is_international: int = 0
    device_type: str = "desktop"
    customer_age_days: int = 365
    prev_chargebacks: int = 0
    fraud_label: int | None = None
    timestamp: str | None = None


# ── Helpers ─────────────────────────────────────────────────────────────────────

def _run_detection(df: pd.DataFrame):
    model, encoders = load_fraud_model()
    baseline_metrics = load_fraud_metrics()

    X, _ = make_fraud_features(df, encoders)
    decisions = model.decision_function(X)
    predictions = model.predict(X)  # 1=normal, -1=anomaly

    min_d, max_d = decisions.min(), decisions.max()
    results = []
    for i, (_, row) in enumerate(df.iterrows()):
        is_flagged = predictions[i] == -1
        risk_score = _risk_score(decisions[i], min_d, max_d)
        reasons = _anomaly_reasons(row) if is_flagged else []

        if risk_score >= 70:
            risk_tier = "High Risk"
        elif risk_score >= 40:
            risk_tier = "Review Needed"
        else:
            risk_tier = "Safe"

        results.append({
            "transaction_id": row.get("transaction_id", f"TXN{i:05d}"),
            "amount": float(row.get("amount", 0)),
            "risk_score": risk_score,
            "risk_tier": risk_tier,
            "flagged": bool(is_flagged),
            "anomaly_reasons": reasons,
            "timestamp": str(row.get("timestamp", "")),
            "merchant_category": str(row.get("merchant_category", "")),
        })

    # ── Live metrics (if labels present) ──────────────────────────────────────
    metrics = dict(baseline_metrics)
    if "fraud_label" in df.columns and df["fraud_label"].notna().any():
        from sklearn.metrics import precision_score, recall_score, f1_score
        y_true = df["fraud_label"].fillna(0).astype(int)
        y_pred = (np.array(predictions) == -1).astype(int)
        metrics = {
            "precision": round(precision_score(y_true, y_pred, zero_division=0), 4),
            "recall": round(recall_score(y_true, y_pred, zero_division=0), 4),
            "f1": round(f1_score(y_true, y_pred, zero_division=0), 4),
            "fpr": round(
                ((y_pred == 1) & (y_true == 0)).sum() / max(((y_true == 0).sum()), 1), 4
            ),
            "source": "uploaded_batch",
        }

    summary = {
        "total": len(results),
        "flagged": sum(1 for r in results if r["flagged"]),
        "safe": sum(1 for r in results if not r["flagged"]),
    }
    return {"transactions": results, "metrics": metrics, "summary": summary}


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/detect")
async def detect_fraud_csv(file: UploadFile = File(...)):
    """Upload a CSV file of transactions for batch fraud detection."""
    try:
        content = await file.read()
        df = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid CSV: {e}")
    return JSONResponse(_run_detection(df))


@router.post("/detect/json")
async def detect_fraud_json(transactions: list[Transaction] = Body(...)):
    """Submit a JSON array of transactions for fraud detection."""
    if not transactions:
        raise HTTPException(status_code=400, detail="Empty transaction list.")
    df = pd.DataFrame([t.model_dump() for t in transactions])
    return JSONResponse(_run_detection(df))


@router.get("/demo")
async def demo_fraud():
    """Run detection on the seeded demo dataset (no upload needed)."""
    from data.seed import TRANSACTIONS_PATH
    df = pd.read_csv(TRANSACTIONS_PATH)
    return JSONResponse(_run_detection(df))
