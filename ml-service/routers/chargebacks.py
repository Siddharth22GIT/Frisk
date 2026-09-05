"""
Chargeback Evidence Responder router.
POST /chargebacks/respond — accepts transaction_id + claim_text
Uses Groq LLaMA-3.3-70b to generate a structured dispute evidence document.
"""

import os
import json
import logging
from datetime import datetime

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
FALLBACK_MODELS = [
    GROQ_MODEL,
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "groq/compound-mini",
    "qwen/qwen3.8-27b",
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
]


class ChargebackRequest(BaseModel):
    transaction_id: str
    claim_text: str
    transaction_amount: float | None = None
    transaction_date: str | None = None
    merchant_name: str | None = "Merchant"
    customer_name: str | None = None
    product_description: str | None = None


def _build_prompt(req: ChargebackRequest) -> str:
    txn_context = f"""
Transaction ID: {req.transaction_id}
Transaction Amount: ${req.transaction_amount or 'Unknown'}
Transaction Date: {req.transaction_date or 'Unknown'}
Merchant: {req.merchant_name}
Customer: {req.customer_name or 'Unknown'}
Product/Service: {req.product_description or 'Unknown'}
"""
    return f"""You are a payment dispute specialist helping a merchant respond to a chargeback claim.

Transaction Details:
{txn_context}

Chargeback Claim from Customer:
"{req.claim_text}"

Generate a comprehensive, professional chargeback dispute response. Return ONLY valid JSON with exactly these keys:

{{
  "case_summary": "One paragraph executive summary of the dispute",
  "timeline": [
    {{"date": "YYYY-MM-DD", "event": "Description of event", "evidence_type": "order_record|payment_log|shipping|communication|policy"}}
  ],
  "flags": [
    {{"type": "Inconsistency|Policy Violation|Suspicious Pattern|Missing Evidence", "description": "Detail"}}
  ],
  "rebuttal_points": [
    {{"point": "Short title", "argument": "Full rebuttal argument", "evidence": "Supporting evidence description"}}
  ],
  "evidence_checklist": [
    {{"item": "Evidence item name", "status": "Available|Recommended|Required", "description": "What this proves"}}
  ],
  "recommended_outcome": "Win|Partial|Settle",
  "confidence_score": 0.0,
  "merchant_liability_notes": "Notes on merchant liability and next steps"
}}

Be specific, professional, and legally precise. Use payment industry terminology."""


def _generate_with_groq(req: ChargebackRequest) -> tuple[dict, str]:
    from groq import Groq
    client = Groq(api_key=GROQ_API_KEY)
    
    # Deduplicate candidate models
    candidates = []
    for m in FALLBACK_MODELS:
        if m and m not in candidates:
            candidates.append(m)

    last_error = None
    for model_name in candidates:
        try:
            logger.info(f"Attempting Groq generation with model: {model_name}")
            response = client.chat.completions.create(
                model=model_name,
                messages=[{"role": "user", "content": _build_prompt(req)}],
                response_format={"type": "json_object"},
                temperature=0.2,
                max_tokens=2048,
            )
            parsed = json.loads(response.choices[0].message.content)
            return parsed, model_name
        except Exception as e:
            logger.warning(f"Groq model {model_name} failed: {e}. Trying next fallback...")
            last_error = e

    logger.error(f"All Groq models failed. Last error: {last_error}")
    raise HTTPException(status_code=502, detail=f"AI service error: {str(last_error)}")


def _mock_response(req: ChargebackRequest) -> dict:
    """Fallback if no Groq key configured."""
    return {
        "case_summary": (
            f"Merchant disputes chargeback on transaction {req.transaction_id}. "
            "Customer claim appears inconsistent with order and delivery records. "
            "Merchant has strong evidence supporting the validity of this transaction."
        ),
        "timeline": [
            {"date": req.transaction_date or "2024-01-15", "event": "Order placed and payment authorised", "evidence_type": "order_record"},
            {"date": req.transaction_date or "2024-01-15", "event": "Payment captured successfully", "evidence_type": "payment_log"},
            {"date": "2024-01-17", "event": "Order confirmed and dispatched", "evidence_type": "shipping"},
            {"date": "2024-01-20", "event": "Delivery confirmed at registered address", "evidence_type": "shipping"},
            {"date": "2024-02-01", "event": "Chargeback claim filed by customer", "evidence_type": "communication"},
        ],
        "flags": [
            {"type": "Inconsistency", "description": "Delivery was confirmed at the customer's registered address prior to the dispute date."},
            {"type": "Suspicious Pattern", "description": "Chargeback filed 15+ days after confirmed delivery with no prior complaint."},
        ],
        "rebuttal_points": [
            {
                "point": "Proof of delivery",
                "argument": "Tracking records confirm successful delivery to the customer's address on file before the dispute was raised.",
                "evidence": "Courier tracking log, delivery confirmation signature"
            },
            {
                "point": "No prior contact",
                "argument": "Customer did not contact merchant support before initiating chargeback, violating standard dispute resolution protocol.",
                "evidence": "CRM communication logs showing no support tickets"
            },
        ],
        "evidence_checklist": [
            {"item": "Signed order confirmation", "status": "Available", "description": "Proves customer agreed to terms at purchase."},
            {"item": "IP address and device fingerprint", "status": "Available", "description": "Confirms customer's device initiated the transaction."},
            {"item": "Delivery proof", "status": "Available", "description": "Carrier confirmation of successful delivery."},
            {"item": "Terms of Service acceptance", "status": "Recommended", "description": "Confirms customer acknowledged refund/return policy."},
        ],
        "recommended_outcome": "Win",
        "confidence_score": 0.82,
        "merchant_liability_notes": "Strong case for full representment. Ensure all evidence is submitted within the chargeback response window (typically 20 days). Include ARN and order reference in all correspondence."
    }


@router.post("/respond")
async def chargeback_respond(req: ChargebackRequest):
    """Generate a structured chargeback dispute evidence response using Groq LLaMA-3."""
    if not GROQ_API_KEY or GROQ_API_KEY == "your_groq_api_key_here":
        logger.warning("No GROQ_API_KEY configured — returning mock response.")
        result = _mock_response(req)
        model_used = "mock"
    else:
        result, model_used = _generate_with_groq(req)

    result["transaction_id"] = req.transaction_id
    result["generated_at"] = datetime.utcnow().isoformat() + "Z"
    result["model_used"] = model_used
    return JSONResponse(result)
