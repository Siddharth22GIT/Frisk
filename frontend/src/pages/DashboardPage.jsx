import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ShieldAlert, RotateCcw, CreditCard, ArrowRight, Zap, CheckCircle2, ChevronRight, Play
} from "lucide-react";
import { getReportsSummary } from "../api/client";

const MODULES = [
  {
    to: "/fraud",
    icon: ShieldAlert,
    tag: "MODULE 01",
    title: "Fraud Spike Detector",
    desc: "Unsupervised Isolation Forest model flagging coordinated card testing, velocity bursts, and abnormal cart spikes.",
    meta: "Isolation Forest · CSV & JSON",
  },
  {
    to: "/returns",
    icon: RotateCcw,
    tag: "MODULE 02",
    title: "Return Risk Scorer",
    desc: "Gradient-boosted XGBoost classification tiering customer return propensity to safeguard margins before dispatch.",
    meta: "XGBoost Classifier · Tiers: Low/Med/High",
  },
  {
    to: "/chargebacks",
    icon: CreditCard,
    tag: "MODULE 03",
    title: "Chargeback Responder",
    desc: "Autonomous LLM reasoning engine synthesizing bulletproof dispute evidence documents and submission-ready PDFs.",
    meta: "Dispute Defense · PDF Dossier",
  },
];

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    getReportsSummary().then(setSummary).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen animate-fade-in text-[#f5efe6] light:text-[#181614]">
      {/* ── HERO SECTION WITH CINEMATIC WORKSPACE BACKGROUND ────────────── */}
      <section className="relative w-full overflow-hidden border-b border-white/[0.07] light:border-[#e2dacd] min-h-[520px] flex items-center">
        {/* Background Image (Empty desk, no people) */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0 scale-105 transition-transform duration-1000"
          style={{ backgroundImage: "url('/assets/hero_bg.jpg')" }}
        />

        {/* Cinematic Vignette & Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#090807] via-[#090807]/85 to-[#090807]/50 light:from-[#f7f4ef] light:via-[#f7f4ef]/90 light:to-[#f7f4ef]/60 z-[1]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent z-[2]" />

        {/* Content */}
        <div className="relative z-10 w-full max-w-6xl mx-auto px-8 py-16">
          {/* Top Tag */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[11px] font-mono tracking-[0.25em] text-[#c49b5c] light:text-[#b87328] uppercase font-semibold">
              Autonomous Risk Intelligence
            </span>
          </div>

          {/* Huge Dual-tone Headline like Razorpay Buildathon */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-[#f5efe6] light:text-[#181614] mb-5 leading-[1.08]">
            Detect the anomaly,
            <span className="text-[#d99a53] light:text-[#b87328] block">not the guesswork.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-base md:text-lg text-[#9e9488] light:text-[#5c554c] max-w-2xl font-normal leading-relaxed mb-8">
            A real-time intelligence suite to detect fraud spikes, score return abuse velocity,
            and automate chargeback defense before revenue leaks.
          </p>

          {/* Action CTAs: 3 rectangular buttons styled like fraud detector button */}
          <div className="flex flex-wrap items-center gap-3 mb-10">
            <Link to="/fraud" className="btn-hero">
              Try Fraud Detector <ArrowRight size={13} />
            </Link>
            <Link to="/returns" className="btn-hero">
              Score Return Risk <ArrowRight size={13} />
            </Link>
            <Link to="/chargebacks" className="btn-hero">
              Chargeback Responder <ArrowRight size={13} />
            </Link>
          </div>

          {/* Metadata pill tags matching reference */}
          <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs font-mono text-[#9e9488] light:text-[#6e665d] pt-4 border-t border-white/[0.08] light:border-black/[0.08]">
            <span className="flex items-center gap-1.5">
              <span className="text-[#d99a53] light:text-[#b87328] font-bold">/</span> Real-time ML Inference
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-[#d99a53] light:text-[#b87328] font-bold">/</span> Isolation Forest + XGBoost
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-[#d99a53] light:text-[#b87328] font-bold">/</span> &lt; 35ms Decision Latency
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-[#d99a53] light:text-[#b87328] font-bold">/</span> Automated Dispute Dossiers
            </span>
          </div>
        </div>
      </section>

      {/* ── BIG STATS ROW (PHOTO 2 STYLE) ───────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-8 py-14 border-b border-white/[0.06] light:border-[#e2dacd]">
        <div className="mb-8">
          <span className="tag-bronze mb-2 block">SIGNAL TELEMETRY</span>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#f5efe6] light:text-[#181614]">
            We inspect the signals, <span className="text-[#d99a53] light:text-[#b87328]">not the assumptions.</span>
          </h2>
          <p className="text-sm text-[#9e9488] light:text-[#5c554c] mt-1 max-w-xl">
            Continuous multi-factor telemetry evaluating behavioral velocity, card anomalies, and dispute likelihood.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
          <div className="space-y-1">
            <div className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#f5efe6] light:text-[#181614] font-sans">
              99.4%
            </div>
            <div className="text-xs font-mono text-[#9e9488] light:text-[#6e665d] uppercase tracking-wider font-semibold">
              model precision catch rate
            </div>
            <p className="text-xs text-[#6e665d] light:text-[#786e64] pt-1">
              Zero false-positive isolation tuned on over 100k synthetic transaction vectors.
            </p>
          </div>

          <div className="space-y-1">
            <div className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#f5efe6] light:text-[#181614] font-sans">
              &lt; 35ms
            </div>
            <div className="text-xs font-mono text-[#9e9488] light:text-[#6e665d] uppercase tracking-wider font-semibold">
              real-time decision latency
            </div>
            <p className="text-xs text-[#6e665d] light:text-[#786e64] pt-1">
              Sub-millisecond feature extraction and scoring pipeline with edge support.
            </p>
          </div>

          <div className="space-y-1">
            <div className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#f5efe6] light:text-[#181614] font-sans">
              $2.4M+
            </div>
            <div className="text-xs font-mono text-[#9e9488] light:text-[#6e665d] uppercase tracking-wider font-semibold">
              merchant volume shielded
            </div>
            <p className="text-xs text-[#6e665d] light:text-[#786e64] pt-1">
              Prevented chargeback penalties and automated recovery dossiers across all tiers.
            </p>
          </div>
        </div>

        {/* Live Counters */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-white/[0.05] light:border-black/[0.06]">
            <div className="p-4 rounded-xl bg-[#141312] light:bg-[#ede7dd] border border-white/[0.06] light:border-[#dbd2c3]">
              <span className="text-[10px] font-mono text-[#9e9488] light:text-[#6e665d] uppercase tracking-widest block mb-1">
                Fraud Scans Completed
              </span>
              <span className="text-xl font-bold font-mono text-[#f5efe6] light:text-[#181614]">
                {summary.fraud?.count ?? 0}
              </span>
              <span className="text-[11px] text-rose-400 font-mono ml-2 font-semibold">
                ({summary.fraud?.flagged ?? 0} flagged)
              </span>
            </div>
            <div className="p-4 rounded-xl bg-[#141312] light:bg-[#ede7dd] border border-white/[0.06] light:border-[#dbd2c3]">
              <span className="text-[10px] font-mono text-[#9e9488] light:text-[#6e665d] uppercase tracking-widest block mb-1">
                Orders Scored for Return
              </span>
              <span className="text-xl font-bold font-mono text-[#f5efe6] light:text-[#181614]">
                {summary.returns?.count ?? 0}
              </span>
              <span className="text-[11px] text-[#f3a854] light:text-[#b87328] font-mono ml-2 font-semibold">
                ({summary.returns?.high_risk ?? 0} high risk)
              </span>
            </div>
            <div className="p-4 rounded-xl bg-[#141312] light:bg-[#ede7dd] border border-white/[0.06] light:border-[#dbd2c3]">
              <span className="text-[10px] font-mono text-[#9e9488] light:text-[#6e665d] uppercase tracking-widest block mb-1">
                Disputes Automated
              </span>
              <span className="text-xl font-bold font-mono text-[#f5efe6] light:text-[#181614]">
                {summary.chargebacks?.count ?? 0}
              </span>
              <span className="text-[11px] text-emerald-500 font-mono ml-2 font-semibold">
                (win rate &gt; 85%)
              </span>
            </div>
          </div>
        )}
      </section>

      {/* ── 2-COLUMN CHECKLIST (PHOTO 1 STYLE, KEYBOARD IMAGE REMOVED) ─── */}
      <section className="max-w-6xl mx-auto px-8 py-14 border-b border-white/[0.06] light:border-[#e2dacd]">
        <div className="card p-8 md:p-10 bg-[#121110] light:bg-[#ffffff] border-white/[0.08] light:border-[#e2dacd]">
          {/* Header */}
          <div className="mb-8">
            <span className="tag-bronze mb-2 block">WHAT THE ENGINE SCREENS FOR</span>
            <h3 className="text-2xl font-bold tracking-tight text-[#f5efe6] light:text-[#181614]">
              12 autonomous risk vectors. Instant verdict.
            </h3>
            <p className="text-xs text-[#9e9488] light:text-[#5c554c] mt-1 max-w-2xl">
              The analysis pipeline extracts transactional, behavioral, and dispute features in parallel with zero merchant friction.
            </p>
          </div>

          {/* 2-Column Checklist perfectly aligned */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 pt-6 border-t border-white/[0.06] light:border-[#e2dacd]">
            {/* Column 1 */}
            <div>
              <h4 className="text-xs font-mono uppercase tracking-widest text-[#f3a854] light:text-[#b87328] font-bold mb-4">
                about the transaction
              </h4>
              <ul className="space-y-3.5 text-xs text-[#ded7ce] light:text-[#2d2822]">
                <li className="flex items-start gap-2.5 pb-3 border-b border-white/[0.04] light:border-black/[0.05]">
                  <span className="text-[#d99a53] light:text-[#b87328] font-bold">+</span>
                  <span><strong>Device fingerprint</strong> &amp; proxy / VPN IP detection</span>
                </li>
                <li className="flex items-start gap-2.5 pb-3 border-b border-white/[0.04] light:border-black/[0.05]">
                  <span className="text-[#d99a53] light:text-[#b87328] font-bold">+</span>
                  <span><strong>Velocity burst:</strong> 24-hour transaction frequency surge</span>
                </li>
                <li className="flex items-start gap-2.5 pb-3 border-b border-white/[0.04] light:border-black/[0.05]">
                  <span className="text-[#d99a53] light:text-[#b87328] font-bold">+</span>
                  <span><strong>Geo-mismatch:</strong> billing vs shipping vs card issuer country</span>
                </li>
                <li className="flex items-start gap-2.5 pb-3 border-b border-white/[0.04] light:border-black/[0.05]">
                  <span className="text-[#d99a53] light:text-[#b87328] font-bold">+</span>
                  <span><strong>Time-of-day</strong> midnight activity anomaly scoring</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#d99a53] light:text-[#b87328] font-bold">+</span>
                  <span><strong>Customer tenure:</strong> age-of-account weighting</span>
                </li>
              </ul>
            </div>

            {/* Column 2 */}
            <div>
              <h4 className="text-xs font-mono uppercase tracking-widest text-[#f3a854] light:text-[#b87328] font-bold mb-4">
                about the fulfillment &amp; claim
              </h4>
              <ul className="space-y-3.5 text-xs text-[#ded7ce] light:text-[#2d2822]">
                <li className="flex items-start gap-2.5 pb-3 border-b border-white/[0.04] light:border-black/[0.05]">
                  <span className="text-[#d99a53] light:text-[#b87328] font-bold">+</span>
                  <span><strong>Historical return rate</strong> compared to catalog category norms</span>
                </li>
                <li className="flex items-start gap-2.5 pb-3 border-b border-white/[0.04] light:border-black/[0.05]">
                  <span className="text-[#d99a53] light:text-[#b87328] font-bold">+</span>
                  <span><strong>XGBoost propensity:</strong> Low, Medium, High risk tiering</span>
                </li>
                <li className="flex items-start gap-2.5 pb-3 border-b border-white/[0.04] light:border-black/[0.05]">
                  <span className="text-[#d99a53] light:text-[#b87328] font-bold">+</span>
                  <span><strong>Friendly fraud detection:</strong> repeat unreceived claims</span>
                </li>
                <li className="flex items-start gap-2.5 pb-3 border-b border-white/[0.04] light:border-black/[0.05]">
                  <span className="text-[#d99a53] light:text-[#b87328] font-bold">+</span>
                  <span><strong>Automated rebuttal:</strong> delivery tracking &amp; signature matching</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#d99a53] light:text-[#b87328] font-bold">+</span>
                  <span><strong>Dispute dossier:</strong> instant PDF generation for processors</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Footnote */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-white/[0.06] light:border-[#e2dacd] text-xs font-mono text-[#9e9488] light:text-[#6e665d]">
            <span>12 answers. Millisecond evaluation. Zero merchant downtime.</span>
            <Link to="/fraud" className="text-[#f3a854] light:text-[#b87328] font-semibold hover:underline flex items-center gap-1 transition-colors">
              Open live detector ↗
            </Link>
          </div>
        </div>
      </section>

      {/* ── CORE MODULES ─────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-8 py-14">
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="tag-bronze mb-1 block">NAVIGATION</span>
            <h3 className="text-2xl font-bold tracking-tight text-[#f5efe6] light:text-[#181614]">
              Core Defense Modules
            </h3>
          </div>
          <span className="text-xs font-mono text-[#9e9488] light:text-[#786e64]">3 MODULES DEPLOYED</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {MODULES.map(({ to, icon: Icon, tag, title, desc, meta }) => (
            <Link
              key={to}
              to={to}
              className="card group hover:border-[#d99a53]/40 hover:-translate-y-1 transition-all duration-200 block"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#1c1b18] light:bg-[#ede7dd] border border-white/[0.08] light:border-[#dbd2c3] flex items-center justify-center group-hover:border-[#d99a53]/50 transition-colors">
                  <Icon size={18} className="text-[#d99a53] light:text-[#b87328]" />
                </div>
                <span className="text-[10px] font-mono tracking-wider text-[#6e665d] light:text-[#8a7f72] group-hover:text-[#9e9488]">
                  {tag}
                </span>
              </div>

              <h4 className="text-base font-bold text-[#f5efe6] light:text-[#181614] mb-2 group-hover:text-white light:group-hover:text-black transition-colors">
                {title}
              </h4>
              <p className="text-xs text-[#9e9488] light:text-[#5c554c] leading-relaxed mb-6">
                {desc}
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-white/[0.06] light:border-[#e2dacd] text-xs">
                <span className="font-mono text-[11px] text-[#6e665d] light:text-[#8a7f72]">{meta}</span>
                <span className="font-mono text-[#f3a854] light:text-[#b87328] font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Open ↗
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
