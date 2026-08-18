import { useEffect, useState } from "react";
import api from "@/api/client";
import { useSession } from "@/context/SessionContext";
import { Card } from "@/components/ui/card";
import { TrendingUp, Info } from "lucide-react";

function fmt(n) { return typeof n === "number" ? n.toLocaleString() : n; }

export default function OwnerInsights() {
  const { sessionId } = useSession();
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!sessionId) return;
    api.get(`/demo/${sessionId}/insights`).then(({ data }) => setData(data));
  }, [sessionId]);

  if (!data) return null;

  return (
    <Card className="bg-[#111827] border-white/10 p-5" data-testid="owner-insights">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="jobos-heading font-semibold flex items-center gap-2">
            <TrendingUp size={16} className="text-[#7C5CFC]" /> What&apos;s Working
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Narrow comparison across your three workflows using demo-session data.
          </div>
        </div>
        <span className="text-[10px] uppercase tracking-widest text-slate-500 border border-white/10 rounded-full px-2 py-1">
          Demo scenario
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm" data-testid="insights-table">
          <thead>
            <tr className="text-left text-slate-500 text-xs uppercase tracking-wider border-b border-white/10">
              <th className="py-2 pr-3">Workflow</th>
              <th className="py-2 pr-3">Opportunities surfaced</th>
              <th className="py-2 pr-3">Approved follow-ups</th>
              <th className="py-2 pr-3">Simulated bookings</th>
              <th className="py-2 pr-3">Estimated pipeline advanced</th>
              <th className="py-2 pr-3">Recorded in demo</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r) => (
              <tr key={r.workflow_id} className="border-b border-white/5" data-testid={`insight-${r.workflow_id}`}>
                <td className="py-3 pr-3">
                  <div className="font-medium">{r.workflow_name}</div>
                  {r.paused && <span className="text-[10px] uppercase tracking-widest text-slate-500">paused</span>}
                </td>
                <td className="py-3 pr-3">{fmt(r.opportunities_surfaced)}</td>
                <td className="py-3 pr-3">{fmt(r.approved_follow_ups)}</td>
                <td className="py-3 pr-3">{fmt(r.simulated_bookings)}</td>
                <td className="py-3 pr-3">
                  <span className="text-[#F59E0B]">${fmt(r.pipeline_advanced)}</span>
                  <div className="text-[10px] uppercase tracking-widest text-slate-500">{r.pipeline_label}</div>
                </td>
                <td className="py-3 pr-3">
                  <span className="text-[#00E5A8]">${fmt(r.recorded_results)}</span>
                  <div className="text-[10px] uppercase tracking-widest text-slate-500">{r.recorded_label}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.recommendation && (
        <div className="mt-4 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 text-sm text-slate-200 flex gap-2 items-start" data-testid="insights-recommendation">
          <Info size={14} className="text-[#7C5CFC] mt-0.5 shrink-0" />
          <div>
            <div className="text-xs uppercase tracking-widest text-purple-300 mb-1">Careful recommendation</div>
            {data.recommendation}
          </div>
        </div>
      )}
      <div className="mt-3 text-[11px] text-slate-500" data-testid="insights-disclaimer">
        {data.disclaimer}
      </div>
    </Card>
  );
}
