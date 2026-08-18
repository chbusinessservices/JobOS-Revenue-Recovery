import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/api/client";
import { useSession } from "@/context/SessionContext";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StatusBadge, { UrgencyPill } from "@/components/StatusBadge";
import { Search, ArrowUpDown } from "lucide-react";

const TABS = [
  { key: "all", label: "All" },
  { key: "new_leads", label: "New Leads" },
  { key: "missed_calls", label: "Missed Calls" },
  { key: "open_estimates", label: "Open Estimates" },
  { key: "repeat_customers", label: "Repeat Customers" },
];

function ageLabel(minutes) {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default function OpportunityInboxPage() {
  const { sessionId } = useSession();
  const [tab, setTab] = useState("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("urgency");
  const [items, setItems] = useState([]);
  const nav = useNavigate();

  useEffect(() => {
    if (!sessionId) return;
    api.get(`/demo/${sessionId}/opportunities`, { params: { category: tab, q, sort } })
      .then(({ data }) => setItems(data.opportunities));
  }, [sessionId, tab, q, sort]);

  return (
    <div className="space-y-5" data-testid="inbox-page">
      <div>
        <h1 className="jobos-heading text-3xl font-bold">Opportunity Inbox</h1>
        <p className="text-slate-400 text-sm mt-1">Ranked by urgency and expected value. Nothing is sent until you approve.</p>
      </div>

      <Card className="bg-[#111827] border-white/10 p-4 space-y-4">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-[#0D1424] border border-white/10">
            {TABS.map((t) => (
              <TabsTrigger key={t.key} value={t.key} data-testid={`tab-${t.key}`} className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-white text-slate-400">
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name, service, or type"
              data-testid="inbox-search"
              className="pl-9 bg-[#0D1424] border-white/10 text-slate-100 placeholder:text-slate-500"
            />
          </div>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-[200px] bg-[#0D1424] border-white/10 text-slate-200" data-testid="inbox-sort">
              <ArrowUpDown size={13} className="mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-white/10 text-slate-200">
              <SelectItem value="urgency">Sort: Urgency</SelectItem>
              <SelectItem value="value">Sort: Expected Value</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm" data-testid="inbox-table">
            <thead>
              <tr className="text-left text-slate-500 text-xs uppercase tracking-wider border-b border-white/10">
                <th className="py-2 pr-3">Customer</th>
                <th className="py-2 pr-3">Type · Need</th>
                <th className="py-2 pr-3">Expected</th>
                <th className="py-2 pr-3">Age</th>
                <th className="py-2 pr-3">Urgency</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Recommended action</th>
                <th className="py-2 pr-3"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((o) => (
                <tr key={o.id} data-testid={`inbox-row-${o.id}`} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full grid place-items-center text-xs font-semibold" style={{ backgroundColor: `${o.customer?.avatar_color}20`, color: o.customer?.avatar_color }}>
                        {(o.customer?.name || "?").split(" ").map((n) => n[0]).slice(0, 2).join("")}
                      </div>
                      <div>
                        <div className="font-medium">{o.customer?.name}</div>
                        <div className="text-xs text-slate-500">{o.customer?.address}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-3">
                    <div>{o.type}</div>
                    <div className="text-xs text-slate-500">{o.service_need}</div>
                  </td>
                  <td className="py-3 pr-3 font-semibold">${o.expected_value.toLocaleString()}</td>
                  <td className="py-3 pr-3 text-slate-400">{ageLabel(o.age_minutes)}</td>
                  <td className="py-3 pr-3"><UrgencyPill urgency={o.urgency} /></td>
                  <td className="py-3 pr-3"><StatusBadge status={o.status} /></td>
                  <td className="py-3 pr-3 text-slate-400 max-w-[260px] truncate">{o.recommended_action}</td>
                  <td className="py-3 pr-3 text-right">
                    <Button size="sm" onClick={() => nav(`/app/opportunities/${o.id}`)} data-testid={`review-${o.id}`} className="bg-[#7C5CFC] hover:bg-[#6a4de0]">Review</Button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={8} className="py-8 text-center text-slate-500">No opportunities in this view.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-2" data-testid="inbox-cards">
          {items.map((o) => (
            <button
              key={o.id}
              data-testid={`inbox-card-${o.id}`}
              onClick={() => nav(`/app/opportunities/${o.id}`)}
              className="w-full text-left jobos-surface-2 p-4"
            >
              <div className="flex items-center justify-between">
                <div className="font-medium">{o.customer?.name}</div>
                <StatusBadge status={o.status} />
              </div>
              <div className="text-xs text-slate-500 mt-0.5">{o.type} · {o.service_need}</div>
              <div className="flex items-center justify-between mt-3 text-sm">
                <span className="font-semibold">${o.expected_value.toLocaleString()}</span>
                <UrgencyPill urgency={o.urgency} />
              </div>
              <div className="text-xs text-slate-400 mt-2">{o.recommended_action}</div>
            </button>
          ))}
          {items.length === 0 && <div className="text-slate-500 text-center py-6 text-sm">No opportunities in this view.</div>}
        </div>
      </Card>
    </div>
  );
}
