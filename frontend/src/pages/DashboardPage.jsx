import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import api from "@/api/client";
import { useSession } from "@/context/SessionContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatusBadge, { UrgencyPill } from "@/components/StatusBadge";
import { AlertTriangle, DollarSign, Calendar, Zap, Clock, ArrowUpRight, Activity, Shield } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

function KPI({ icon: Icon, label, value, sublabel, accent = "#7C5CFC", testid }) {
  return (
    <Card data-testid={testid} className="bg-[#111827] border-white/10 p-5 jobos-card-hover">
      <div className="flex items-center justify-between">
        <div className="p-2 rounded-lg" style={{ backgroundColor: `${accent}20` }}>
          <Icon size={16} style={{ color: accent }} />
        </div>
        <span className="text-[10px] uppercase tracking-widest text-slate-500">{sublabel}</span>
      </div>
      <div className="mt-3 text-2xl font-bold jobos-heading">{value}</div>
      <div className="text-xs text-slate-400 mt-1">{label}</div>
    </Card>
  );
}

export default function DashboardPage() {
  const { sessionId } = useSession();
  const [data, setData] = useState(null);
  const nav = useNavigate();

  useEffect(() => {
    if (!sessionId) return;
    api.get(`/demo/${sessionId}/dashboard`).then(({ data }) => setData(data));
  }, [sessionId]);

  if (!data) return <div className="text-slate-400" data-testid="dashboard-loading">Loading…</div>;

  const { kpis, needs_approval, workflow_health, agent_feed, trend, business } = data;
  const maya = needs_approval.find((o) => o.id === "opp-maya");

  return (
    <div className="space-y-6" data-testid="dashboard-page">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="jobos-heading text-3xl font-bold">Revenue Pulse</h1>
          <p className="text-slate-400 text-sm mt-1">
            {business.name} · {business.team_size} team members · {business.past_customers.toLocaleString()} past customers
          </p>
        </div>
        {maya && (
          <Button
            onClick={() => nav(`/app/opportunities/${maya.id}`)}
            data-testid="dashboard-review-maya-btn"
            className="bg-[#7C5CFC] hover:bg-[#6a4de0]"
          >
            Review Maya&apos;s Opportunity <ArrowUpRight size={15} className="ml-1" />
          </Button>
        )}
      </div>

      {/* Onboarding card */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-emerald-500/5 border-purple-500/20 p-5" data-testid="onboarding-card">
        <div className="flex flex-wrap items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-500/15">
            <Zap size={18} className="text-[#7C5CFC]" />
          </div>
          <div className="flex-1 min-w-[240px]">
            <div className="jobos-heading font-semibold">12 follow-ups need attention today</div>
            <div className="text-sm text-slate-400 mt-0.5">Start with Maya Thompson&apos;s missed-call opportunity, estimated at $425.</div>
          </div>
          <div className="flex gap-2">
            {maya && (
              <Button onClick={() => nav(`/app/opportunities/${maya.id}`)} className="bg-[#7C5CFC] hover:bg-[#6a4de0]" data-testid="onboarding-review-maya-btn">
                Review Maya&apos;s Opportunity
              </Button>
            )}
            <Button onClick={() => nav("/app/inbox")} variant="outline" className="bg-transparent border-white/10 text-slate-200 hover:bg-white/5" data-testid="onboarding-explore-btn">
              Explore Dashboard
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KPI testid="kpi-revenue-at-risk" icon={AlertTriangle} label="Revenue at Risk" value={`$${kpis.revenue_at_risk.toLocaleString()}`} sublabel={kpis.revenue_at_risk_label} accent="#F59E0B" />
        <KPI testid="kpi-recovered-revenue" icon={DollarSign} label="Recovered Revenue" value={`$${kpis.recovered_revenue.toLocaleString()}`} sublabel={kpis.recovered_revenue_label} accent="#00E5A8" />
        <KPI testid="kpi-appointments-booked" icon={Calendar} label="Appointments Booked" value={kpis.appointments_booked} sublabel="This month" accent="#7C5CFC" />
        <KPI testid="kpi-follow-ups-due" icon={Clock} label="Follow-ups Due Today" value={kpis.follow_ups_due} sublabel="Live" accent="#93C5FD" />
        <KPI testid="kpi-response-time" icon={Zap} label={`Response within 10 min`} value={`${kpis.response_10min}%`} sublabel={`Baseline ${kpis.baseline_10min}%`} accent="#00E5A8" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Trend chart */}
        <Card className="lg:col-span-2 bg-[#111827] border-white/10 p-5" data-testid="trend-chart-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="jobos-heading font-semibold">Opportunity trend</div>
              <div className="text-xs text-slate-500">Last 7 days · fictional demo</div>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1.5"><span className="jobos-dot" style={{ background: "#7C5CFC" }} /> Opportunities</span>
              <span className="flex items-center gap-1.5"><span className="jobos-dot" style={{ background: "#00E5A8" }} /> Recovered $</span>
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
                <XAxis dataKey="day" stroke="#6B7280" fontSize={11} />
                <YAxis stroke="#6B7280" fontSize={11} />
                <Tooltip contentStyle={{ background: "#111827", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#F3F4F6" }} />
                <Line type="monotone" dataKey="opportunities" stroke="#7C5CFC" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="recovered" stroke="#00E5A8" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Time saved */}
        <Card className="bg-[#111827] border-white/10 p-5 flex flex-col" data-testid="time-saved-card">
          <div className="text-xs uppercase tracking-widest text-slate-500">Modeled</div>
          <div className="jobos-heading text-3xl font-bold mt-2">{kpis.time_saved_hours}h</div>
          <div className="text-sm text-slate-400 mt-1">Estimated time saved this month</div>
          <div className="mt-4 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-400"><span>Response speed lift</span><span className="text-[#00E5A8]">+{kpis.response_10min - kpis.baseline_10min} pts</span></div>
            <div className="flex items-center justify-between text-slate-400"><span>Baseline</span><span>{kpis.baseline_10min}%</span></div>
            <div className="flex items-center justify-between text-slate-400"><span>With JobOS</span><span>{kpis.response_10min}%</span></div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Needs Approval */}
        <Card className="lg:col-span-2 bg-[#111827] border-white/10 p-5" data-testid="needs-approval-list">
          <div className="flex items-center justify-between mb-3">
            <div className="jobos-heading font-semibold flex items-center gap-2"><Shield size={15} className="text-[#7C5CFC]" /> Needs Approval</div>
            <Button onClick={() => nav("/app/approvals")} variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-white/5" data-testid="open-approval-center-btn">Open Approval Center</Button>
          </div>
          <div className="space-y-2">
            {needs_approval.map((o) => (
              <button
                key={o.id}
                onClick={() => nav(`/app/opportunities/${o.id}`)}
                data-testid={`needs-approval-${o.id}`}
                className="w-full text-left p-3 rounded-lg border border-white/5 hover:border-purple-500/30 hover:bg-white/5 transition-colors flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-full grid place-items-center text-xs font-semibold" style={{ backgroundColor: `${o.customer?.avatar_color || "#7C5CFC"}20`, color: o.customer?.avatar_color || "#7C5CFC" }}>
                  {(o.customer?.name || "?").split(" ").map((n) => n[0]).slice(0, 2).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{o.customer?.name}</div>
                  <div className="text-xs text-slate-400 truncate">{o.type} · {o.service_need}</div>
                </div>
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-semibold">${o.expected_value.toLocaleString()}</div>
                  <UrgencyPill urgency={o.urgency} />
                </div>
                <StatusBadge status={o.status} />
              </button>
            ))}
          </div>
        </Card>

        {/* Workflow health + activity */}
        <div className="space-y-4">
          <Card className="bg-[#111827] border-white/10 p-5" data-testid="workflow-health-card">
            <div className="jobos-heading font-semibold mb-3">Workflow health</div>
            <div className="space-y-2">
              {workflow_health.map((w) => (
                <div key={w.id} className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 border border-white/5">
                  <div>
                    <div className="text-sm font-medium">{w.name}</div>
                    <div className="text-xs text-slate-500">{w.opportunities_active} active</div>
                  </div>
                  <div className={`text-xs px-2 py-0.5 rounded-full ${w.paused ? "bg-slate-500/20 text-slate-300" : w.health === "Healthy" ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"}`}>
                    {w.paused ? "Paused" : w.health}
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card className="bg-[#111827] border-white/10 p-5" data-testid="agent-activity-feed">
            <div className="jobos-heading font-semibold mb-3 flex items-center gap-2"><Activity size={15} className="text-[#00E5A8]" /> Recent agent activity</div>
            <ul className="space-y-2 text-sm">
              {agent_feed.map((a) => (
                <li key={a.id} className="flex gap-2 text-slate-300">
                  <span className="jobos-dot mt-2" style={{ background: "#7C5CFC" }} />
                  <span>{a.message}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
