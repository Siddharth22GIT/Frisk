import clsx from "clsx";

export default function MetricCard({ label, value, sub, color = "amber", icon: Icon }) {
  const colorMap = {
    brand:   "text-[#f3a854] light:text-[#b87328]",
    amber:   "text-[#f3a854] light:text-[#b87328]",
    emerald: "text-emerald-400 light:text-emerald-700",
    red:     "text-rose-400 light:text-rose-700",
    violet:  "text-[#d99a53] light:text-[#b87328]",
    ivory:   "text-[#f5efe6] light:text-[#181614]",
  };

  return (
    <div className="metric-block animate-fade-in group">
      <div className="flex items-center justify-between mb-1">
        <span className="label text-[10px] text-[#9e9488] light:text-[#6e665d] mb-0 tracking-widest font-semibold">{label}</span>
        {Icon && <Icon size={14} className={clsx(colorMap[color], "opacity-80 group-hover:opacity-100 transition-opacity")} />}
      </div>
      <span className={clsx("text-2xl font-extrabold tracking-tight font-sans text-[#f5efe6] light:text-[#181614]", colorMap[color])}>
        {value}
      </span>
      {sub && <span className="text-[11px] font-mono text-[#6e665d] light:text-[#8a7f72] mt-1">{sub}</span>}
    </div>
  );
}
