import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/api/client";
import { useSession } from "@/context/SessionContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatusBadge, { UrgencyPill } from "@/components/StatusBadge";
import { Shield } from "lucide-react";
import BatchApprovalCard from "@/components/BatchApprovalCard";

export default function ApprovalCenterPage() {
  const { sessionId } = useSession();
  const [queue, setQueue] = useState([]);
  const nav = useNavigate();

  function loadQueue() {
    if (!sessionId) return;
    api.get(`/demo/${sessionId}/approvals`).then(({ data }) => setQueue(data.queue));
  }
  useEffect(() => { loadQueue(); }, [sessionId]);

  return (
    <div className="space-y-5" data-testid="approval-center-page">
      <div>
        <h1 className="jobos-heading text-3xl font-bold flex items-center gap-2"><Shield size={22} className="text-[#7C5CFC]" /> Approval Center</h1>
        <p className="text-slate-400 text-sm mt-1">High-trust review workspace. Nothing is sent until you approve.</p>
      </div>

      <BatchApprovalCard onDone={loadQueue} />

      <div className="grid grid-cols-1 gap-3">
        {queue.map((o) => (
          <Card key={o.id} className="bg-[#111827] border-white/10 p-5" data-testid={`approval-item-${o.id}`}>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-1">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full grid place-items-center text-sm font-semibold" style={{ backgroundColor: `${o.customer?.avatar_color}20`, color: o.customer?.avatar_color }}>
                    {(o.customer?.name || "?").split(" ").map((n) => n[0]).slice(0, 2).join("")}
                  </div>
                  <div>
                    <div className="font-semibold">{o.customer?.name}</div>
                    <div className="text-xs text-slate-500">{o.type}</div>
                  </div>
                </div>
                <div className="mt-3 space-y-1 text-xs text-slate-400">
                  <div>Workflow: <span className="text-slate-200">{o.workflow?.name}</span></div>
                  <div>Approval rule: <span className="text-slate-200">{o.workflow?.approval_mode}</span></div>
                  <div>Expected: <span className="text-slate-200">${o.expected_value.toLocaleString()}</span></div>
                  <div><UrgencyPill urgency={o.urgency} /></div>
                </div>
              </div>
              <div className="lg:col-span-3 p-4 rounded-lg bg-[#0D1424] border border-white/10">
                <div className="text-xs text-slate-500 mb-1">Proposed {o.draft_channel} draft</div>
                {o.draft_subject && <div className="text-xs text-slate-400 mb-2">Subject: {o.draft_subject}</div>}
                <div className="text-sm text-slate-100 whitespace-pre-line">{o.draft_message}</div>
                <div className="mt-3 text-xs text-slate-500">Reasoning: <span className="text-slate-300">{o.rationale}</span></div>
              </div>
              <div className="lg:col-span-1 flex flex-col justify-between gap-2">
                <StatusBadge status={o.status} />
                <div className="flex flex-col gap-2 mt-auto">
                  <Button onClick={() => nav(`/app/opportunities/${o.id}`)} className="bg-[#7C5CFC] hover:bg-[#6a4de0]" data-testid={`approval-open-${o.id}`}>
                    Open review
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
        {queue.length === 0 && (
          <Card className="bg-[#111827] border-white/10 p-10 text-center text-slate-400" data-testid="approval-empty">
            The approval queue is clear. Great job.
          </Card>
        )}
      </div>
    </div>
  );
}
