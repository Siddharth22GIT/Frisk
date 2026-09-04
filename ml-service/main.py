"""
Frisk ML Microservice — FastAPI entry point
Exposes: /fraud, /returns, /chargebacks, /health, /docs (auto)
"""

import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Security, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security.api_key import APIKeyHeader
from dotenv import load_dotenv

from routers import fraud, returns, chargebacks
from models.train import ensure_models_trained

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

FRISK_API_KEY = os.getenv("FRISK_API_KEY", "frisk-demo-key-2024")
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def verify_api_key(api_key: str = Security(api_key_header)):
    if api_key != FRISK_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid or missing API key. Pass X-API-Key header.",
        )
    return api_key


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀  Frisk ML Service starting — ensuring models are trained…")
    ensure_models_trained()
    logger.info("✅  Models ready.")
    yield
    logger.info("👋  Frisk ML Service shutting down.")


app = FastAPI(
    title="Frisk ML Microservice",
    description=(
        "AI Risk Manager for payment merchants. "
        "Provides fraud detection (Isolation Forest), "
        "return risk scoring (XGBoost), and chargeback evidence generation (Groq LLaMA-3)."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ────────────────────────────────────────────────────────────────────
app.include_router(fraud.router, prefix="/fraud", tags=["Fraud Detection"], dependencies=[Security(verify_api_key)])
app.include_router(returns.router, prefix="/returns", tags=["Return Risk"], dependencies=[Security(verify_api_key)])
app.include_router(chargebacks.router, prefix="/chargebacks", tags=["Chargeback Responder"], dependencies=[Security(verify_api_key)])


@app.get("/health", tags=["System"])
async def health():
    return {"status": "ok", "service": "frisk-ml"}
