import axios from "axios";

const API_KEY = import.meta.env.VITE_API_KEY || "frisk-demo-key-2024";
const BASE_URL = "/api";

const client = axios.create({
  baseURL: BASE_URL,
  headers: { "X-API-Key": API_KEY },
  timeout: 60_000,
});

// ── Fraud ────────────────────────────────────────────────────────────────────
export async function detectFraudCsv(file, onProgress) {
  const form = new FormData();
  form.append("file", file);
  const { data } = await client.post("/fraud/detect", form, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => onProgress && onProgress(Math.round((e.loaded / e.total) * 100)),
  });
  return data;
}

export async function detectFraudJson(transactions) {
  const { data } = await client.post("/fraud/detect/json", transactions);
  return data;
}

export async function getFraudDemo() {
  const { data } = await client.get("/fraud/demo");
  return data;
}

// ── Returns ──────────────────────────────────────────────────────────────────
export async function scoreReturnsCsv(file, onProgress) {
  const form = new FormData();
  form.append("file", file);
  const { data } = await client.post("/returns/score", form, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => onProgress && onProgress(Math.round((e.loaded / e.total) * 100)),
  });
  return data;
}

export async function scoreReturnsJson(orders) {
  const { data } = await client.post("/returns/score/json", orders);
  return data;
}

export async function getReturnsDemo() {
  const { data } = await client.get("/returns/demo");
  return data;
}

// ── Chargebacks ──────────────────────────────────────────────────────────────
export async function respondChargeback(payload) {
  const { data } = await client.post("/chargebacks/respond", payload);
  return data;
}

// ── Reports ──────────────────────────────────────────────────────────────────
export async function getReportsSummary() {
  const { data } = await client.get("/reports/summary");
  return data;
}

export function exportCsvUrl(module) {
  return `${BASE_URL}/reports/export/csv?module=${module}`;
}

export function exportPdfUrl(module) {
  return `${BASE_URL}/reports/export/pdf?module=${module}`;
}

export async function downloadExport(url, filename) {
  const response = await client.get(url.replace(BASE_URL, ""), { responseType: "blob" });
  const blob = new Blob([response.data]);
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
