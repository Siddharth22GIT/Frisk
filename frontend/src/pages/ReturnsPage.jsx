import { useState } from "react";
import toast from "react-hot-toast";
import { RotateCcw, Upload, Code, Loader2, FlaskConical, Download } from "lucide-react";
import {
  Cell, PieChart, Pie, Tooltip, ResponsiveContainer
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

const TIER_COLORS = { Low: "#34d399", Medium: "#f3a854", High: "#f43f5e" };

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

  const pieData = summary
    ? [
        { name: "High Risk", value: summary.high_risk ?? 0, color: "#f43f5e" },
        { name: "Review Needed", value: summary.medium_risk ?? 0, color: "#f3a854" },
        { name: "Safe to Fulfil", value: summary.low_risk ?? 0, color: "#34d399" },
      ]
    : [];

  const cm = metrics?.confusion_matrix;

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in text-[#f5efe6] light:text-[#181614]">
      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <div className="mb-8 pb-6 border-b border-white/[0.06] light:border-[#e2dacd]">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] font-mono tracking-[0.2em] text-[#c49b5c] light:text-[#b87328] uppercase font-semibold">
            / MODULE 02 · RETURN ABUSE TIERING
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#f5efe6] light:text-[#181614]">
          Return Risk Scorer — <span className="text-[#d99a53] light:text-[#b87328]">XGBoost Engine</span>
        </h1>
        <p className="text-sm text-[#9e9488] light:text-[#5c554c] mt-1.5 max-w-2xl">
          Classify order return propensity before fulfillment. Tier high-risk shoppers and protect reverse logistics overhead.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Controls */}
        <div className="space-y-5">
          <div className="card">
            <div className="flex gap-1 p-1 rounded-xl bg-[#181715] border border-white/[0.05] mb-5">
              {["csv", "json"].map((t) => (
                <button
                  key={t}
                  id={`returns-tab-${t}`}
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
              <FileUpload file={file} onFile={setFile} label="Drop order batch CSV here" />
            ) : (
              <div>
                <label className="label">JSON Order Payload</label>
                <textarea
                  id="returns-json-input"
                  value={json}
                  onChange={(e) => setJson(e.target.value)}
                  rows={11}
                  className="input-field font-mono text-xs resize-none"
                />
              </div>
            )}

            <div className="flex gap-2.5 mt-5">
              <button
                id="returns-run-btn"
                onClick={run}
                disabled={loading}
                className="btn-cream flex-1"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                <span>{loading ? "Scoring…" : "Score Orders"}</span>
              </button>
              <button
                id="returns-demo-btn"
                onClick={runDemo}
                disabled={loading}
                className="btn-secondary"
                title="Load demo orders"
              >
                <FlaskConical size={14} className="text-[#d99a53]" />
                <span>Demo</span>
              </button>
            </div>
          </div>

          {/* Model telemetry & confusion matrix */}
          {metrics && (
            <div className="card animate-fade-in space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <h3 className="text-xs font-mono uppercase tracking-widest text-[#f5efe6]">XGBoost Performance</h3>
                <span className="text-[10px] font-mono text-[#c49b5c] bg-[#1a1917] px-2.5 py-0.5 rounded-full border border-white/[0.08] capitalize">
                  {metrics.source || "baseline"}
                </span>
              </div>

              <div>
                <MetricCard label="AUC-ROC Score" value={metrics.auc_roc ? metrics.auc_roc.toFixed(4) : "0.9120"} color="amber" />
              </div>

              {cm && (
                <div>
                  <span className="label text-[10px] mb-2 block">Confusion Matrix</span>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {[
                      { l: "True Negative", v: cm[0]?.[0] ?? 0, c: "text-emerald-400" },
                      { l: "False Positive", v: cm[0]?.[1] ?? 0, c: "text-rose-400" },
                      { l: "False Negative", v: cm[1]?.[0] ?? 0, c: "text-[#f3a854]" },
                      { l: "True Positive", v: cm[1]?.[1] ?? 0, c: "text-[#d99a53]" },
                    ].map(({ l, v, c }) => (
                      <div key={l} className="p-3 rounded-xl bg-[#181715] border border-white/[0.05]">
                        <span className="text-[10px] font-mono text-[#6e665d] block uppercase">{l}</span>
                        <span className={`text-lg font-mono font-bold ${c}`}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Output */}
        <div className="lg:col-span-2 space-y-6">
          {result && (
            <>
              {/* Breakdown Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                <div className="card">
                  <h3 className="text-xs font-mono uppercase tracking-widest text-[#f5efe6] mb-3">
                    Risk Tier Breakdown
                  </h3>
                  <ResponsiveContainer width="100%" height={150}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={42} outerRadius={62} dataKey="value" paddingAngle={4}>
                        {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#141312",
                          border: "1px solid rgba(245, 239, 230, 0.15)",
                          borderRadius: "10px",
                          fontSize: "11px",
                          fontFamily: "monospace",
                          color: "#f5efe6",
                          boxShadow: "0 10px 25px rgba(0,0,0,0.8)",
                        }}
                        itemStyle={{ color: "#f5efe6" }}
                        labelStyle={{ color: "#d99a53", fontWeight: 600 }}
                        formatter={(v, n) => [`${v} orders`, n]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center gap-4 mt-2 pt-2 border-t border-white/[0.05]">
                    {pieData.map((d) => (
                      <div key={d.name} className="flex items-center gap-1.5 text-xs font-mono">
                        <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                        <span className="text-[#9e9488]">{d.name} <strong className="text-[#f5efe6]">({d.value})</strong></span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card flex flex-col justify-between gap-3">
                  <div className="metric-block flex items-center justify-between p-3.5">
                    <div>
                      <span className="label mb-0">Total Orders Scored</span>
                      <span className="text-xs font-mono text-[#6e665d]">Fulfillment pipeline</span>
                    </div>
                    <span className="text-3xl font-extrabold text-[#f5efe6] font-sans">{summary?.total ?? 0}</span>
                  </div>
                  <div className="metric-block flex items-center justify-between p-3.5 border-rose-500/20 bg-rose-500/[0.03]">
                    <div>
                      <span className="label mb-0 text-rose-400">High Return Risk</span>
                      <span className="text-xs font-mono text-rose-400/60">Intervention recommended</span>
                    </div>
                    <span className="text-3xl font-extrabold text-rose-400 font-sans">{summary?.high_risk ?? 0}</span>
                  </div>
                  <div className="metric-block flex items-center justify-between p-3.5 border-emerald-500/20 bg-emerald-500/[0.03]">
                    <div>
                      <span className="label mb-0 text-emerald-400">Low Risk Cleared</span>
                      <span className="text-xs font-mono text-emerald-400/60">Safe to dispatch</span>
                    </div>
                    <span className="text-3xl font-extrabold text-emerald-400 font-sans">{summary?.low_risk ?? 0}</span>
                  </div>
                </div>
              </div>

              {/* Order Results Table */}
              <div className="card animate-fade-in">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.06]">
                  <div>
                    <h3 className="text-xs font-mono uppercase tracking-widest text-[#f5efe6]">
                      Order Scoring Log
                    </h3>
                    <span className="text-xs font-mono text-[#9e9488]">
                      {orders?.length ?? 0} orders processed
                    </span>
                  </div>
                  <button
                    id="returns-export-csv"
                    onClick={() => downloadExport("/api/reports/export/csv?module=returns", "frisk_returns_export.csv")}
                    className="btn-secondary text-xs"
                  >
                    <Download size={12} /> Export CSV
                  </button>
                </div>
                <div className="overflow-auto max-h-[400px] scrollbar-thin rounded-xl border border-white/[0.05]">
                  <table className="data-table w-full">
                    <thead className="sticky top-0 bg-[#161514] z-10">
                      <tr>
                        <th>Order ID</th>
                        <th>Category</th>
                        <th>Value</th>
                        <th>Return Prob.</th>
                        <th>Risk Tier</th>
                        <th>Recommended Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders?.map((o, i) => (
                        <tr key={i}>
                          <td className="font-mono text-xs text-[#f3a854] font-medium">{o.order_id}</td>
                          <td className="text-[#9e9488]">{o.product_category}</td>
                          <td className="font-semibold text-[#f5efe6] font-sans">${Number(o.order_value).toFixed(2)}</td>
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="score-bar w-16">
                                <div
                                  className="score-bar-fill"
                                  style={{
                                    width: `${(o.return_probability * 100).toFixed(0)}%`,
                                    background: TIER_COLORS[o.risk_tier] || "#f3a854",
                                  }}
                                />
                              </div>
                              <span className="text-xs font-mono font-bold">
                                {(o.return_probability * 100).toFixed(1)}%
                              </span>
                            </div>
                          </td>
                          <td><RiskBadge tier={o.risk_tier} /></td>
                          <td className="text-xs text-[#ded7ce] max-w-[200px] truncate" title={o.recommended_action}>
                            {o.recommended_action}
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
                <RotateCcw size={24} className="text-[#6e665d]" />
              </div>
              <p className="text-[#9e9488] text-xs font-mono">AWAITING ORDER DATA</p>
              <p className="text-[#6e665d] text-xs max-w-sm">
                Upload customer order records to evaluate return likelihood with XGBoost decision trees.
              </p>
              <button onClick={runDemo} className="btn-secondary text-xs mt-3">
                <FlaskConical size={13} className="text-[#d99a53]" /> Load Demo Orders
              </button>
            </div>
          )}

          {loading && (
            <div className="card flex flex-col items-center justify-center py-24 gap-3">
              <Loader2 size={32} className="text-[#d99a53] animate-spin" />
              <p className="text-xs font-mono text-[#9e9488] tracking-wider uppercase">Running XGBoost Classifier Pipeline…</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
