import { NavLink } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import {
  ShieldAlert, RotateCcw, CreditCard, BarChart3, Sun, Moon, Zap,
} from "lucide-react";
import clsx from "clsx";

const NAV = [
  { to: "/", icon: BarChart3, label: "Dashboard", exact: true },
  { to: "/fraud", icon: ShieldAlert, label: "Fraud Detector" },
  { to: "/returns", icon: RotateCcw, label: "Return Risk" },
  { to: "/chargebacks", icon: CreditCard, label: "Chargebacks" },
  { to: "/reports", icon: BarChart3, label: "Reports" },
];

export default function Sidebar() {
  const { theme, toggle } = useTheme();

  return (
    <aside className={clsx(
      "fixed top-0 left-0 h-full w-64 z-50 flex flex-col",
      "bg-surface-card border-r border-surface-border",
      "light:bg-white light:border-slate-200"
    )}>
      {/* Logo */}
      <div className="px-5 py-6 border-b border-surface-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center shadow-lg glow-brand">
            <Zap size={18} className="text-white" />
          </div>
          <div>
            <div className="text-lg font-bold gradient-text tracking-tight">Frisk</div>
            <div className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">AI Risk Manager</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        <div className="label px-2 mb-2">Modules</div>
        {NAV.map(({ to, icon: Icon, label, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              clsx("nav-item", isActive && "active")
            }
          >
            <Icon size={16} className="shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-5 border-t border-surface-border space-y-3">
        {/* Demo key badge */}
        <div className="rounded-xl bg-brand-600/10 border border-brand-500/20 p-3">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Demo API Key</p>
          <code className="text-xs font-mono text-brand-400 break-all">frisk-demo-key-2024</code>
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggle}
          id="theme-toggle"
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium
                     text-slate-400 hover:text-white hover:bg-surface-muted transition-all"
        >
          {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>
      </div>
    </aside>
  );
}
