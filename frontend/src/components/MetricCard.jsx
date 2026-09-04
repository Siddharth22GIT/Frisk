import clsx from "clsx";

export default function MetricCard({ label, value, sub, color = "brand", icon: Icon }) {
  const colorMap = {
    brand:   "text-brand-400",
    emerald: "text-emerald-400",
    amber:   "text-amber-400",
    red:     "text-red-400",
    violet:  "text-violet-400",
  };

  return (
    <div className="metric-block animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <span className="label mb-0">{label}</span>
        {Icon && <Icon size={14} className={colorMap[color]} />}
      </div>
      <span className={clsx("text-2xl font-bold", colorMap[color])}>{value}</span>
      {sub && <span className="text-xs text-slate-500 mt-0.5">{sub}</span>}
    </div>
  );
}
