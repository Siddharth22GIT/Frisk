import { useState } from "react";
import toast from "react-hot-toast";
import { ShieldAlert, Upload, Code, Loader2, Download, FlaskConical, Play } from "lucide-react";
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

const SCORE_COLOR = (s) => s >= 70 ? "#f43f5e" : s >= 40 ? "#f3a854" : "#34d399";

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
    <div className="p-8 max-w-7xl mx-auto animate-fade-in text-[#f5efe6] light:text-[#181614]">
      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <div className="mb-8 pb-6 border-b border-white/[0.06] light:border-[#e2dacd]">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] font-mono tracking-[0.2em] text-[#c49b5c] light:text-[#b87328] uppercase font-semibold">
            / MODULE 01 · ANOMALY ISOLATION
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#f5efe6] light:text-[#181614]">
          Fraud Spike Detector — <span className="text-[#d99a53] light:text-[#b87328]">Isolation Forest</span>
        </h1>
        <p className="text-sm text-[#9e9488] light:text-[#5c554c] mt-1.5 max-w-2xl">
          Multi-dimensional anomaly detection isolating coordinated card testing, velocity spikes, and high-risk merchant profiles.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left — Input Controls */}
        <div className="space-y-5">
          <div className="card">
            <div className="flex gap-1 p-1 rounded-xl bg-[#181715] border border-white/[0.05] mb-5">
              {["csv", "json"].map((t) => (
                <button
                  key={t}
                  id={`fraud-tab-${t}`}
                  onClick={() => setTab(t)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-mono tracking-wider uppercase transition-all
                    ${tab === t ? "bg-[#252320] text-[#f5efe6] font-semibold border border-[#d99a53]/40 shadow-sm" : "text-[#9e9488] hover:text-[#f5efe6]"}`}
                >
                  {t === "csv" ? <Upload size={12} /> : <Code size={12} />}
                  {t.toUpperCase()}
                </button>
              ))}
            </div>

            {tab === "csv" ? (
              <FileUpload file={file} onFile={setFile} label="Drop transaction CSV here" />
            ) : (
              <div>
                <label className="label">JSON Transaction Payload</label>
                <textarea
                  id="fraud-json-input"
                  value={json}
                  onChange={(e) => setJson(e.target.value)}
                  rows={11}
                  className="input-field font-mono text-xs resize-none"
                  placeholder="Paste transaction array…"
                />
              </div>
            )}

            <div className="flex gap-2.5 mt-5">
              <button
                id="fraud-run-btn"
                onClick={run}
                disabled={loading}
                className="btn-cream flex-1"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <ShieldAlert size={14} />}
                <span>{loading ? "Evaluating…" : "Detect Anomalies"}</span>
              </button>
              <button
                id="fraud-demo-btn"
                onClick={runDemo}
                disabled={loading}
                className="btn-secondary"
                title="Load seed demo data"
              >
                <FlaskConical size={14} className="text-[#d99a53]" />
                <span>Demo</span>
              </button>
            </div>
          </div>

          {/* Metrics */}
          {metrics && (
            <div className="card animate-fade-in space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <h3 className="text-xs font-mono uppercase tracking-widest text-[#f5efe6]">Model Performance</h3>
                <span className="text-[10px] font-mono text-[#c49b5c] bg-[#1a1917] px-2.5 py-0.5 rounded-full border border-white/[0.08] capitalize">
                  {metrics.source || "baseline"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <MetricCard label="Precision" value={`${((metrics.precision || 0) * 100).toFixed(1)}%`} color="emerald" />
                <MetricCard label="Recall" value={`${((metrics.recall || 0) * 100).toFixed(1)}%`} color="amber" />
                <MetricCard label="F1 Score" value={`${((metrics.f1 || 0) * 100).toFixed(1)}%`} color="amber" />
                <MetricCard label="False Pos Rate" value={`${((metrics.fpr || 0) * 100).toFixed(1)}%`} color="red" />
              </div>
            </div>
          )}
        </div>

        {/* Right — Results Analysis */}
        <div className="lg:col-span-2 space-y-6">
          {result && (
            <>
              {/* Summary telemetry cards */}
              <div className="grid grid-cols-3 gap-4 animate-fade-in">
                <div className="metric-block text-center">
                  <span className="label text-center">Total Evaluated</span>
                  <span className="text-3xl font-extrabold text-[#f5efe6] font-sans">{summary?.total ?? 0}</span>
                  <span className="text-[10px] font-mono text-[#6e665d] mt-1">transactions</span>
                </div>
                <div className="metric-block text-center border-rose-500/20 bg-rose-500/[0.03]">
                  <span className="label text-center text-rose-400">Flagged Anomalies</span>
                  <span className="text-3xl font-extrabold text-rose-400 font-sans">{summary?.flagged ?? 0}</span>
                  <span className="text-[10px] font-mono text-rose-400/70 mt-1">isolated for review</span>
                </div>
                <div className="metric-block text-center border-emerald-500/20 bg-emerald-500/[0.03]">
                  <span className="label text-center text-emerald-400">Safe Passed</span>
                  <span className="text-3xl font-extrabold text-emerald-400 font-sans">{summary?.safe ?? 0}</span>
                  <span className="text-[10px] font-mono text-emerald-400/70 mt-1">verified clear</span>
                </div>
              </div>

              {/* Risk Distribution Chart */}
              {chartData.length > 0 && (
                <div className="card animate-fade-in">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.06]">
                    <div>
                      <h3 className="text-xs font-mono uppercase tracking-widest text-[#f5efe6]">
                        Risk Score Distribution (Top 30 Highest)
                      </h3>
                      <p className="text-[11px] text-[#9e9488] mt-0.5">Threshold: Scores &ge; 70 quarantined as High Risk</p>
                    </div>
                    <button
                      id="fraud-export-csv"
                      onClick={() => downloadExport("/api/reports/export/csv?module=fraud", "frisk_fraud_export.csv")}
                      className="btn-secondary text-xs"
                    >
                      <Download size={12} /> Export CSV
                    </button>
                  </div>
                  <ResponsiveContainer width="100%" height={190}>
                    <BarChart data={chartData} margin={{ top: 5, right: 0, bottom: 0, left: -25 }}>
                      <CartesianGrid strokeDasharray="2 2" stroke="rgba(255, 255, 255, 0.04)" />
                      <XAxis dataKey="transaction_id" hide />
                      <YAxis domain={[0, 100]} tick={{ fill: "#6e665d", fontSize: 10, fontFamily: "monospace" }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#141312",
                          border: "1px solid rgba(245, 239, 230, 0.15)",
                          borderRadius: "12px",
                          fontSize: "11px",
                          fontFamily: "monospace",
                          color: "#f5efe6",
                          boxShadow: "0 10px 25px rgba(0,0,0,0.8)",
                        }}
                        itemStyle={{ color: "#f5efe6" }}
                        labelStyle={{ color: "#d99a53", fontWeight: 600 }}
                        formatter={(v) => [`${v} / 100`, "Anomaly Score"]}
                        cursor={{ fill: "rgba(255, 255, 255, 0.05)" }}
                      />
                      <Bar dataKey="risk_score" radius={[3, 3, 0, 0]}>
                        {chartData.map((entry, i) => (
                          <Cell key={i} fill={SCORE_COLOR(entry.risk_score)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Transaction Results Table */}
              <div className="card animate-fade-in">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.06]">
                  <h3 className="text-xs font-mono uppercase tracking-widest text-[#f5efe6]">
                    Transaction Telemetry Log
                  </h3>
                  <span className="text-xs font-mono text-[#9e9488]">
                    {transactions?.length ?? 0} rows evaluated
                  </span>
                </div>
                <div className="overflow-auto max-h-[440px] scrollbar-thin rounded-xl border border-white/[0.05]">
                  <table className="data-table w-full">
                    <thead className="sticky top-0 bg-[#161514] z-10">
                      <tr>
                        <th>Transaction ID</th>
                        <th>Amount</th>
                        <th>Category</th>
                        <th>Risk Score</th>
                        <th>Status</th>
                        <th>Primary Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions?.map((t, i) => (
                        <tr key={i}>
                          <td className="font-mono text-xs text-[#f3a854] font-medium">{t.transaction_id}</td>
                          <td className="font-semibold text-[#f5efe6] font-sans">${Number(t.amount).toFixed(2)}</td>
                          <td className="text-[#9e9488]">{t.merchant_category}</td>
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
                          <td className="text-xs text-[#9e9488] max-w-[200px] truncate" title={t.anomaly_reasons?.join(", ")}>
                            {t.anomaly_reasons?.length
                              ? t.anomaly_reasons[0]
                              : <span className="text-emerald-400 font-mono">No anomalies</span>}
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
            <div className="card flex flex-col items-center justify-center py-24 text-center gap-3 border-dashed">
              <div className="w-12 h-12 rounded-full bg-[#1c1b18] border border-white/[0.08] flex items-center justify-center mb-1">
                <ShieldAlert size={24} className="text-[#6e665d]" />
              </div>
              <p className="text-[#9e9488] text-xs font-mono">AWAITING TRANSACTION BATCH</p>
              <p className="text-[#6e665d] text-xs max-w-sm">
                Upload a CSV transaction file or click below to load pre-seeded merchant transaction records.
              </p>
              <button onClick={runDemo} className="btn-secondary text-xs mt-3">
                <FlaskConical size={13} className="text-[#d99a53]" /> Load Demo Batch
              </button>
            </div>
          )}

          {loading && (
            <div className="card flex flex-col items-center justify-center py-24 gap-3">
              <Loader2 size={32} className="text-[#d99a53] animate-spin" />
              <p className="text-xs font-mono text-[#9e9488] tracking-wider uppercase">Running Isolation Forest Pipeline…</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
