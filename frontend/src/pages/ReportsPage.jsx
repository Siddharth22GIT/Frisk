import { useEffect, useState } from "react";
import { BarChart3, Download, RefreshCw, Loader2, FileText } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { getReportsSummary, downloadExport } from "../api/client";
import toast from "react-hot-toast";

const MODULES = ["fraud", "returns", "chargebacks"];

export default function ReportsPage() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const d = await getReportsSummary();
      setSummary(d);
    } catch {
      toast.error("Could not load report summary.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const chartData = summary
    ? [
        { name: "Fraud Detector", checked: summary.fraud?.count ?? 0, flagged: summary.fraud?.flagged ?? 0 },
        { name: "Return Scorer", checked: summary.returns?.count ?? 0, flagged: summary.returns?.high_risk ?? 0 },
        { name: "Chargebacks", checked: summary.chargebacks?.count ?? 0, flagged: 0 },
      ]
    : [];

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in text-[#f5efe6] light:text-[#181614]">
      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <div className="mb-8 pb-6 border-b border-white/[0.06] light:border-[#e2dacd] flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-mono tracking-[0.2em] text-[#c49b5c] light:text-[#b87328] uppercase font-semibold">
              / AUDIT &amp; TELEMETRY · REPOSITORIES
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#f5efe6] light:text-[#181614]">
            Aggregate Intelligence — <span className="text-[#d99a53] light:text-[#b87328]">Cross-Module Telemetry</span>
          </h1>
          <p className="text-sm text-[#9e9488] light:text-[#5c554c] mt-1.5 max-w-2xl">
            Cumulative operational audit across transaction fraud anomaly isolation, return propensity models, and dispute dossiers.
          </p>
        </div>
        <button
          id="reports-refresh-btn"
          onClick={load}
          disabled={loading}
          className="btn-secondary text-xs"
        >
          <RefreshCw size={13} className={loading ? "animate-spin text-[#d99a53]" : "text-[#d99a53]"} />
          <span>Refresh Data</span>
        </button>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 size={32} className="text-[#d99a53] animate-spin" />
          <p className="text-xs font-mono text-[#9e9488] tracking-wider uppercase">Loading Audit Metrics…</p>
        </div>
      )}

      {summary && !loading && (
        <div className="space-y-8">
          {/* ── BIG STATS ROW ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: "Fraud Scans Evaluated", count: summary.fraud?.count ?? 0, flag: summary.fraud?.flagged ?? 0, tag: "Anomalies", color: "text-[#f5efe6]", flagColor: "text-rose-400" },
              { label: "Orders Scored for Return", count: summary.returns?.count ?? 0, flag: summary.returns?.high_risk ?? 0, tag: "High Risk", color: "text-[#f5efe6]", flagColor: "text-[#f3a854]" },
              { label: "Chargeback Disputes Handled", count: summary.chargebacks?.count ?? 0, flag: null, tag: "Dossiers", color: "text-[#f5efe6]", flagColor: "text-emerald-400" },
            ].map(({ label, count, flag, tag, color, flagColor }) => (
              <div key={label} className="card p-6">
                <span className="label text-[10px] tracking-widest">{label}</span>
                <p className={`text-4xl md:text-5xl font-extrabold tracking-tight ${color} font-sans my-1`}>{count}</p>
                {flag !== null ? (
                  <p className={`text-xs font-mono ${flagColor}`}>
                    {flag} quarantined as {tag}
                  </p>
                ) : (
                  <p className="text-xs font-mono text-emerald-400">
                    Active automated dispute pipeline
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* ── ACTIVITY BAR CHART ────────────────────────────────────────── */}
          <div className="card">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.06]">
              <div>
                <h3 className="text-xs font-mono uppercase tracking-widest text-[#f5efe6]">Module Processing Volume</h3>
                <p className="text-[11px] text-[#9e9488] mt-0.5">Comparison between total processed vs high-risk flagged vectors</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: -25 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="rgba(255, 255, 255, 0.04)" />
                <XAxis dataKey="name" tick={{ fill: "#9e9488", fontSize: 11, fontFamily: "monospace" }} />
                <YAxis tick={{ fill: "#6e665d", fontSize: 10, fontFamily: "monospace" }} />
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
                  cursor={{ fill: "rgba(255, 255, 255, 0.05)" }}
                />
                <Legend wrapperStyle={{ fontSize: 11, fontFamily: "monospace", color: "#9e9488", paddingTop: 10 }} />
                <Bar dataKey="checked" name="Total Evaluated" fill="#d99a53" radius={[3, 3, 0, 0]} />
                <Bar dataKey="flagged" name="High Risk Quarantined" fill="#f43f5e" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* ── DATA EXPORT SECTION ───────────────────────────────────────── */}
          <div className="card">
            <div className="mb-4 pb-3 border-b border-white/[0.06]">
              <h3 className="text-xs font-mono uppercase tracking-widest text-[#f5efe6]">Telemetry Data Exports</h3>
              <p className="text-[11px] text-[#9e9488] mt-0.5">Download structured CSV datasets or formatted PDF summary dockets</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {MODULES.map((mod) => (
                <div key={mod} className="p-4 rounded-xl bg-[#181715] border border-white/[0.05] flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-[#c49b5c] uppercase tracking-wider block mb-1">MODULE</span>
                    <p className="text-sm font-bold text-[#f5efe6] capitalize font-sans">{mod}</p>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      id={`export-csv-${mod}`}
                      onClick={() =>
                        downloadExport(`/api/reports/export/csv?module=${mod}`, `frisk_${mod}.csv`)
                          .then(() => toast.success(`${mod} CSV downloaded.`))
                          .catch(() => toast.error("Export failed. Run analysis first."))
                      }
                      className="btn-secondary text-xs py-1.5 flex-1"
                    >
                      <Download size={11} className="text-[#d99a53]" /> CSV
                    </button>
                    <button
                      id={`export-pdf-${mod}`}
                      onClick={() =>
                        downloadExport(`/api/reports/export/pdf?module=${mod}`, `frisk_${mod}.pdf`)
                          .then(() => toast.success(`${mod} PDF downloaded.`))
                          .catch(() => toast.error("Export failed. Run analysis first."))
                      }
                      className="btn-secondary text-xs py-1.5 flex-1"
                    >
                      <FileText size={11} className="text-[#d99a53]" /> PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[11px] font-mono text-[#6e665d] mt-4 pt-3 border-t border-white/[0.04]">
              ※ Exports include results from the current operational session. Run analyses first to populate telemetry rows.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
