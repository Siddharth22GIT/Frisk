import { useEffect, useState } from "react";
import { BarChart3, Download, RefreshCw, Loader2 } from "lucide-react";
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
        { name: "Fraud", checked: summary.fraud?.count ?? 0, flagged: summary.fraud?.flagged ?? 0 },
        { name: "Returns", checked: summary.returns?.count ?? 0, flagged: summary.returns?.high_risk ?? 0 },
        { name: "Chargebacks", checked: summary.chargebacks?.count ?? 0, flagged: 0 },
      ]
    : [];

  return (
    <div className="p-8 animate-slide-up">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 size={18} className="text-brand-400" />
            <span className="text-xs font-semibold text-brand-400 uppercase tracking-widest">Reports</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Aggregate Reports</h1>
          <p className="text-slate-400 mt-1">View cumulative metrics and export results for all three modules.</p>
        </div>
        <button id="reports-refresh-btn" onClick={load} disabled={loading} className="btn-secondary">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="text-brand-400 animate-spin" />
        </div>
      )}

      {summary && !loading && (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: "Fraud Checks", count: summary.fraud?.count ?? 0, flag: summary.fraud?.flagged ?? 0, color: "text-red-400" },
              { label: "Orders Scored", count: summary.returns?.count ?? 0, flag: summary.returns?.high_risk ?? 0, color: "text-amber-400" },
              { label: "Chargebacks Handled", count: summary.chargebacks?.count ?? 0, flag: null, color: "text-violet-400" },
            ].map(({ label, count, flag, color }) => (
              <div key={label} className="card text-center">
                <p className="label">{label}</p>
                <p className={`text-4xl font-bold ${color} mb-1`}>{count}</p>
                {flag !== null && (
                  <p className="text-sm text-slate-500">{flag} high-risk</p>
                )}
              </div>
            ))}
          </div>

          {/* Activity chart */}
          <div className="card mb-8">
            <h3 className="text-sm font-semibold text-white mb-4">Module Activity</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e3f" />
                <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 12 }} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: "#12122a", border: "1px solid #1e1e3f", borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: "#fff" }}
                />
                <Legend wrapperStyle={{ fontSize: 12, color: "#9ca3af" }} />
                <Bar dataKey="checked" name="Total Processed" fill="#6c4dff" radius={[4, 4, 0, 0]} />
                <Bar dataKey="flagged" name="Flagged / High Risk" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Export section */}
          <div className="card">
            <h3 className="text-sm font-semibold text-white mb-4">Export Data</h3>
            <div className="grid grid-cols-3 gap-4">
              {MODULES.map((mod) => (
                <div key={mod} className="metric-block">
                  <p className="label capitalize">{mod}</p>
                  <div className="flex gap-2 mt-3">
                    <button
                      id={`export-csv-${mod}`}
                      onClick={() =>
                        downloadExport(`/api/reports/export/csv?module=${mod}`, `frisk_${mod}.csv`)
                          .then(() => toast.success(`${mod} CSV downloaded.`))
                          .catch(() => toast.error("Export failed. Run analysis first."))
                      }
                      className="btn-secondary text-xs py-1.5 flex-1"
                    >
                      <Download size={11} /> CSV
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
                      <Download size={11} /> PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-3">
              ⚠️ Exports include results from the current session only. Run analyses first to populate data.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
