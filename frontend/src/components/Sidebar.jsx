import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  ShieldAlert, RotateCcw, CreditCard, BarChart3, Check
} from "lucide-react";
import clsx from "clsx";

const NAV = [
  { to: "/", icon: BarChart3, label: "Dashboard", exact: true, tag: "01" },
  { to: "/fraud", icon: ShieldAlert, label: "Fraud Detector", tag: "02" },
  { to: "/returns", icon: RotateCcw, label: "Return Risk", tag: "03" },
  { to: "/chargebacks", icon: CreditCard, label: "Chargebacks", tag: "04" },
  { to: "/reports", icon: BarChart3, label: "Aggregate Reports", tag: "05" },
];

export default function Sidebar() {
  const [time, setTime] = useState("");
  const [copiedKey, setCopiedKey] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setTime(d.toLocaleTimeString("en-GB", { hour12: false }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const copyKey = () => {
    navigator.clipboard?.writeText("frisk-demo-key-2024");
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <aside className="fixed top-0 left-0 h-full w-64 z-50 flex flex-col justify-between bg-[#0e0d0c]/95 text-[#f5efe6] border-r border-white/[0.07] backdrop-blur-xl">
      {/* Top Brand Section */}
      <div>
        <div className="px-5 py-5 border-b border-white/[0.07]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-extrabold tracking-tight text-[#f5efe6]">
                Frisk
              </span>
              <span className="text-xs font-mono font-medium text-[#d99a53]">
                /risk-engine
              </span>
            </div>
            {/* Live Clock like Razorpay reference */}
            <span className="text-[11px] font-mono text-[#9e9488] tracking-widest bg-white/[0.03] px-2 py-0.5 rounded border border-white/[0.05]">
              {time || "00:00:00"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono tracking-[0.2em] text-[#c49b5c] uppercase font-semibold">
              AI Risk Intelligence
            </span>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="px-3 py-4 flex flex-col gap-1">
          <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-[0.2em] text-[#6e665d]">
            Modules
          </div>
          {NAV.map(({ to, icon: Icon, label, exact, tag }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                clsx(
                  "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group",
                  isActive
                    ? "text-[#f5efe6] bg-[#1a1917] border border-[#d99a53]/40 shadow-[0_0_15px_rgba(217,154,83,0.08)] font-semibold"
                    : "text-[#9e9488] hover:text-[#f5efe6] hover:bg-white/[0.03]"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-2.5">
                    <Icon
                      size={15}
                      className={clsx(
                        "shrink-0 transition-colors",
                        isActive
                          ? "text-[#d99a53]"
                          : "text-[#6e665d] group-hover:text-[#9e9488]"
                      )}
                    />
                    <span className="font-sans font-medium">{label}</span>
                  </div>
                  <span className={clsx(
                    "text-[10px] font-mono tracking-wider",
                    isActive
                      ? "text-[#d99a53] font-semibold"
                      : "text-[#524c44]"
                  )}>
                    {tag}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Footer Section */}
      <div className="px-4 py-4 border-t border-white/[0.07] space-y-3 bg-[#0a0908]/60">
        {/* API Key Box */}
        <div
          onClick={copyKey}
          className="group rounded-xl bg-[#141312] border border-white/[0.06] p-3 hover:border-[#d99a53]/40 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono text-[#9e9488] uppercase tracking-wider">Demo API Key</span>
            {copiedKey ? (
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                <Check size={10} /> Copied
              </span>
            ) : (
              <span className="text-[10px] font-mono text-[#6e665d] group-hover:text-[#d99a53]">copy</span>
            )}
          </div>
          <code className="text-[11px] font-mono text-[#f3a854] font-bold block truncate">
            frisk-demo-key-2024
          </code>
        </div>

        {/* Engine status indicator */}
        <div className="flex items-center justify-between px-1 text-[11px] font-mono text-[#6e665d]">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)] animate-pulse" />
            <span className="text-emerald-500 font-semibold text-[10px] tracking-wider">ENGINE READY</span>
          </div>
          <span className="text-[10px] text-[#9e9488]">v2.4.0</span>
        </div>
      </div>
    </aside>
  );
}
