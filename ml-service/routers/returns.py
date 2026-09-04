"""
Return Risk Scorer router.
POST /returns/score  — accepts JSON order metadata or CSV batch
Returns return probability, risk tier, recommended action,
and live AUC-ROC + confusion matrix.
"""

import io
import logging

import numpy as np
import pandas as pd
from fastapi import APIRouter, File, UploadFile, HTTPException, Body
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from models.train import (
    load_returns_model,
    load_returns_metrics,
    make_returns_features,
)

logger = logging.getLogger(__name__)
router = APIRouter()

TIER_LABELS = {
    "Low": "Safe to fulfil — standard processing.",
    "Medium": "Review Needed — verify order details before shipping.",
    "High": "High Risk — consider additional verification or restrict.",
}


def _tier(prob: float) -> str:
    if prob >= 0.65:
        return "High"
    elif prob >= 0.35:
        return "Medium"
    return "Low"


class OrderMetadata(BaseModel):
    order_id: str | None = None
    product_category: str = "Electronics"
    customer_return_rate: float = 0.1
    order_value: float = 150.0
    region: str = "North America"
    days_since_last_order: int = 30
    customer_age_days: int = 365
    num_prev_orders: int = 10
    is_gift: int = 0
    return_label: int | None = None


def _run_scoring(df: pd.DataFrame):
    model, encoders = load_returns_model()
    baseline_metrics = load_returns_metrics()

    X, _ = make_returns_features(df, encoders)
    probs = model.predict_proba(X)[:, 1]

    results = []
    for i, (_, row) in enumerate(df.iterrows()):
        prob = float(probs[i])
        tier = _tier(prob)
        results.append({
            "order_id": row.get("order_id", f"ORD{i:05d}"),
            "product_category": str(row.get("product_category", "")),
            "order_value": float(row.get("order_value", 0)),
            "return_probability": round(prob, 4),
            "risk_tier": tier,
            "recommended_action": TIER_LABELS[tier],
        })

    # ── Live metrics ───────────────────────────────────────────────────────────
    metrics = dict(baseline_metrics)
    if "return_label" in df.columns and df["return_label"].notna().any():
        from sklearn.metrics import roc_auc_score, confusion_matrix
        y_true = df["return_label"].fillna(0).astype(int)
        auc = round(roc_auc_score(y_true, probs), 4) if len(y_true.unique()) > 1 else 0.0
        preds = (probs >= 0.5).astype(int)
        cm = confusion_matrix(y_true, preds).tolist()
        metrics = {"auc_roc": auc, "confusion_matrix": cm, "source": "uploaded_batch"}

    summary = {
        "total": len(results),
        "high_risk": sum(1 for r in results if r["risk_tier"] == "High"),
        "medium_risk": sum(1 for r in results if r["risk_tier"] == "Medium"),
        "low_risk": sum(1 for r in results if r["risk_tier"] == "Low"),
    }
    return {"orders": results, "metrics": metrics, "summary": summary}


@router.post("/score")
async def score_returns_csv(file: UploadFile = File(...)):
    """Upload a CSV file of orders for return risk scoring."""
    try:
        content = await file.read()
        df = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid CSV: {e}")
    return JSONResponse(_run_scoring(df))


@router.post("/score/json")
async def score_returns_json(orders: list[OrderMetadata] = Body(...)):
    """Submit a JSON array of orders for return risk scoring."""
    if not orders:
        raise HTTPException(status_code=400, detail="Empty order list.")
    df = pd.DataFrame([o.model_dump() for o in orders])
    return JSONResponse(_run_scoring(df))


@router.get("/demo")
async def demo_returns():
    """Run scoring on the seeded demo dataset."""
    from data.seed import ORDERS_PATH
    df = pd.read_csv(ORDERS_PATH)
    return JSONResponse(_run_scoring(df))
