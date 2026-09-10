import { useState } from "react";
import toast from "react-hot-toast";
import { CreditCard, Loader2, FileDown, CheckCircle, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { respondChargeback } from "../api/client";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import RiskBadge from "../components/RiskBadge";

const CONFIDENCE_COLOR = (c) => c >= 0.7 ? "text-emerald-400" : c >= 0.4 ? "text-[#f3a854]" : "text-rose-400";
const OUTCOME_BADGE = {
  Win: "badge-safe",
  Partial: "badge-review",
  Settle: "badge-high",
};

function Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-white/[0.07] rounded-xl overflow-hidden bg-[#141312]">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-[#181715] hover:bg-white/[0.04] transition-colors"
      >
        <span className="text-xs font-mono uppercase tracking-wider text-[#f5efe6]">{title}</span>
        {open ? <ChevronUp size={14} className="text-[#9e9488]" /> : <ChevronDown size={14} className="text-[#9e9488]" />}
      </button>
      {open && <div className="p-4 space-y-3">{children}</div>}
    </div>
  );
}

export default function ChargebacksPage() {
  const [form, setForm] = useState({
    transaction_id: "TXN00123",
    claim_text: "I never received this item. The merchant failed to deliver my order.",
    transaction_amount: "249.99",
    transaction_date: "2024-06-15",
    merchant_name: "Demo Store",
    customer_name: "John Doe",
    product_description: "Wireless Headphones",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.transaction_id || !form.claim_text) {
      toast.error("Transaction ID and claim text are required.");
      return;
    }
    setLoading(true);
    try {
      const data = await respondChargeback({
        ...form,
        transaction_amount: parseFloat(form.transaction_amount) || null,
      });
      setResult(data);
      toast.success("Dispute evidence generated!");
    } catch (e) {
      toast.error(e.response?.data?.error || e.message || "Generation failed.");
    } finally {
      setLoading(false);
    }
  };

  const exportPdf = () => {
    if (!result) return;
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const PW = 210; // page width mm
    const ML = 14;  // margin left
    const MR = 14;  // margin right
    const CW = PW - ML - MR; // content width
    const accent = [217, 154, 83];   // #d99a53
    const dark   = [20, 19, 18];     // near-black header bg
    const light  = [245, 239, 230];  // #f5efe6 text
    const muted  = [158, 148, 136];  // #9e9488

    // ── COVER HEADER BAND ────────────────────────────────────────────────
    doc.setFillColor(...dark);
    doc.rect(0, 0, PW, 36, "F");
    doc.setFillColor(...accent);
    doc.rect(0, 36, PW, 1, "F"); // amber rule

    doc.setTextColor(...light);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("FRISK · Chargeback Dispute Response Docket", ML, 14);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...muted);
    const genDate = result.generated_at
      ? new Date(result.generated_at).toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short" })
      : "";
    doc.text(`Transaction ID: ${result.transaction_id}   ·   Generated: ${genDate}`, ML, 22);
    doc.text(`Recommended Outcome: ${result.recommended_outcome ?? "—"}   ·   Win Confidence: ${((result.confidence_score || 0) * 100).toFixed(0)}%`, ML, 28);

    let y = 46;

    // helper: section heading
    const sectionHead = (label) => {
      if (y > 260) { doc.addPage(); y = 16; }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...accent);
      doc.text(label.toUpperCase(), ML, y);
      y += 1.5;
      doc.setDrawColor(...accent);
      doc.setLineWidth(0.3);
      doc.line(ML, y, ML + CW, y);
      y += 5;
      doc.setTextColor(40, 38, 36); // near-black for body
    };

    // ── EXECUTIVE SUMMARY ────────────────────────────────────────────────
    sectionHead("Executive Case Summary");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const summaryLines = doc.splitTextToSize(result.case_summary || "", CW);
    if (y + summaryLines.length * 4.5 > 270) { doc.addPage(); y = 16; }
    doc.text(summaryLines, ML, y);
    y += summaryLines.length * 4.5 + 8;

    // ── TIMELINE ─────────────────────────────────────────────────────────
    if (result.timeline?.length) {
      sectionHead("Timeline of Fulfillment Events");
      autoTable(doc, {
        startY: y,
        margin: { left: ML, right: MR },
        head: [["Date", "Event", "Category"]],
        body: result.timeline.map((t) => [t.date || "", t.event || "", t.evidence_type || ""]),
        columnStyles: {
          0: { cellWidth: 26, fontStyle: "bold" },
          1: { cellWidth: CW - 26 - 28 },
          2: { cellWidth: 28, fontStyle: "italic" },
        },
        styles: {
          fontSize: 8.5,
          cellPadding: 3,
          valign: "middle",
          overflow: "linebreak",
          lineColor: [220, 213, 200],
          lineWidth: 0.2,
        },
        headStyles: {
          fillColor: accent,
          textColor: 255,
          fontStyle: "bold",
          fontSize: 8.5,
        },
        alternateRowStyles: { fillColor: [250, 247, 242] },
        theme: "grid",
      });
      y = doc.lastAutoTable.finalY + 10;
    }

    // ── REBUTTAL POINTS ──────────────────────────────────────────────────
    if (result.rebuttal_points?.length) {
      if (y > 220) { doc.addPage(); y = 16; }
      sectionHead("Rebuttal Defense Points");
      autoTable(doc, {
        startY: y,
        margin: { left: ML, right: MR },
        head: [["#", "Defense Point", "Argument", "Evidence"]],
        body: result.rebuttal_points.map((r, i) => [
          String(i + 1),
          r.point || "",
          r.argument || "",
          r.evidence || "",
        ]),
        columnStyles: {
          0: { cellWidth: 8, halign: "center", fontStyle: "bold" },
          1: { cellWidth: 36, fontStyle: "bold" },
          2: { cellWidth: CW - 8 - 36 - 42 },
          3: { cellWidth: 42, fontStyle: "italic", textColor: [100, 80, 40] },
        },
        styles: {
          fontSize: 8,
          cellPadding: 3,
          valign: "top",
          overflow: "linebreak",
          lineColor: [220, 213, 200],
          lineWidth: 0.2,
        },
        headStyles: {
          fillColor: accent,
          textColor: 255,
          fontStyle: "bold",
          fontSize: 8.5,
        },
        alternateRowStyles: { fillColor: [250, 247, 242] },
        theme: "grid",
      });
      y = doc.lastAutoTable.finalY + 10;
    }

    // ── RISK FLAGS ───────────────────────────────────────────────────────
    if (result.flags?.length) {
      if (y > 240) { doc.addPage(); y = 16; }
      sectionHead("Risk & Inconsistency Flags");
      autoTable(doc, {
        startY: y,
        margin: { left: ML, right: MR },
        head: [["Flag Type", "Description"]],
        body: result.flags.map((f) => [f.type || "", f.description || ""]),
        columnStyles: {
          0: { cellWidth: 42, fontStyle: "bold", textColor: [180, 40, 40] },
          1: { cellWidth: CW - 42 },
        },
        styles: {
          fontSize: 8.5,
          cellPadding: 3,
          overflow: "linebreak",
          lineColor: [220, 213, 200],
          lineWidth: 0.2,
        },
        headStyles: { fillColor: [180, 40, 40], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [255, 248, 248] },
        theme: "grid",
      });
      y = doc.lastAutoTable.finalY + 10;
    }

    // ── EVIDENCE CHECKLIST ───────────────────────────────────────────────
    if (result.evidence_checklist?.length) {
      if (y > 240) { doc.addPage(); y = 16; }
      sectionHead("Evidence Attachment Checklist");
      autoTable(doc, {
        startY: y,
        margin: { left: ML, right: MR },
        head: [["Evidence Item", "Status", "Description"]],
        body: result.evidence_checklist.map((e) => [e.item || "", e.status || "", e.description || ""]),
        columnStyles: {
          0: { cellWidth: 52, fontStyle: "bold" },
          1: { cellWidth: 24, halign: "center" },
          2: { cellWidth: CW - 52 - 24 },
        },
        styles: {
          fontSize: 8.5,
          cellPadding: 3,
          overflow: "linebreak",
          lineColor: [220, 213, 200],
          lineWidth: 0.2,
        },
        headStyles: { fillColor: accent, textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [250, 247, 242] },
        theme: "grid",
      });
      y = doc.lastAutoTable.finalY + 10;
    }

    // ── MERCHANT LIABILITY NOTES ─────────────────────────────────────────
    if (result.merchant_liability_notes) {
      if (y > 250) { doc.addPage(); y = 16; }
      sectionHead("Merchant Liability Advisory");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(60, 50, 30);
      const noteLines = doc.splitTextToSize(result.merchant_liability_notes, CW);
      doc.text(noteLines, ML, y);
      y += noteLines.length * 4.5 + 8;
    }

    // ── FOOTER WITH PAGE NUMBERS ─────────────────────────────────────────
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFillColor(...dark);
      doc.rect(0, 288, PW, 9, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...muted);
      doc.text(`Frisk AI Risk Intelligence  ·  Confidential Dispute Docket`, ML, 293);
      doc.text(`Page ${i} of ${pageCount}`, PW - MR, 293, { align: "right" });
    }

    doc.save(`frisk_chargeback_${result.transaction_id}.pdf`);
    toast.success("PDF evidence docket downloaded.");
  };

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in text-[#f5efe6] light:text-[#181614]">
      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <div className="mb-8 pb-6 border-b border-white/[0.06] light:border-[#e2dacd]">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] font-mono tracking-[0.2em] text-[#c49b5c] light:text-[#b87328] uppercase font-semibold">
            / MODULE 03 · DISPUTE EVIDENCE AUTOMATION
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#f5efe6] light:text-[#181614]">
          Chargeback Responder — <span className="text-[#d99a53] light:text-[#b87328]">AI Dispute Defense</span>
        </h1>
        <p className="text-sm text-[#9e9488] light:text-[#5c554c] mt-1.5 max-w-2xl">
          Synthesize merchant delivery proof, customer communications, and tracking signatures into processor-ready rebuttal dockets.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Form Details – self-start keeps it content-height regardless of right column */}
        <div className="card space-y-4 self-start">
          <div className="pb-3 border-b border-white/[0.06]">
            <h3 className="text-xs font-mono uppercase tracking-widest text-[#f5efe6]">Dispute Case Parameters</h3>
          </div>

          {[
            { k: "transaction_id", label: "Transaction ID *", placeholder: "TXN00123" },
            { k: "transaction_amount", label: "Disputed Amount ($)", placeholder: "249.99" },
            { k: "transaction_date", label: "Transaction Date", placeholder: "2024-06-15", type: "date" },
            { k: "merchant_name", label: "Merchant Entity", placeholder: "Demo Store" },
            { k: "customer_name", label: "Customer Full Name", placeholder: "Jane Smith" },
            { k: "product_description", label: "Product / Service SKU", placeholder: "Wireless Headphones" },
          ].map(({ k, label, placeholder, type }) => (
            <div key={k}>
              <label className="label">{label}</label>
              <input
                id={`chargeback-${k}`}
                type={type || "text"}
                value={form[k]}
                onChange={(e) => update(k, e.target.value)}
                placeholder={placeholder}
                className="input-field font-mono"
              />
            </div>
          ))}

          <div>
            <label className="label">Customer Claim Statement *</label>
            <textarea
              id="chargeback-claim-text"
              value={form.claim_text}
              onChange={(e) => update("claim_text", e.target.value)}
              rows={4}
              className="input-field font-sans text-xs resize-none"
              placeholder="Paste the customer's chargeback dispute reason…"
            />
          </div>

          <button
            id="chargeback-submit-btn"
            onClick={submit}
            disabled={loading}
            className="btn-cream w-full mt-2"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <CreditCard size={14} />}
            <span>{loading ? "Generating Rebuttal…" : "Generate Evidence Dossier"}</span>
          </button>
        </div>

        {/* Generated Rebuttal Dossier */}
        <div className="lg:col-span-2 space-y-5">
          {result && (
            <div className="animate-fade-in space-y-5">
              {/* Executive Summary Card */}
              <div className="card border-[#d99a53]/30 bg-[#161513]">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <span className="tag-bronze block mb-1">
                      DISPUTE CASE #{result.transaction_id}
                    </span>
                    <h2 className="text-base font-bold text-[#f5efe6] mb-3 leading-snug">
                      {result.case_summary}
                    </h2>
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      <span className={`font-mono font-bold ${CONFIDENCE_COLOR(result.confidence_score)}`}>
                        {((result.confidence_score || 0) * 100).toFixed(0)}% Win Confidence
                      </span>
                      <span className="text-[#6e665d]">·</span>
                      <RiskBadge tier={result.recommended_outcome === "Win" ? "Safe" : result.recommended_outcome === "Partial" ? "Review Needed" : "High Risk"} />
                      <span className="text-[#6e665d]">·</span>
                      <span className="text-[11px] font-mono text-[#9e9488]">Model: {result.model_used}</span>
                    </div>
                  </div>
                  <button
                    id="chargeback-export-pdf"
                    onClick={exportPdf}
                    className="btn-secondary shrink-0"
                  >
                    <FileDown size={14} className="text-[#d99a53]" /> Download PDF Docket
                  </button>
                </div>
              </div>

              {/* Timeline of events */}
              {result.timeline?.length > 0 && (
                <Section title="Fulfillment & Order Timeline">
                  <div className="space-y-3 pt-1">
                    {result.timeline.map((t, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-2 h-2 rounded-full bg-[#d99a53] mt-1 shrink-0 shadow-[0_0_6px_rgba(217,154,83,0.8)]" />
                          {i < result.timeline.length - 1 && (
                            <div className="w-px flex-1 bg-white/[0.08] mt-1" />
                          )}
                        </div>
                        <div className="pb-3 flex-1">
                          <span className="text-[11px] text-[#9e9488] font-mono block">{t.date}</span>
                          <p className="text-xs text-[#f5efe6] font-medium mt-0.5">{t.event}</p>
                          <span className="inline-block mt-1 text-[10px] font-mono text-[#c49b5c] bg-[#1a1917] px-2 py-0.5 rounded border border-white/[0.06]">
                            {t.evidence_type}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Detected Flags */}
              {result.flags?.length > 0 && (
                <Section title="Risk & Inconsistency Flags">
                  <div className="space-y-2 pt-1">
                    {result.flags.map((f, i) => (
                      <div key={i} className="flex gap-3 p-3 rounded-xl bg-rose-500/[0.04] border border-rose-500/15">
                        <AlertTriangle size={15} className="text-rose-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-mono font-semibold text-rose-400 uppercase tracking-wider">{f.type}</p>
                          <p className="text-xs text-[#ded7ce] mt-0.5">{f.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Rebuttal Defense Points */}
              {result.rebuttal_points?.length > 0 && (
                <Section title="Rebuttal Counter-Arguments">
                  <div className="space-y-3 pt-1">
                    {result.rebuttal_points.map((r, i) => (
                      <div key={i} className="p-4 rounded-xl bg-[#181715] border border-white/[0.06]">
                        <div className="flex items-center gap-2 mb-1.5">
                          <CheckCircle size={14} className="text-emerald-400 shrink-0" />
                          <p className="text-xs font-semibold text-[#f5efe6]">{r.point}</p>
                        </div>
                        <p className="text-xs text-[#9e9488] leading-relaxed mb-2">{r.argument}</p>
                        <p className="text-[11px] font-mono text-[#c49b5c] bg-[#121110] px-2.5 py-1 rounded border border-white/[0.04]">
                          Evidence: {r.evidence}
                        </p>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Evidence Checklist */}
              {result.evidence_checklist?.length > 0 && (
                <Section title="Evidence Attachment Checklist" defaultOpen={false}>
                  <div className="space-y-2 pt-1">
                    {result.evidence_checklist.map((e, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-[#181715] border border-white/[0.05]">
                        <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${e.status === "Available" ? "bg-emerald-400" :
                            e.status === "Required" ? "bg-rose-400" : "bg-[#f3a854]"
                          }`} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-semibold text-[#f5efe6]">{e.item}</p>
                            <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded ${e.status === "Available" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                                e.status === "Required" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
                                  "bg-amber-500/10 text-[#f3a854] border border-amber-500/20"
                              }`}>{e.status}</span>
                          </div>
                          <p className="text-[11px] text-[#9e9488] mt-0.5">{e.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {result.merchant_liability_notes && (
                <div className="card border-[#d99a53]/20 bg-[#161513]">
                  <p className="text-xs font-mono uppercase tracking-widest text-[#d99a53] mb-1">
                    📋 Merchant Liability Advisory
                  </p>
                  <p className="text-xs text-[#ded7ce] leading-relaxed">{result.merchant_liability_notes}</p>
                </div>
              )}
            </div>
          )}

          {!result && !loading && (
            <div className="card flex flex-col items-center justify-center py-24 text-center gap-3 border-dashed">
              <div className="w-12 h-12 rounded-full bg-[#1c1b18] border border-white/[0.08] flex items-center justify-center mb-1">
                <CreditCard size={24} className="text-[#6e665d]" />
              </div>
              <p className="text-[#9e9488] text-xs font-mono">AWAITING DISPUTE DETAILS</p>
              <p className="text-[#6e665d] text-xs max-w-sm">
                Enter customer claim text and order parameters to automatically construct an authoritative rebuttal dossier.
              </p>
            </div>
          )}

          {loading && (
            <div className="card flex flex-col items-center justify-center py-24 gap-3">
              <Loader2 size={32} className="text-[#d99a53] animate-spin" />
              <p className="text-xs font-mono text-[#9e9488] tracking-wider uppercase">Synthesizing Dispute Rebuttal Dossier…</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
