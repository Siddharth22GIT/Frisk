import clsx from "clsx";

const TIER_MAP = {
  "Safe":          { cls: "badge-safe",   dot: "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]" },
  "Review Needed": { cls: "badge-review", dot: "bg-[#f3a854] shadow-[0_0_6px_rgba(243,168,84,0.7)]" },
  "High Risk":     { cls: "badge-high",   dot: "bg-rose-400 shadow-[0_0_6px_rgba(244,63,94,0.7)]" },
  "Low":           { cls: "badge-safe",   dot: "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]" },
  "Medium":        { cls: "badge-review", dot: "bg-[#f3a854] shadow-[0_0_6px_rgba(243,168,84,0.7)]" },
  "High":          { cls: "badge-high",   dot: "bg-rose-400 shadow-[0_0_6px_rgba(244,63,94,0.7)]" },
};

export default function RiskBadge({ tier }) {
  const config = TIER_MAP[tier] || { cls: "badge-review", dot: "bg-[#9e9488]" };
  return (
    <span className={clsx(config.cls, "transition-all")}>
      <span className={clsx("w-1.5 h-1.5 rounded-full shrink-0", config.dot)} />
      <span>{tier}</span>
    </span>
  );
}
