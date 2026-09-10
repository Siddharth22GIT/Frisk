/**
 * Frisk API Gateway — Express.js
 * - API-key auth
 * - Proxies /api/* to FastAPI ML service
 * - Webhook dispatcher
 * - CSV/PDF export
 * - Swagger UI at /docs
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
const YAML = require("yaml");
const swaggerUi = require("swagger-ui-express");
const rateLimit = require("express-rate-limit");

const app = express();
app.set("trust proxy", 1);
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

const ML_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";
const FRISK_API_KEY = process.env.FRISK_API_KEY || "frisk-demo-key-2024";
const PORT = process.env.PORT || 4000;

// In-memory webhook registry (use Redis/DB in production)
const webhookRegistry = {};
// In-memory results store for reports
const resultStore = { fraud: [], returns: [], chargebacks: [] };

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 60_000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});
app.use(limiter);

// ── Swagger ────────────────────────────────────────────────────────────────────
const swaggerFile = path.join(__dirname, "swagger.yaml");
if (fs.existsSync(swaggerFile)) {
  const swaggerDoc = YAML.parse(fs.readFileSync(swaggerFile, "utf8"));
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDoc, { customSiteTitle: "Frisk API" }));
}

// ── Auth middleware ────────────────────────────────────────────────────────────
function requireApiKey(req, res, next) {
  const key = req.headers["x-api-key"];
  if (!key || key !== FRISK_API_KEY) {
    return res.status(403).json({ error: "Invalid or missing X-API-Key header." });
  }
  next();
}

// ── Webhook dispatcher ─────────────────────────────────────────────────────────
async function dispatchWebhook(merchantId, module, data) {
  const url = webhookRegistry[merchantId];
  if (!url) return;
  try {
    await axios.post(url, { module, timestamp: new Date().toISOString(), data }, { timeout: 5000 });
  } catch (e) {
    console.error(`Webhook dispatch failed for merchant ${merchantId}:`, e.message);
  }
}

// ── Proxy helper ───────────────────────────────────────────────────────────────
async function proxyToML(mlPath, req, res, module) {
  try {
    const headers = { "X-API-Key": FRISK_API_KEY };
    let response;

    if (req.file) {
      // Multipart CSV upload
      const form = new FormData();
      form.append("file", req.file.buffer, {
        filename: req.file.originalname || "upload.csv",
        contentType: req.file.mimetype || "text/csv",
      });
      response = await axios.post(`${ML_URL}${mlPath}`, form, {
        headers: { ...headers, ...form.getHeaders() },
        timeout: 60_000,
      });
    } else {
      // JSON body
      response = await axios.post(`${ML_URL}${mlPath}`, req.body, { headers, timeout: 60_000 });
    }

    // Store results for reports
    if (module && response.data) {
      const items = response.data.transactions || response.data.orders || [response.data];
      resultStore[module].push(...items.slice(0, 500));
      if (resultStore[module].length > 2000) resultStore[module] = resultStore[module].slice(-2000);
    }

    // Dispatch webhook if registered
    const merchantId = req.headers["x-merchant-id"] || "default";
    dispatchWebhook(merchantId, module, response.data);

    res.json(response.data);
  } catch (err) {
    const status = err.response?.status || 500;
    const detail = err.response?.data?.detail || err.message;
    res.status(status).json({ error: detail });
  }
}

// ── Fraud endpoints ────────────────────────────────────────────────────────────
app.post("/api/fraud/detect", requireApiKey, upload.single("file"), (req, res) =>
  proxyToML("/fraud/detect", req, res, "fraud")
);
app.post("/api/fraud/detect/json", requireApiKey, (req, res) =>
  proxyToML("/fraud/detect/json", req, res, "fraud")
);
app.get("/api/fraud/demo", requireApiKey, async (req, res) => {
  try {
    const r = await axios.get(`${ML_URL}/fraud/demo`, { headers: { "X-API-Key": FRISK_API_KEY } });
    res.json(r.data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Returns endpoints ──────────────────────────────────────────────────────────
app.post("/api/returns/score", requireApiKey, upload.single("file"), (req, res) =>
  proxyToML("/returns/score", req, res, "returns")
);
app.post("/api/returns/score/json", requireApiKey, (req, res) =>
  proxyToML("/returns/score/json", req, res, "returns")
);
app.get("/api/returns/demo", requireApiKey, async (req, res) => {
  try {
    const r = await axios.get(`${ML_URL}/returns/demo`, { headers: { "X-API-Key": FRISK_API_KEY } });
    res.json(r.data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Chargeback endpoints ───────────────────────────────────────────────────────
app.post("/api/chargebacks/respond", requireApiKey, async (req, res) => {
  try {
    const r = await axios.post(`${ML_URL}/chargebacks/respond`, req.body, {
      headers: { "X-API-Key": FRISK_API_KEY },
      timeout: 30_000,
    });
    resultStore.chargebacks.push(r.data);
    res.json(r.data);
  } catch (e) {
    res.status(e.response?.status || 500).json({ error: e.response?.data?.detail || e.message });
  }
});

// ── Webhook registration ───────────────────────────────────────────────────────
app.post("/api/webhooks/register", requireApiKey, (req, res) => {
  const { merchantId, url } = req.body;
  if (!merchantId || !url) return res.status(400).json({ error: "merchantId and url required." });
  webhookRegistry[merchantId] = url;
  res.json({ message: `Webhook registered for merchant ${merchantId}`, url });
});
app.get("/api/webhooks", requireApiKey, (req, res) => res.json(webhookRegistry));

// ── Reports / Export ───────────────────────────────────────────────────────────
app.get("/api/reports/summary", requireApiKey, (req, res) => {
  res.json({
    fraud: { count: resultStore.fraud.length, flagged: resultStore.fraud.filter(t => t.flagged).length },
    returns: { count: resultStore.returns.length, high_risk: resultStore.returns.filter(o => o.risk_tier === "High").length },
    chargebacks: { count: resultStore.chargebacks.length },
  });
});

app.get("/api/reports/export/csv", requireApiKey, (req, res) => {
  const module = req.query.module || "fraud";
  const data = resultStore[module] || [];
  if (!data.length) return res.status(404).json({ error: "No data to export." });

  const headers = Object.keys(data[0]);
  const csv = [headers.join(","), ...data.map(row =>
    headers.map(h => JSON.stringify(row[h] ?? "")).join(",")
  )].join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename=frisk_${module}_export.csv`);
  res.send(csv);
});

app.get("/api/reports/export/pdf", requireApiKey, (req, res) => {
  const module = req.query.module || "fraud";
  const data = resultStore[module] || [];
  const PDFDocument = require("pdfkit");
  const doc = new PDFDocument({ margin: 40 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=frisk_${module}_report.pdf`);
  doc.pipe(res);

  // Header
  doc.fontSize(22).font("Helvetica-Bold").text("Frisk Risk Report", { align: "center" });
  doc.fontSize(12).font("Helvetica").text(`Module: ${module.toUpperCase()}`, { align: "center" });
  doc.text(`Generated: ${new Date().toUTCString()}`, { align: "center" });
  doc.moveDown(1.5);

  if (!data.length) {
    doc.text("No data available for this module.", { align: "center" });
  } else {
    data.slice(0, 100).forEach((row, i) => {
      doc.fontSize(9).font("Helvetica-Bold").text(`Record ${i + 1}`, { continued: false });
      Object.entries(row).forEach(([k, v]) => {
        doc.fontSize(8).font("Helvetica").text(`  ${k}: ${JSON.stringify(v)}`);
      });
      doc.moveDown(0.5);
      if (i > 0 && i % 20 === 0) doc.addPage();
    });
  }

  doc.end();
});

// ── Health ─────────────────────────────────────────────────────────────────────
app.get("/health", (req, res) => res.json({ status: "ok", service: "frisk-gateway" }));

// ── Start ──────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Frisk Gateway running on http://localhost:${PORT}`);
  console.log(`📖 Swagger docs: http://localhost:${PORT}/docs`);
});
