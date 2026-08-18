import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import api from "@/api/client";
import { useSession } from "@/context/SessionContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import StatusBadge, { UrgencyPill } from "@/components/StatusBadge";
import { Sparkles, Check, X, Edit3, Clock, UserPlus, Pause, CalendarCheck, ChevronLeft, MessageSquare, BellRing } from "lucide-react";
import SnoozeMenu from "@/components/SnoozeMenu";

function fmt(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  return d.toLocaleString();
}

export default function OpportunityDetailPage() {
  const { id } = useParams();
  const { sessionId } = useSession();
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [regenLoading, setRegenLoading] = useState(false);
  const [showBook, setShowBook] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const load = useCallback(async () => {
    const { data } = await api.get(`/demo/${sessionId}/opportunities/${id}`);
    setData(data);
    setDraft(data.opportunity.draft_message);
  }, [sessionId, id]);

  useEffect(() => { if (sessionId && id) load(); }, [sessionId, id, load]);

  async function act(action, extra = {}) {
    const { data } = await api.post(`/demo/${sessionId}/opportunities/${id}/action`, { action, ...extra });
    await load();
    return data;
  }

  async function regenerate() {
    setRegenLoading(true);
    try {
      const { data } = await api.post(`/demo/${sessionId}/opportunities/${id}/regenerate`);
      await load();
      if (data.source === "ai") {
        toast.success("Fresh AI draft ready", { description: "You can approve, edit, or reject." });
      } else {
        toast.message("Draft prepared from approved customer context", {
          description: "AI unavailable — approved seeded draft loaded.",
        });
      }
    } catch (e) {
      toast.error("Regeneration failed");
    } finally {
      setRegenLoading(false);
    }
  }

  async function saveEdit() {
    await act("edit_draft", { draft_message: draft });
    setEditing(false);
    toast.success("Draft updated");
  }

  async function approveAndSend() {
    await act("approve_and_send");
    setShowSuccess(true);
    toast.success("Approved and sent (simulated)", { description: "Nothing left this demo. Audit updated." });
  }

  if (!data) return <div className="text-slate-400" data-testid="opp-loading">Loading opportunity…</div>;

  const { opportunity: o, customer: c, audit, ledger } = data;
  const isTerminal = ["Sent", "Appointment Booked", "Lost"].includes(o.status);

  return (
    <div className="space-y-5" data-testid="opp-detail-page">
      <button onClick={() => nav("/app/inbox")} className="text-slate-400 text-sm hover:text-white flex items-center gap-1" data-testid="back-to-inbox">
        <ChevronLeft size={14} /> Back to inbox
      </button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full grid place-items-center text-lg font-bold" style={{ backgroundColor: `${c.avatar_color}20`, color: c.avatar_color }}>
            {c.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="jobos-heading text-2xl font-bold">{c.name}</h1>
              <StatusBadge status={o.status} />
            </div>
            <div className="text-sm text-slate-400">{o.type} · {o.service_need} · <UrgencyPill urgency={o.urgency} /></div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-500 uppercase tracking-widest">Expected value</div>
          <div className="jobos-heading text-2xl font-bold">${o.expected_value.toLocaleString()}</div>
          <div className="text-xs text-slate-500 mt-0.5">AI confidence · {o.confidence}%</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Context + timeline */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="bg-[#111827] border-white/10 p-5" data-testid="customer-context-card">
            <div className="jobos-heading font-semibold mb-3">Customer context</div>
            <ul className="text-sm space-y-2 text-slate-300">
              <li className="flex justify-between"><span className="text-slate-500">Email</span><span>{c.email}</span></li>
              <li className="flex justify-between"><span className="text-slate-500">Phone</span><span>{c.phone}</span></li>
              <li className="flex justify-between"><span className="text-slate-500">Preferred</span><span>{c.preferred_channel}</span></li>
              <li className="flex justify-between"><span className="text-slate-500">Lifetime value</span><span>${c.lifetime_value.toLocaleString()}</span></li>
              <li className="flex justify-between"><span className="text-slate-500">Last service</span><span>{c.last_service_date ? fmt(c.last_service_date).split(",")[0] : "—"}</span></li>
              <li className="flex justify-between"><span className="text-slate-500">Last touch</span><span>{fmt(c.last_touchpoint)}</span></li>
            </ul>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {c.tags?.map((t) => <span key={t} className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-white/10 text-slate-400">{t}</span>)}
            </div>
            <p className="text-xs text-slate-500 mt-3 border-t border-white/5 pt-3">{c.notes}</p>
          </Card>

          <Card className="bg-[#111827] border-white/10 p-5" data-testid="opportunity-ledger-card">
            <div className="jobos-heading font-semibold mb-3">Opportunity ledger</div>
            {ledger.length === 0 && <div className="text-slate-500 text-sm">No ledger entries yet.</div>}
            <ul className="space-y-2 text-sm">
              {ledger.map((l) => (
                <li key={l.id} className="flex items-center justify-between border-b border-white/5 pb-2 last:border-none last:pb-0">
                  <div>
                    <div className="text-slate-200">{l.event}</div>
                    <div className="text-xs text-slate-500">{fmt(l.timestamp)}</div>
                  </div>
                  <div className={`text-sm font-semibold ${l.kind === "recorded" ? "text-[#00E5A8]" : "text-slate-300"}`}>
                    ${l.amount.toLocaleString()}
                    <div className="text-[10px] uppercase tracking-widest text-slate-500 text-right">{l.kind}</div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Center: Rationale + Draft */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-[#111827] border-white/10 p-5" data-testid="ai-rationale-card">
            <div className="flex items-center justify-between mb-3">
              <div className="jobos-heading font-semibold flex items-center gap-2"><Sparkles size={15} className="text-[#7C5CFC]" /> Recommended next step</div>
              <Button
                onClick={regenerate}
                disabled={regenLoading || isTerminal}
                variant="outline"
                size="sm"
                data-testid="regenerate-ai-btn"
                className="bg-transparent border-purple-500/30 text-purple-200 hover:bg-purple-500/10"
              >
                <Sparkles size={13} className="mr-1" /> {regenLoading ? "Generating…" : "Regenerate with AI"}
              </Button>
            </div>
            <div className="text-sm text-slate-200">{o.recommended_action}</div>
            <div className="text-sm text-slate-400 mt-2">{o.rationale}</div>
            {o.source_facts_used?.length > 0 && (
              <div className="mt-3 border-t border-white/5 pt-3">
                <div className="text-xs uppercase tracking-widest text-slate-500 mb-1">Source facts used</div>
                <ul className="text-xs text-slate-400 space-y-1">
                  {o.source_facts_used.map((f, i) => <li key={`fact-${i}-${f.slice(0, 24)}`}>· {f}</li>)}
                </ul>
              </div>
            )}
            <div className="text-[11px] text-slate-500 mt-3">
              Draft source: {o.draft_source === "ai" ? "AI-generated" : o.draft_source === "edited" ? "Owner-edited" : "Approved seeded draft"}
            </div>
          </Card>

          <Card className="bg-[#111827] border-white/10 p-5" data-testid="draft-message-card">
            <div className="flex items-center justify-between mb-3">
              <div className="jobos-heading font-semibold flex items-center gap-2"><MessageSquare size={15} className="text-[#00E5A8]" /> Proposed {o.draft_channel} draft</div>
              {!isTerminal && (
                <Button onClick={() => setEditing((v) => !v)} variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-white/5" data-testid="edit-draft-toggle">
                  <Edit3 size={13} className="mr-1" /> {editing ? "Cancel" : "Edit"}
                </Button>
              )}
            </div>
            {o.draft_subject && <div className="text-xs text-slate-500 mb-2">Subject: <span className="text-slate-200">{o.draft_subject}</span></div>}
            {editing ? (
              <div className="space-y-2">
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={5}
                  data-testid="draft-editor"
                  className="bg-[#0D1424] border-white/10 text-slate-100"
                />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => { setEditing(false); setDraft(o.draft_message); }}>Cancel</Button>
                  <Button size="sm" onClick={saveEdit} className="bg-[#7C5CFC] hover:bg-[#6a4de0]" data-testid="save-edit-btn">Save draft</Button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-[#0D1424] border border-white/10 text-slate-200 whitespace-pre-line" data-testid="draft-message-body">
                {o.draft_message}
              </div>
            )}

            {!isTerminal && (
              <div className="flex flex-wrap gap-2 mt-4">
                <Button onClick={approveAndSend} className="bg-[#00E5A8] hover:bg-[#00c896] text-slate-900 font-semibold" data-testid="approve-and-send-btn">
                  <Check size={15} className="mr-1" /> Approve and Send
                </Button>
                <SnoozeMenu onSnooze={(payload) => act("snooze", payload)} />

                <Button onClick={() => act("assign", { assignee: "Ops Team" })} variant="outline" className="bg-transparent border-white/10 text-slate-200 hover:bg-white/5" data-testid="assign-btn">
                  <UserPlus size={14} className="mr-1" /> Assign
                </Button>
                <Button onClick={() => act("reject")} variant="outline" className="bg-transparent border-red-500/30 text-red-300 hover:bg-red-500/10" data-testid="reject-btn">
                  <X size={14} className="mr-1" /> Reject
                </Button>
                <Button onClick={() => act("pause_workflow")} variant="outline" className="bg-transparent border-white/10 text-slate-200 hover:bg-white/5" data-testid="pause-workflow-btn">
                  <Pause size={14} className="mr-1" /> Pause workflow
                </Button>
              </div>
            )}

            {o.status === "Snoozed" && (
              <div className="mt-4 border-t border-white/5 pt-4 flex items-center justify-between gap-3" data-testid="snoozed-banner">
                <div className="text-sm text-slate-300">
                  <div className="flex items-center gap-2"><BellRing size={14} className="text-[#F59E0B]" /> Snoozed until {new Date(o.snoozed_until).toLocaleString()}</div>
                  <div className="text-xs text-slate-500 mt-0.5">Demo simulation — will auto-wake when the scheduled time passes.</div>
                </div>
                <Button onClick={() => act("wake_snooze")} variant="outline" className="bg-transparent border-white/10 text-slate-200 hover:bg-white/5" data-testid="wake-now-btn">
                  Wake now
                </Button>
              </div>
            )}
            {o.status === "Sent" && (
              <div className="mt-4 border-t border-white/5 pt-4">
                <div className="text-sm text-slate-300">Message state: <StatusBadge status="Sent" /></div>
                <Button onClick={() => setShowBook(true)} className="mt-3 bg-[#7C5CFC] hover:bg-[#6a4de0]" data-testid="simulate-booking-btn">
                  <CalendarCheck size={15} className="mr-1" /> Simulate customer reply → Book appointment
                </Button>
              </div>
            )}
            {o.status === "Appointment Booked" && (
              <div className="mt-4 border-t border-white/5 pt-4 text-sm text-[#00E5A8] font-medium" data-testid="appointment-booked-banner">
                ✓ Appointment booked (simulated). Ledger, dashboard, and impact report updated.
              </div>
            )}
          </Card>

          <Card className="bg-[#111827] border-white/10 p-5" data-testid="audit-timeline-card">
            <div className="jobos-heading font-semibold mb-3">Audit timeline</div>
            <ul className="space-y-3 relative">
              {audit.map((a) => (
                <li key={a.id} className="flex gap-3">
                  <div className="mt-1 w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                  <div className="flex-1">
                    <div className="text-sm text-slate-200">{a.event} <span className="text-slate-500">· {a.actor}</span></div>
                    <div className="text-xs text-slate-500">{fmt(a.timestamp)}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{a.detail}</div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      {/* Booking confirmation */}
      <Dialog open={showBook} onOpenChange={setShowBook}>
        <DialogContent className="bg-slate-900 border-white/10 text-slate-100">
          <DialogHeader>
            <DialogTitle>Simulate booking?</DialogTitle>
            <DialogDescription className="text-slate-400">
              This will mark the opportunity as Appointment Booked and record ${o.expected_value.toLocaleString()} in the recovered ledger. All fictional.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowBook(false)}>Cancel</Button>
            <Button
              onClick={async () => { setShowBook(false); await act("book_appointment"); toast.success("Appointment booked (simulated)"); }}
              className="bg-[#00E5A8] hover:bg-[#00c896] text-slate-900 font-semibold"
              data-testid="confirm-book-btn"
            >
              Confirm booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="bg-slate-900 border-white/10 text-slate-100">
          <DialogHeader>
            <DialogTitle>Message sent (simulated)</DialogTitle>
            <DialogDescription className="text-slate-400">
              In the demo we mark the message as Sent. No real message left this environment.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowSuccess(false)} className="bg-[#7C5CFC] hover:bg-[#6a4de0]" data-testid="dialog-continue-btn">Continue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
