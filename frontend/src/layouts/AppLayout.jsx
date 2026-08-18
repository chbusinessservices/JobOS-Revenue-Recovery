import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Inbox, ShieldCheck, Workflow, LineChart, Settings, Bell, RefreshCcw, LogOut,
} from "lucide-react";
import { useSession } from "@/context/SessionContext";
import DemoBadge from "@/components/DemoBadge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";

const NAV = [
  { to: "/app/dashboard", label: "Revenue Pulse", icon: LayoutDashboard, id: "dashboard" },
  { to: "/app/inbox", label: "Opportunity Inbox", icon: Inbox, id: "inbox" },
  { to: "/app/approvals", label: "Approval Center", icon: ShieldCheck, id: "approvals" },
  { to: "/app/workflows", label: "Workflow Builder", icon: Workflow, id: "workflows" },
  { to: "/app/impact", label: "Impact Report", icon: LineChart, id: "impact" },
  { to: "/app/settings", label: "Settings", icon: Settings, id: "settings" },
];

export default function AppLayout() {
  const { sessionId, ready, reset } = useSession();
  const navigate = useNavigate();
  const [resetting, setResetting] = useState(false);

  async function handleReset() {
    setResetting(true);
    try {
      await reset();
      toast.success("Demo data restored", { description: "Canonical seed state has been loaded." });
      window.location.reload();
    } catch (e) {
      toast.error("Reset failed", { description: String(e) });
    } finally {
      setResetting(false);
    }
  }

  if (!ready || !sessionId) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        <div className="jobos-surface p-6" data-testid="session-loading">Preparing your demo workspace…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#0A0F1C] text-slate-100">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-white/10 bg-[#0D1424] px-4 py-6 gap-2 sticky top-0 h-screen" data-testid="sidebar">
        <div className="px-2 mb-4">
          <div className="text-xs uppercase tracking-widest text-slate-500">JobOS</div>
          <div className="jobos-heading text-lg font-bold">Revenue Recovery</div>
        </div>
        <nav className="flex-1 space-y-1">
          {NAV.map(({ to, label, icon: Icon, id }) => (
            <NavLink
              key={to}
              to={to}
              data-testid={`nav-${id}`}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-purple-500/15 text-white border border-purple-500/30"
                    : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
                }`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-white/10 pt-3 space-y-2">
          <div className="px-2 text-xs text-slate-500">Session</div>
          <div className="px-2 text-xs font-mono text-slate-400 truncate" data-testid="session-id-display">{sessionId}</div>
          <Button
            data-testid="reset-demo-btn-sidebar"
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={resetting}
            className="w-full bg-transparent border-white/10 text-slate-200 hover:bg-white/5"
          >
            <RefreshCcw size={13} className="mr-2" />
            {resetting ? "Resetting…" : "Reset Demo Data"}
          </Button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-[#0A0F1C]/95 backdrop-blur border-b border-white/10 px-6 py-3 flex items-center justify-between" data-testid="app-header">
          <div className="flex items-center gap-3">
            <span className="md:hidden jobos-heading font-bold">JobOS</span>
            <div className="hidden md:flex flex-col">
              <div className="text-xs text-slate-500">Workspace</div>
              <div className="text-sm font-semibold">Northstar Heating &amp; Air · Newark, NJ</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <DemoBadge />
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-300 hover:text-white hover:bg-white/5"
              data-testid="notifications-btn"
            >
              <Bell size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { localStorage.removeItem("jobos.session_id"); navigate("/"); }}
              className="text-slate-400 hover:text-white hover:bg-white/5"
              data-testid="exit-demo-btn"
            >
              <LogOut size={15} className="mr-1" /> Exit
            </Button>
          </div>
        </header>

        {/* Mobile nav */}
        <nav className="md:hidden border-b border-white/10 px-3 py-2 flex gap-1 overflow-x-auto bg-[#0D1424]" data-testid="mobile-nav">
          {NAV.map(({ to, label, id }) => (
            <NavLink
              key={to}
              to={to}
              data-testid={`mobile-nav-${id}`}
              className={({ isActive }) =>
                `whitespace-nowrap px-3 py-1.5 text-xs rounded-full border transition-colors ${
                  isActive
                    ? "bg-purple-500/15 text-white border-purple-500/30"
                    : "text-slate-400 border-white/10 hover:text-white"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <main className="flex-1 p-4 md:p-8 jobos-enter" data-testid="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
