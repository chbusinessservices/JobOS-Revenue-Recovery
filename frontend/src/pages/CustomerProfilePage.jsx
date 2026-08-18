import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/api/client";
import { useSession } from "@/context/SessionContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";
import { ChevronLeft } from "lucide-react";

function fmt(ts) { return ts ? new Date(ts).toLocaleString() : "—"; }

export default function CustomerProfilePage() {
  const { id } = useParams();
  const { sessionId } = useSession();
  const nav = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!sessionId || !id) return;
    api.get(`/demo/${sessionId}/customers/${id}`).then(({ data }) => setData(data));
  }, [sessionId, id]);

  const timelineItems = useMemo(
    () => {
      if (!data) return [];
      return [...(data.ledger || []), ...(data.audit || [])]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 12);
    },
    [data]
  );

  const opps = data?.opportunities || [];
  const audit = data?.audit || [];
  const ledger = data?.ledger || [];

  if (!data) return <div className="text-slate-400">Loading customer…</div>;
  const c = data.customer;
  const opportunities = opps;

  return (
    <div className="space-y-5" data-testid="customer-profile-page">
      <button onClick={() => nav(-1)} className="text-slate-400 text-sm hover:text-white flex items-center gap-1">
        <ChevronLeft size={14} /> Back
      </button>

      <Card className="bg-[#111827] border-white/10 p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="w-16 h-16 rounded-full grid place-items-center text-xl font-bold" style={{ backgroundColor: `${c.avatar_color}20`, color: c.avatar_color }}>
            {c.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="jobos-heading text-2xl font-bold">{c.name}</h1>
            <div className="text-sm text-slate-400">{c.email} · {c.phone}</div>
            <div className="text-sm text-slate-500">{c.address}</div>
          </div>
          <div className="grid grid-cols-3 gap-6 text-right">
            <div><div className="text-xs text-slate-500 uppercase">LTV</div><div className="jobos-heading text-lg font-bold">${c.lifetime_value.toLocaleString()}</div></div>
            <div><div className="text-xs text-slate-500 uppercase">Channel</div><div className="text-lg font-semibold">{c.preferred_channel}</div></div>
            <div><div className="text-xs text-slate-500 uppercase">Last service</div><div className="text-sm">{fmt(c.last_service_date).split(",")[0]}</div></div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-[#111827] border-white/10 p-5">
          <div className="jobos-heading font-semibold mb-3">Active opportunities</div>
          <ul className="space-y-2">
            {opportunities.map((o) => (
              <li key={o.id}>
                <button onClick={() => nav(`/app/opportunities/${o.id}`)} className="w-full text-left p-3 rounded-lg border border-white/5 hover:bg-white/5 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{o.type}</div>
                    <div className="text-xs text-slate-500">{o.service_need}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">${o.expected_value.toLocaleString()}</div>
                    <StatusBadge status={o.status} />
                  </div>
                </button>
              </li>
            ))}
            {opportunities.length === 0 && <div className="text-slate-500 text-sm">No opportunities.</div>}
          </ul>
        </Card>

        <Card className="bg-[#111827] border-white/10 p-5">
          <div className="jobos-heading font-semibold mb-3">Ledger &amp; timeline</div>
          <ul className="space-y-3">
            {timelineItems.map((e) => (
              <li key={e.id} className="flex gap-2 items-start text-sm border-b border-white/5 pb-2 last:border-none">
                <span className="jobos-dot mt-2" style={{ background: e.amount ? "#00E5A8" : "#7C5CFC" }} />
                <div className="flex-1">
                  <div>{e.event}</div>
                  <div className="text-xs text-slate-500">{fmt(e.timestamp)}</div>
                </div>
                {e.amount != null && <div className="text-sm font-semibold">${e.amount.toLocaleString()}</div>}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
