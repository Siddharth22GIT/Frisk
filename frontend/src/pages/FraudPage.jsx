import { useState } from "react";
import toast from "react-hot-toast";
import { ShieldAlert, Upload, Code, Loader2, Download, FlaskConical, AlertTriangle, CheckCircle } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import FileUpload from "../components/FileUpload";
import RiskBadge from "../components/RiskBadge";
import MetricCard from "../components/MetricCard";
import { detectFraudCsv, detectFraudJson, getFraudDemo, downloadExport } from "../api/client";

const DEMO_JSON = `[
  {
    "transaction_id": "TXN00001",
    "amount": 4999.00,
    "merchant_category": "Electronics",
    "num_transactions_24h": 28,
    "time_of_day": 2,
    "is_international": 1,
    "device_type": "mobile",
    "customer_age_days": 5,
    "prev_chargebacks": 3
  }
]`;

const SCORE_COLOR = (s) => s >= 70 ? "#ef4444" : s >= 40 ? "#f59e0b" : "#10b981";

export default function FraudPage() {
  const [tab, setTab] = useState("csv"); // csv | json
  const [file, setFile] = useState(null);
  const [json, setJson] = useState(DEMO_JSON);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const run = async () => {
    setLoading(true);
    try {
      let data;
      if (tab === "csv" && file) {
        data = await detectFraudCsv(file);
      } else if (tab === "json") {
        data = await detectFraudJson(JSON.parse(json));
      } else {
        toast.error("Please upload a file or provide JSON.");
        return;
      }
      setResult(data);
      toast.success(`Analysed ${data.summary?.total ?? 0} transactions.`);
    } catch (e) {
      toast.error(e.response?.data?.error || e.message || "Analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  const runDemo = async () => {
    setLoading(true);
    try {
      const data = await getFraudDemo();
      setResult(data);
      toast.success("Demo data loaded!");
    } catch (e) {
      toast.error(e.message || "Demo failed.");
    } finally {
      setLoading(false);
    }
  };

  const { metrics, summary, transactions } = result || {};
  const chartData = transactions
    ? [...transactions].sort((a, b) => b.risk_score - a.risk_score).slice(0, 30)
    : [];

  return (
    <div className="p-8 animate-slide-up">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <ShieldAlert size={18} className="text-red-400" />
          <span className="text-xs font-semibold text-red-400 uppercase tracking-widest">Module 1</span>
        </div>
        <h1 className="text-3xl font-bold text-white">Fraud Spike Detector</h1>
        <p className="text-slate-400 mt-1">Upload transactions or paste JSON to detect fraud patterns with Isolation Forest.</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left — Input */}
        <div className="col-span-1 space-y-4">
          <div className="card">
            <div className="flex gap-1 p-1 rounded-xl bg-surface-muted mb-4">
              {["csv", "json"].map((t) => (
                <button
                  key={t}
                  id={`fraud-tab-${t}`}
                  onClick={() => setTab(t)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all
                    ${tab === t ? "bg-brand-600 text-white shadow" : "text-slate-400 hover:text-white"}`}
                >
                  {t === "csv" ? <Upload size={13} /> : <Code size={13} />}
                  {t.toUpperCase()}
                </button>
              ))}
            </div>

            {tab === "csv" ? (
              <FileUpload file={file} onFile={setFile} label="Drop transaction CSV" />
            ) : (
              <div>
                <label className="label">JSON Payload</label>
                <textarea
                  id="fraud-json-input"
                  value={json}
                  onChange={(e) => setJson(e.target.value)}
                  rows={12}
                  className="input-field font-mono text-xs resize-none"
                  placeholder="Paste transaction array…"
                />
              </div>
            )}

            <div className="flex gap-2 mt-4">
              <button
                id="fraud-run-btn"
                onClick={run}
                disabled={loading}
                className="btn-primary flex-1"
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : <ShieldAlert size={15} />}
                {loading ? "Analysing…" : "Detect Fraud"}
              </button>
              <button
                id="fraud-demo-btn"
                onClick={runDemo}
                disabled={loading}
                className="btn-secondary"
                title="Load demo data"
              >
                <FlaskConical size={15} />
              </button>
            </div>
          </div>

          {/* Metrics */}
          {metrics && (
            <div className="card animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">Model Performance</h3>
                <span className="text-[10px] text-slate-500 bg-surface-muted px-2 py-0.5 rounded-full border border-surface-border capitalize">
                  {metrics.source || "baseline"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <MetricCard label="Precision" value={`${((metrics.precision || 0) * 100).toFixed(1)}%`} color="emerald" />
                <MetricCard label="Recall" value={`${((metrics.recall || 0) * 100).toFixed(1)}%`} color="brand" />
                <MetricCard label="F1 Score" value={`${((metrics.f1 || 0) * 100).toFixed(1)}%`} color="violet" />
                <MetricCard label="False Positive Rate" value={`${((metrics.fpr || 0) * 100).toFixed(1)}%`} color="amber" />
              </div>
            </div>
          )}
        </div>

        {/* Right — Results */}
        <div className="col-span-2 space-y-4">
          {result && (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-3 gap-3 animate-fade-in">
                <div className="metric-block text-center">
                  <span className="label text-center">Total Checked</span>
                  <span className="text-2xl font-bold text-white">{summary?.total ?? 0}</span>
                </div>
                <div className="metric-block text-center">
                  <span className="label text-center">Flagged</span>
                  <span className="text-2xl font-bold text-red-400">{summary?.flagged ?? 0}</span>
                </div>
                <div className="metric-block text-center">
                  <span className="label text-center">Safe</span>
                  <span className="text-2xl font-bold text-emerald-400">{summary?.safe ?? 0}</span>
                </div>
              </div>

              {/* Risk chart */}
              {chartData.length > 0 && (
                <div className="card animate-fade-in">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-white">Risk Score Distribution (Top 30)</h3>
                    <button
                      id="fraud-export-csv"
                      onClick={() => downloadExport("/api/reports/export/csv?module=fraud", "frisk_fraud_export.csv")}
                      className="btn-secondary text-xs py-1.5"
                    >
                      <Download size={12} /> Export CSV
                    </button>
                  </div>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e1e3f" />
                      <XAxis dataKey="transaction_id" hide />
                      <YAxis domain={[0, 100]} tick={{ fill: "#6b7280", fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ background: "#12122a", border: "1px solid #1e1e3f", borderRadius: 8, fontSize: 12 }}
                        labelStyle={{ color: "#fff" }}
                        formatter={(v) => [`${v}`, "Risk Score"]}
                      />
                      <Bar dataKey="risk_score" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, i) => (
                          <Cell key={i} fill={SCORE_COLOR(entry.risk_score)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Results table */}
              <div className="card animate-fade-in">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-white">
                    Transaction Results
                    <span className="ml-2 text-xs text-slate-500">({transactions?.length ?? 0} rows)</span>
                  </h3>
                </div>
                <div className="overflow-auto max-h-[420px] scrollbar-thin rounded-xl">
                  <table className="data-table w-full">
                    <thead className="sticky top-0 bg-surface-card z-10">
                      <tr>
                        <th>Transaction ID</th>
                        <th>Amount</th>
                        <th>Category</th>
                        <th>Risk Score</th>
                        <th>Status</th>
                        <th>Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions?.map((t, i) => (
                        <tr key={i}>
                          <td className="font-mono text-xs text-brand-400">{t.transaction_id}</td>
                          <td className="font-semibold">${Number(t.amount).toFixed(2)}</td>
                          <td className="text-slate-400">{t.merchant_category}</td>
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="score-bar w-16">
                                <div
                                  className="score-bar-fill"
                                  style={{ width: `${t.risk_score}%`, background: SCORE_COLOR(t.risk_score) }}
                                />
                              </div>
                              <span className="text-xs font-mono font-bold">{t.risk_score}</span>
                            </div>
                          </td>
                          <td><RiskBadge tier={t.risk_tier} /></td>
                          <td className="text-xs text-slate-400 max-w-[180px] truncate" title={t.anomaly_reasons?.join(", ")}>
                            {t.anomaly_reasons?.length
                              ? t.anomaly_reasons[0]
                              : <span className="text-emerald-400">No anomalies</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {!result && !loading && (
            <div className="card flex flex-col items-center justify-center py-20 text-center gap-3">
              <ShieldAlert size={40} className="text-slate-600" />
              <p className="text-slate-500 text-sm">Upload a CSV or paste JSON to start detection.</p>
              <button onClick={runDemo} className="btn-secondary text-xs mt-2">
                <FlaskConical size={13} /> Load Demo Data
              </button>
            </div>
          )}

          {loading && (
            <div className="card flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 size={32} className="text-brand-400 animate-spin" />
              <p className="text-slate-400 text-sm">Running anomaly detection…</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
