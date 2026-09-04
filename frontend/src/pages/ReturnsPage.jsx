import { useState } from "react";
import toast from "react-hot-toast";
import { RotateCcw, Upload, Code, Loader2, FlaskConical, Download } from "lucide-react";
import {
  RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer,
  Cell, PieChart, Pie, Tooltip,
} from "recharts";
import FileUpload from "../components/FileUpload";
import RiskBadge from "../components/RiskBadge";
import MetricCard from "../components/MetricCard";
import { scoreReturnsCsv, scoreReturnsJson, getReturnsDemo, downloadExport } from "../api/client";

const DEMO_JSON = `[
  {
    "order_id": "ORD00001",
    "product_category": "Electronics",
    "customer_return_rate": 0.45,
    "order_value": 899.00,
    "region": "North America",
    "days_since_last_order": 2,
    "customer_age_days": 15,
    "num_prev_orders": 1,
    "is_gift": 0
  }
]`;

const TIER_COLORS = { Low: "#10b981", Medium: "#f59e0b", High: "#ef4444" };

export default function ReturnsPage() {
  const [tab, setTab] = useState("csv");
  const [file, setFile] = useState(null);
  const [json, setJson] = useState(DEMO_JSON);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const run = async () => {
    setLoading(true);
    try {
      let data;
      if (tab === "csv" && file) {
        data = await scoreReturnsCsv(file);
      } else if (tab === "json") {
        data = await scoreReturnsJson(JSON.parse(json));
      } else {
        toast.error("Please upload a file or provide JSON.");
        return;
      }
      setResult(data);
      toast.success(`Scored ${data.summary?.total ?? 0} orders.`);
    } catch (e) {
      toast.error(e.response?.data?.error || e.message || "Scoring failed.");
    } finally {
      setLoading(false);
    }
  };

  const runDemo = async () => {
    setLoading(true);
    try {
      const data = await getReturnsDemo();
      setResult(data);
      toast.success("Demo data loaded!");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const { metrics, summary, orders } = result || {};

  // Pie data
  const pieData = summary
    ? [
        { name: "High Risk", value: summary.high_risk ?? 0, color: "#ef4444" },
        { name: "Review Needed", value: summary.medium_risk ?? 0, color: "#f59e0b" },
        { name: "Safe", value: summary.low_risk ?? 0, color: "#10b981" },
      ]
    : [];

  // Confusion matrix
  const cm = metrics?.confusion_matrix;

  return (
    <div className="p-8 animate-slide-up">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <RotateCcw size={18} className="text-amber-400" />
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-widest">Module 2</span>
        </div>
        <h1 className="text-3xl font-bold text-white">Return Risk Scorer</h1>
        <p className="text-slate-400 mt-1">Score orders for return likelihood using XGBoost. Get plain-language risk tiers.</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left */}
        <div className="col-span-1 space-y-4">
          <div className="card">
            <div className="flex gap-1 p-1 rounded-xl bg-surface-muted mb-4">
              {["csv", "json"].map((t) => (
                <button
                  key={t}
                  id={`returns-tab-${t}`}
                  onClick={() => setTab(t)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all
                    ${tab === t ? "bg-amber-600 text-white shadow" : "text-slate-400 hover:text-white"}`}
                >
                  {t === "csv" ? <Upload size={13} /> : <Code size={13} />}
                  {t.toUpperCase()}
                </button>
              ))}
            </div>

            {tab === "csv" ? (
              <FileUpload file={file} onFile={setFile} label="Drop orders CSV" />
            ) : (
              <div>
                <label className="label">JSON Order Payload</label>
                <textarea
                  id="returns-json-input"
                  value={json}
                  onChange={(e) => setJson(e.target.value)}
                  rows={12}
                  className="input-field font-mono text-xs resize-none"
                />
              </div>
            )}

            <div className="flex gap-2 mt-4">
              <button
                id="returns-run-btn"
                onClick={run}
                disabled={loading}
                className="btn-primary flex-1"
                style={{ background: "linear-gradient(135deg, #d97706, #f59e0b)" }}
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : <RotateCcw size={15} />}
                {loading ? "Scoring…" : "Score Orders"}
              </button>
              <button id="returns-demo-btn" onClick={runDemo} disabled={loading} className="btn-secondary">
                <FlaskConical size={15} />
              </button>
            </div>
          </div>

          {/* AUC + metrics */}
          {metrics && (
            <div className="card animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">Model Performance</h3>
                <span className="text-[10px] text-slate-500 bg-surface-muted px-2 py-0.5 rounded-full border border-surface-border capitalize">
                  {metrics.source || "baseline"}
                </span>
              </div>
              <div className="mb-4">
                <MetricCard label="AUC-ROC" value={metrics.auc_roc?.toFixed(4)} color="amber" />
              </div>

              {cm && (
                <div>
                  <p className="label">Confusion Matrix</p>
                  <div className="grid grid-cols-2 gap-1.5 mt-2">
                    {[
                      { l: "True Negative", v: cm[0]?.[0] ?? 0, c: "text-emerald-400" },
                      { l: "False Positive", v: cm[0]?.[1] ?? 0, c: "text-red-400" },
                      { l: "False Negative", v: cm[1]?.[0] ?? 0, c: "text-amber-400" },
                      { l: "True Positive", v: cm[1]?.[1] ?? 0, c: "text-brand-400" },
                    ].map(({ l, v, c }) => (
                      <div key={l} className="metric-block p-3">
                        <span className="text-[10px] text-slate-500">{l}</span>
                        <span className={`text-xl font-bold ${c}`}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right */}
        <div className="col-span-2 space-y-4">
          {result && (
            <>
              {/* Summary + Pie */}
              <div className="grid grid-cols-2 gap-4 animate-fade-in">
                <div className="card">
                  <h3 className="text-sm font-semibold text-white mb-4">Risk Breakdown</h3>
                  <ResponsiveContainer width="100%" height={150}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} dataKey="value" paddingAngle={3}>
                        {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: "#12122a", border: "1px solid #1e1e3f", borderRadius: 8, fontSize: 12 }}
                        formatter={(v, n) => [v, n]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center gap-4 mt-2">
                    {pieData.map((d) => (
                      <div key={d.name} className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                        <span className="text-xs text-slate-400">{d.name} ({d.value})</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card grid grid-rows-3 gap-3">
                  {[
                    { label: "Total Orders", val: summary?.total ?? 0, color: "text-white" },
                    { label: "High Risk", val: summary?.high_risk ?? 0, color: "text-red-400" },
                    { label: "Safe to Fulfil", val: summary?.low_risk ?? 0, color: "text-emerald-400" },
                  ].map(({ label, val, color }) => (
                    <div key={label} className="metric-block flex-row flex items-center justify-between p-3">
                      <span className="label mb-0">{label}</span>
                      <span className={`text-2xl font-bold ${color}`}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Table */}
              <div className="card animate-fade-in">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-white">
                    Order Results <span className="text-xs text-slate-500 ml-1">({orders?.length} rows)</span>
                  </h3>
                  <button
                    id="returns-export-csv"
                    onClick={() => downloadExport("/api/reports/export/csv?module=returns", "frisk_returns_export.csv")}
                    className="btn-secondary text-xs py-1.5"
                  >
                    <Download size={12} /> Export CSV
                  </button>
                </div>
                <div className="overflow-auto max-h-[380px] scrollbar-thin rounded-xl">
                  <table className="data-table w-full">
                    <thead className="sticky top-0 bg-surface-card z-10">
                      <tr>
                        <th>Order ID</th>
                        <th>Category</th>
                        <th>Value</th>
                        <th>Return Prob.</th>
                        <th>Risk</th>
                        <th>Recommended Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders?.map((o, i) => (
                        <tr key={i}>
                          <td className="font-mono text-xs text-amber-400">{o.order_id}</td>
                          <td className="text-slate-400">{o.product_category}</td>
                          <td className="font-semibold">${Number(o.order_value).toFixed(2)}</td>
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="score-bar w-16">
                                <div
                                  className="score-bar-fill"
                                  style={{
                                    width: `${(o.return_probability * 100).toFixed(0)}%`,
                                    background: TIER_COLORS[o.risk_tier],
                                  }}
                                />
                              </div>
                              <span className="text-xs font-mono font-bold">
                                {(o.return_probability * 100).toFixed(1)}%
                              </span>
                            </div>
                          </td>
                          <td><RiskBadge tier={o.risk_tier} /></td>
                          <td className="text-xs text-slate-400 max-w-[180px]">{o.recommended_action}</td>
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
              <RotateCcw size={40} className="text-slate-600" />
              <p className="text-slate-500 text-sm">Upload an orders CSV or paste JSON to start scoring.</p>
              <button onClick={runDemo} className="btn-secondary text-xs mt-2">
                <FlaskConical size={13} /> Load Demo Data
              </button>
            </div>
          )}
          {loading && (
            <div className="card flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 size={32} className="text-amber-400 animate-spin" />
              <p className="text-slate-400 text-sm">Scoring orders…</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
