import { useState } from "react";
import toast from "react-hot-toast";
import { CreditCard, Loader2, FileDown, CheckCircle, AlertTriangle, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import { respondChargeback } from "../api/client";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const CONFIDENCE_COLOR = (c) => c >= 0.7 ? "text-emerald-400" : c >= 0.4 ? "text-amber-400" : "text-red-400";
const OUTCOME_BADGE = {
  Win:     "badge-safe",
  Partial: "badge-review",
  Settle:  "badge-high",
};

function Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-surface-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-surface-muted hover:bg-surface-border/40 transition-colors"
      >
        <span className="text-sm font-semibold text-white">{title}</span>
        {open ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
      </button>
      {open && <div className="p-4">{children}</div>}
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
      toast.success("Evidence document generated!");
    } catch (e) {
      toast.error(e.response?.data?.error || e.message || "Generation failed.");
    } finally {
      setLoading(false);
    }
  };

  const exportPdf = () => {
    if (!result) return;
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Chargeback Dispute Response", 14, 20);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Transaction: ${result.transaction_id}  |  Generated: ${result.generated_at}`, 14, 28);

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Case Summary", 14, 40);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const summary = doc.splitTextToSize(result.case_summary || "", 180);
    doc.text(summary, 14, 48);

    let y = 48 + summary.length * 5 + 8;

    if (result.timeline?.length) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Timeline of Events", 14, y);
      y += 6;
      autoTable(doc, {
        startY: y,
        head: [["Date", "Event", "Evidence Type"]],
        body: result.timeline.map((t) => [t.date, t.event, t.evidence_type]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [108, 77, 255] },
      });
      y = doc.lastAutoTable.finalY + 8;
    }

    if (result.rebuttal_points?.length) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Rebuttal Points", 14, y);
      y += 6;
      autoTable(doc, {
        startY: y,
        head: [["Point", "Argument", "Evidence"]],
        body: result.rebuttal_points.map((r) => [r.point, r.argument, r.evidence]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [108, 77, 255] },
      });
    }

    doc.save(`frisk_chargeback_${result.transaction_id}.pdf`);
    toast.success("PDF downloaded.");
  };

  return (
    <div className="p-8 animate-slide-up">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <CreditCard size={18} className="text-violet-400" />
          <span className="text-xs font-semibold text-violet-400 uppercase tracking-widest">Module 3</span>
        </div>
        <h1 className="text-3xl font-bold text-white">Chargeback Evidence Responder</h1>
        <p className="text-slate-400 mt-1">Generate AI-powered dispute evidence using Groq LLaMA-3.3-70b.</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Form */}
        <div className="col-span-1 card space-y-4">
          <h3 className="text-sm font-semibold text-white">Case Details</h3>

          {[
            { k: "transaction_id", label: "Transaction ID *", placeholder: "TXN00123" },
            { k: "transaction_amount", label: "Amount ($)", placeholder: "249.99" },
            { k: "transaction_date", label: "Transaction Date", placeholder: "2024-06-15", type: "date" },
            { k: "merchant_name", label: "Merchant Name", placeholder: "My Store" },
            { k: "customer_name", label: "Customer Name", placeholder: "Jane Smith" },
            { k: "product_description", label: "Product / Service", placeholder: "Wireless Headphones" },
          ].map(({ k, label, placeholder, type }) => (
            <div key={k}>
              <label className="label">{label}</label>
              <input
                id={`chargeback-${k}`}
                type={type || "text"}
                value={form[k]}
                onChange={(e) => update(k, e.target.value)}
                placeholder={placeholder}
                className="input-field"
              />
            </div>
          ))}

          <div>
            <label className="label">Customer Claim Text *</label>
            <textarea
              id="chargeback-claim-text"
              value={form.claim_text}
              onChange={(e) => update("claim_text", e.target.value)}
              rows={5}
              className="input-field resize-none"
              placeholder="Paste the customer's chargeback claim…"
            />
          </div>

          <button
            id="chargeback-submit-btn"
            onClick={submit}
            disabled={loading}
            className="btn-primary w-full"
            style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <CreditCard size={15} />}
            {loading ? "Generating…" : "Generate Evidence"}
          </button>
        </div>

        {/* Result */}
        <div className="col-span-2 space-y-4">
          {result && (
            <div className="animate-fade-in space-y-4">
              {/* Header card */}
              <div className="card border-violet-500/20 bg-violet-600/5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="label">Transaction {result.transaction_id}</p>
                    <h2 className="text-lg font-bold text-white mb-2">{result.case_summary}</h2>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-semibold ${CONFIDENCE_COLOR(result.confidence_score)}`}>
                        {((result.confidence_score || 0) * 100).toFixed(0)}% Confidence
                      </span>
                      <span className={OUTCOME_BADGE[result.recommended_outcome] || "badge-review"}>
                        {result.recommended_outcome}
                      </span>
                      <span className="text-xs text-slate-500">via {result.model_used}</span>
                    </div>
                  </div>
                  <button
                    id="chargeback-export-pdf"
                    onClick={exportPdf}
                    className="btn-secondary shrink-0"
                  >
                    <FileDown size={14} /> Download PDF
                  </button>
                </div>
              </div>

              {/* Timeline */}
              {result.timeline?.length > 0 && (
                <Section title="Timeline of Events">
                  <div className="space-y-3">
                    {result.timeline.map((t, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-2 h-2 rounded-full bg-violet-500 mt-1 shrink-0" />
                          {i < result.timeline.length - 1 && (
                            <div className="w-px flex-1 bg-surface-border mt-1" />
                          )}
                        </div>
                        <div className="pb-3">
                          <p className="text-xs text-slate-500 font-mono">{t.date}</p>
                          <p className="text-sm text-white">{t.event}</p>
                          <span className="text-[10px] text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full border border-violet-500/20">
                            {t.evidence_type}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Flags */}
              {result.flags?.length > 0 && (
                <Section title="Detected Flags">
                  <div className="space-y-2">
                    {result.flags.map((f, i) => (
                      <div key={i} className="flex gap-3 p-3 rounded-xl bg-red-500/5 border border-red-500/15">
                        <AlertTriangle size={15} className="text-red-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-red-400 mb-0.5">{f.type}</p>
                          <p className="text-sm text-slate-300">{f.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Rebuttal points */}
              {result.rebuttal_points?.length > 0 && (
                <Section title="Rebuttal Points">
                  <div className="space-y-3">
                    {result.rebuttal_points.map((r, i) => (
                      <div key={i} className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle size={13} className="text-emerald-400" />
                          <p className="text-sm font-semibold text-emerald-400">{r.point}</p>
                        </div>
                        <p className="text-sm text-slate-300 mb-2">{r.argument}</p>
                        <p className="text-xs text-slate-500 italic">Evidence: {r.evidence}</p>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Evidence checklist */}
              {result.evidence_checklist?.length > 0 && (
                <Section title="Evidence Checklist" defaultOpen={false}>
                  <div className="space-y-2">
                    {result.evidence_checklist.map((e, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-surface-muted border border-surface-border">
                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                          e.status === "Available" ? "bg-emerald-400" :
                          e.status === "Required" ? "bg-red-400" : "bg-amber-400"
                        }`} />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-white">{e.item}</p>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                              e.status === "Available" ? "bg-emerald-500/15 text-emerald-400" :
                              e.status === "Required" ? "bg-red-500/15 text-red-400" :
                              "bg-amber-500/15 text-amber-400"
                            }`}>{e.status}</span>
                          </div>
                          <p className="text-xs text-slate-500">{e.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {result.merchant_liability_notes && (
                <div className="card border-brand-500/20 bg-brand-600/5">
                  <p className="text-xs font-semibold text-brand-400 mb-1">📋 Merchant Action Notes</p>
                  <p className="text-sm text-slate-300">{result.merchant_liability_notes}</p>
                </div>
              )}
            </div>
          )}

          {!result && !loading && (
            <div className="card flex flex-col items-center justify-center py-20 text-center gap-3">
              <CreditCard size={40} className="text-slate-600" />
              <p className="text-slate-500 text-sm">Fill in the case details and click Generate Evidence.</p>
            </div>
          )}
          {loading && (
            <div className="card flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 size={32} className="text-violet-400 animate-spin" />
              <p className="text-slate-400 text-sm">LLaMA-3 is drafting your evidence document…</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
