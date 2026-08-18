import { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "@/api/client";
import { useSession } from "@/context/SessionContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Users, Send, Sparkles } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";

export default function BatchApprovalCard({ onDone }) {
  const { sessionId } = useSession();
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function load() {
    if (!sessionId) return;
    const { data } = await api.get(`/demo/${sessionId}/batch/repeat-revenue`);
    setData(data);
  }
  useEffect(() => { load(); }, [sessionId]);

  async function confirmBatch() {
    setConfirming(true);
    try {
      const { data } = await api.post(`/demo/${sessionId}/batch/repeat-revenue/approve`);
      toast.success(`Approved ${data.approved_count} demo drafts`, {
        description: "Repeat Revenue seasonal tune-up batch — demo simulation only.",
      });
      setOpen(false);
      await load();
      onDone && onDone();
    } finally {
      setConfirming(false);
    }
  }

  if (!data) return null;
  const { workflow, campaign_name, criteria, eligible, excluded, recipient_count, estimated_value, preview } = data;

  return (
    <>
      <Card className="bg-[#111827] border-purple-500/20 p-5" data-testid="batch-approval-card">
        <div className="flex flex-wrap items-start gap-4">
          <div className="p-3 rounded-xl bg-purple-500/15">
            <Users size={18} className="text-[#7C5CFC]" />
          </div>
          <div className="flex-1 min-w-[240px]">
            <div className="jobos-heading font-semibold">{campaign_name}</div>
            <div className="text-xs text-slate-500 mt-0.5">
              Workflow: {workflow?.name || "Repeat Revenue"} · Batch approval limited to seasonal tune-up and annual maintenance only.
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-widest text-slate-500">Estimated pipeline</div>
            <div className="jobos-heading text-xl font-bold">${estimated_value.toLocaleString()}</div>
            <div className="text-xs text-slate-500">{recipient_count} eligible recipients</div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-slate-500 mb-2">Campaign criteria</div>
            <ul className="text-xs text-slate-300 space-y-1">
              {criteria.map((c, i) => <li key={i}>· {c}</li>)}
            </ul>
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-slate-500 mb-2">Excluded</div>
            <ul className="text-xs text-slate-400 space-y-1">
              <li>· Missed calls</li>
              <li>· New website / phone leads</li>
              <li>· High-value estimates</li>
              <li>· Non–seasonal tune-up Repeat Revenue records ({excluded.length})</li>
            </ul>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 justify-end">
          <Button
            onClick={() => setOpen(true)}
            disabled={recipient_count === 0}
            className="bg-[#7C5CFC] hover:bg-[#6a4de0]"
            data-testid="open-batch-review-btn"
          >
            <Send size={14} className="mr-1" /> Review batch ({recipient_count})
          </Button>
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-slate-900 border-white/10 text-slate-100 max-w-2xl" data-testid="batch-review-dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles size={16} className="text-[#7C5CFC]" /> {campaign_name}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              You are about to approve {recipient_count} demo drafts. No real messages will be sent.
            </DialogDescription>
          </DialogHeader>

          {preview && (
            <div className="rounded-lg bg-[#0D1424] border border-white/10 p-4" data-testid="batch-preview">
              <div className="text-xs text-slate-500 mb-1">Sample {preview.draft_channel} draft</div>
              {preview.draft_subject && <div className="text-xs text-slate-400 mb-2">Subject: {preview.draft_subject}</div>}
              <div className="text-sm text-slate-200 whitespace-pre-line">{preview.draft_message}</div>
              <div className="text-[11px] text-slate-500 mt-2">
                Personalized token replacement is applied per recipient at send-time (demo).
              </div>
            </div>
          )}

          <div className="border border-white/10 rounded-lg overflow-hidden" data-testid="batch-recipients">
            <div className="grid grid-cols-3 text-xs uppercase tracking-wider text-slate-500 bg-white/5 px-3 py-2">
              <div>Recipient</div><div>Service</div><div className="text-right">Expected</div>
            </div>
            <div className="max-h-56 overflow-y-auto">
              {eligible.map((o) => (
                <div key={o.id} className="grid grid-cols-3 items-center text-sm px-3 py-2 border-t border-white/5" data-testid={`batch-row-${o.id}`}>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full grid place-items-center text-[10px] font-semibold" style={{ backgroundColor: `${o.customer?.avatar_color}20`, color: o.customer?.avatar_color }}>
                      {(o.customer?.name || "?").split(" ").map((n) => n[0]).slice(0, 2).join("")}
                    </div>
                    <span>{o.customer?.name}</span>
                  </div>
                  <div className="text-slate-400 text-xs">{o.service_need}</div>
                  <div className="text-right font-semibold">${o.expected_value.toLocaleString()}</div>
                </div>
              ))}
              {eligible.length === 0 && <div className="text-slate-500 text-sm text-center p-4">No eligible recipients right now.</div>}
            </div>
          </div>

          <div className="text-xs text-slate-500">
            All values are Estimated pipeline. Recorded in demo results appear only after simulated bookings.
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              onClick={confirmBatch}
              disabled={confirming || recipient_count === 0}
              className="bg-[#7C5CFC] hover:bg-[#6a4de0]"
              data-testid="confirm-batch-approve-btn"
            >
              {confirming ? "Approving…" : `Approve ${recipient_count} Demo Drafts`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
