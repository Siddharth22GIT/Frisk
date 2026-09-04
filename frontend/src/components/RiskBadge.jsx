import clsx from "clsx";

const TIER_MAP = {
  "Safe":          { cls: "badge-safe",   dot: "bg-emerald-400" },
  "Review Needed": { cls: "badge-review", dot: "bg-amber-400" },
  "High Risk":     { cls: "badge-high",   dot: "bg-red-400" },
  "Low":           { cls: "badge-safe",   dot: "bg-emerald-400" },
  "Medium":        { cls: "badge-review", dot: "bg-amber-400" },
  "High":          { cls: "badge-high",   dot: "bg-red-400" },
};

export default function RiskBadge({ tier }) {
  const config = TIER_MAP[tier] || { cls: "badge-review", dot: "bg-slate-400" };
  return (
    <span className={config.cls}>
      <span className={clsx("w-1.5 h-1.5 rounded-full", config.dot)} />
      {tier}
    </span>
  );
}
