import { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "@/api/client";
import { useSession } from "@/context/SessionContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Download, Info, LineChart as LineIcon } from "lucide-react";

function Metric({ label, value, kind, testid }) {
  const color = kind === "recorded" ? "#00E5A8" : kind === "modeled" ? "#7C5CFC" : "#F59E0B";
  return (
    <Card className="bg-[#111827] border-white/10 p-5" data-testid={testid}>
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-widest" style={{ color }}>{kind}</div>
        <LineIcon size={14} style={{ color }} />
      </div>
      <div className="jobos-heading text-2xl font-bold mt-3">{value}</div>
      <div className="text-sm text-slate-400 mt-1">{label}</div>
    </Card>
  );
}

export default function ImpactReportPage() {
  const { sessionId } = useSession();
  const [period, setPeriod] = useState("last_30_days");
  const [data, setData] = useState(null);
  const [exported, setExported] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    api.get(`/demo/${sessionId}/impact`, { params: { period } }).then(({ data }) => setData(data));
  }, [sessionId, period]);

  function handleExport() {
    setExported(true);
    toast.success("Impact report exported (simulated)", { description: "In a real deployment this would download a PDF." });
    setTimeout(() => setExported(false), 2400);
  }

  if (!data) return <div className="text-slate-400">Loading impact…</div>;

  return (
    <div className="space-y-5" data-testid="impact-report-page">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="jobos-heading text-3xl font-bold">Impact Report</h1>
          <p className="text-slate-400 text-sm mt-1">Estimated, Modeled, and Recorded metrics — separated for clarity.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px] bg-[#0D1424] border-white/10 text-slate-200" data-testid="impact-period">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-white/10 text-slate-200">
              <SelectItem value="last_7_days">Last 7 days</SelectItem>
              <SelectItem value="last_30_days">Last 30 days</SelectItem>
              <SelectItem value="quarter">This quarter</SelectItem>
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="bg-transparent border-white/10 text-slate-200" data-testid="methodology-btn">
                <Info size={14} className="mr-1" /> Methodology
              </Button>
            </PopoverTrigger>
            <PopoverContent className="bg-slate-900 border-white/10 text-slate-200 max-w-md text-sm" data-testid="methodology-panel">
              {data.methodology}
            </PopoverContent>
          </Popover>
          <Button onClick={handleExport} className="bg-[#7C5CFC] hover:bg-[#6a4de0]" data-testid="export-report-btn">
            <Download size={14} className="mr-1" /> {exported ? "Exported ✓" : "Export report"}
          </Button>
        </div>
      </div>

      <div>
        <div className="text-xs uppercase tracking-widest text-slate-500 mb-2">Estimated</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Metric testid="impact-est-pipeline" kind="estimated" label="Revenue pipeline" value={`$${data.estimated.revenue_pipeline.toLocaleString()}`} />
          <Metric testid="impact-est-leads" kind="estimated" label="Leads responded to" value={data.estimated.leads_responded} />
          <Metric testid="impact-est-followups" kind="estimated" label="Follow-ups completed" value={data.estimated.follow_ups_completed} />
        </div>
      </div>

      <div>
        <div className="text-xs uppercase tracking-widest text-slate-500 mb-2">Modeled</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Metric testid="impact-mod-hours" kind="modeled" label="Manual hours saved" value={`${data.modeled.hours_saved}h`} />
          <Metric testid="impact-mod-react" kind="modeled" label="Customer reactivations" value={data.modeled.reactivations} />
        </div>
      </div>

      <div>
        <div className="text-xs uppercase tracking-widest text-slate-500 mb-2">Recorded in demo</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Metric testid="impact-rec-revenue" kind="recorded" label="Recovered revenue" value={`$${data.recorded.recovered_revenue.toLocaleString()}`} />
          <Metric testid="impact-rec-appointments" kind="recorded" label="Appointments booked" value={data.recorded.appointments_booked} />
        </div>
      </div>

      <Card className="bg-[#111827] border-white/10 p-5" data-testid="impact-methodology-card">
        <div className="jobos-heading font-semibold mb-2">Methodology</div>
        <p className="text-sm text-slate-400">{data.methodology}</p>
      </Card>
    </div>
  );
}
