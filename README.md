# Frisk — AI Risk Manager for Payment Merchants

> Production-ready monorepo: React + Tailwind frontend · Node.js/Express gateway · Python FastAPI ML microservice

---

## 🚀 One-Command Startup

```bash
cp .env.example .env
# Edit .env — add your GROQ_API_KEY (free at console.groq.com)
docker-compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| API Gateway + Swagger | http://localhost:4000/docs |
| ML Service + OpenAPI | http://localhost:8000/docs |

---

## 🔧 Local Development (without Docker)

### 1 — ML Service

```bash
cd ml-service
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Models train automatically on first start (~10 seconds). Demo CSV data is seeded in `ml-service/data/`.

### 2 — Backend Gateway

```bash
cd backend
npm install
cp ../.env.example .env   # fill in values
node index.js             # or: npx nodemon index.js
```

### 3 — Frontend

```bash
cd frontend
npm install
npm run dev   # opens http://localhost:3000
```

---

## 🔑 Environment Variables

| Variable | Default | Description |
|---|---|---|
| `FRISK_API_KEY` | `frisk-demo-key-2024` | API key for all authenticated requests |
| `GROQ_API_KEY` | *(empty)* | Groq API key for chargeback evidence generation |
| `ML_SERVICE_URL` | `http://ml-service:8000` | ML service URL (auto in Docker) |

Without a Groq key, the Chargeback module returns a realistic mock response — the rest of the app is fully functional.

---

## 📋 API Reference

### Fraud Detection
```
POST /api/fraud/detect          — CSV file upload
POST /api/fraud/detect/json     — JSON array body
GET  /api/fraud/demo            — Run on seeded demo data
```

### Return Risk Scoring
```
POST /api/returns/score         — CSV file upload
POST /api/returns/score/json    — JSON array body
GET  /api/returns/demo          — Run on seeded demo data
```

### Chargeback Responder
```
POST /api/chargebacks/respond   — Generate dispute evidence
```

### Webhooks & Reports
```
POST /api/webhooks/register     — Register merchant webhook URL
GET  /api/reports/summary       — Aggregate stats
GET  /api/reports/export/csv?module=fraud|returns|chargebacks
GET  /api/reports/export/pdf?module=fraud|returns|chargebacks
```

All endpoints require `X-API-Key: frisk-demo-key-2024` header.

---

## 🏗️ Architecture

```
Browser → React/Tailwind (Vite, port 3000)
            ↓  X-API-Key header
         Express Gateway (port 4000)
            ↓ proxy
         FastAPI ML Service (port 8000)
            ├── Isolation Forest (fraud)
            ├── XGBoost (returns)
            └── Groq LLaMA-3.3-70b (chargebacks)
```

### ML Models
- **Fraud:** Isolation Forest (sklearn), contamination=0.15, 200 estimators
- **Returns:** XGBoost binary classifier, trained on 480 synthetic orders
- Models are serialised to `ml-service/model_artifacts/` and reloaded on restart

---

## 📊 Demo Data

Pre-seeded realistic datasets auto-generated on first boot:
- `ml-service/data/transactions_demo.csv` — 600 transactions (15% fraud injected)
- `ml-service/data/orders_demo.csv` — 600 orders (realistic return patterns)

Click **Load Demo Data** on any module page — no upload required.

---

## 🔔 Webhook Integration

Register your endpoint to receive flagged results in real time:

```bash
curl -X POST http://localhost:4000/api/webhooks/register \
  -H "X-API-Key: frisk-demo-key-2024" \
  -H "Content-Type: application/json" \
  -d '{"merchantId": "my_store", "url": "https://your-site.com/hooks/frisk"}'
```

Frisk will POST to your URL after every detection with module name, timestamp, and results.
