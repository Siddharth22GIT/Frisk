import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, RotateCcw, CreditCard, TrendingUp, ArrowRight, Zap } from "lucide-react";
import { getReportsSummary } from "../api/client";

const MODULES = [
  {
    to: "/fraud",
    icon: ShieldAlert,
    title: "Fraud Spike Detector",
    desc: "Upload transaction data and instantly identify suspicious activity with Isolation Forest anomaly detection.",
    color: "red",
    gradient: "from-red-500/20 to-transparent",
    border: "border-red-500/20",
  },
  {
    to: "/returns",
    icon: RotateCcw,
    title: "Return Risk Scorer",
    desc: "Score individual orders or batches for return likelihood using XGBoost, with clear risk tiers and recommended actions.",
    color: "amber",
    gradient: "from-amber-500/20 to-transparent",
    border: "border-amber-500/20",
  },
  {
    to: "/chargebacks",
    icon: CreditCard,
    title: "Chargeback Responder",
    desc: "Automatically generate structured dispute evidence documents using AI — ready to submit to your payment processor.",
    color: "violet",
    gradient: "from-violet-500/20 to-transparent",
    border: "border-violet-500/20",
  },
];

const COLOR_MAP = {
  red:    { stat: "text-red-400",    bg: "bg-red-500/10",    icon: "text-red-400" },
  amber:  { stat: "text-amber-400",  bg: "bg-amber-500/10",  icon: "text-amber-400" },
  violet: { stat: "text-violet-400", bg: "bg-violet-500/10", icon: "text-violet-400" },
};

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    getReportsSummary().then(setSummary).catch(() => {});
  }, []);

  return (
    <div className="p-8 animate-slide-up">
      {/* Hero */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-2">
          <Zap size={14} className="text-brand-400" />
          <span className="text-xs font-semibold text-brand-400 uppercase tracking-widest">AI-Powered Risk Intelligence</span>
        </div>
        <h1 className="text-4xl font-bold gradient-text mb-2">Welcome to Frisk</h1>
        <p className="text-slate-400 text-lg max-w-xl">
          Your all-in-one risk management suite. Detect fraud, score return risk,
          and respond to chargebacks — all from one dashboard.
        </p>
      </div>

      {/* Live stats */}
      {summary && (
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { label: "Fraud Checks", value: summary.fraud?.count ?? 0, flag: summary.fraud?.flagged ?? 0, color: "red" },
            { label: "Orders Scored", value: summary.returns?.count ?? 0, flag: summary.returns?.high_risk ?? 0, color: "amber" },
            { label: "Chargebacks", value: summary.chargebacks?.count ?? 0, flag: null, color: "violet" },
          ].map(({ label, value, flag, color }) => (
            <div key={label} className={`card flex items-center gap-4 border ${COLOR_MAP[color].bg}`}>
              <div className={`w-10 h-10 rounded-xl ${COLOR_MAP[color].bg} flex items-center justify-center`}>
                <TrendingUp size={18} className={COLOR_MAP[color].icon} />
              </div>
              <div>
                <p className="label mb-0">{label}</p>
                <p className={`text-2xl font-bold ${COLOR_MAP[color].stat}`}>{value}</p>
                {flag !== null && (
                  <p className="text-xs text-slate-500">{flag} flagged</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Module cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {MODULES.map(({ to, icon: Icon, title, desc, color, gradient, border }) => (
          <Link
            key={to}
            to={to}
            className={`card border ${border} group hover:scale-[1.02] transition-all duration-200 hover:shadow-2xl block`}
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} border ${border} flex items-center justify-center mb-4`}>
              <Icon size={18} className={COLOR_MAP[color].icon} />
            </div>
            <h2 className="text-base font-semibold text-white mb-2">{title}</h2>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">{desc}</p>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-400 group-hover:gap-2.5 transition-all">
              Open Module <ArrowRight size={13} />
            </div>
          </Link>
        ))}
      </div>

      {/* Quick start */}
      <div className="mt-10 card border-brand-500/20 bg-gradient-to-r from-brand-600/10 to-violet-600/5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center shrink-0">
            <Zap size={18} className="text-brand-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white mb-1">Quick Start — Demo Mode</h3>
            <p className="text-sm text-slate-400 mb-3">
              No data? Click <strong className="text-white">Load Demo Data</strong> on any module page to run analysis
              on pre-seeded realistic merchant transactions instantly.
            </p>
            <div className="flex gap-3">
              <Link to="/fraud" className="btn-primary text-xs">Try Fraud Detector</Link>
              <Link to="/returns" className="btn-secondary text-xs">Try Return Scorer</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
