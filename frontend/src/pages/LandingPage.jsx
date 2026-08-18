import { useNavigate } from "react-router-dom";
import { ArrowRight, ShieldCheck, Zap, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/context/SessionContext";

export default function LandingPage() {
  const navigate = useNavigate();
  const { ready, newSession } = useSession();

  async function enter() {
    await newSession();
    navigate("/app/dashboard");
  }

  return (
    <div className="min-h-screen jobos-landing-bg text-slate-100 flex items-center justify-start px-6 md:px-16">
      <div className="max-w-2xl jobos-enter">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-200 text-xs font-medium mb-6" data-testid="landing-demo-tag">
          <span className="jobos-dot" style={{ backgroundColor: "#7C5CFC" }} />
          Demo Mode — Fictional Data
        </div>
        <h1 className="jobos-heading text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05]">
          Every customer<br />
          <span className="jobos-gradient-text">gets a next step.</span>
        </h1>
        <p className="mt-5 text-slate-400 text-lg max-w-xl">
          JobOS is the approval-controlled revenue recovery operating system for local service
          businesses. Missed calls, stale estimates, and inactive customers get a timely,
          accountable follow-up — with your approval.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button
            onClick={enter}
            disabled={!ready}
            data-testid="enter-demo-workspace-btn"
            className="bg-[#7C5CFC] hover:bg-[#6a4de0] text-white font-medium px-6 py-6 rounded-xl text-base transition-colors"
          >
            {ready ? "Enter Demo Workspace" : "Preparing demo…"} <ArrowRight size={17} className="ml-2" />
          </Button>
          <span className="text-slate-500 text-sm">No signup. No real messages sent.</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-12 max-w-2xl">
          {[
            { icon: Zap, title: "Fast triage", body: "Missed call from Maya Thompson worth $425 — ranked and ready." },
            { icon: Sparkles, title: "AI-drafted", body: "Short, respectful drafts you can approve, edit, or reject." },
            { icon: ShieldCheck, title: "Owner in control", body: "Nothing goes out until you approve it. Everything is audited." },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="jobos-surface p-5" data-testid={`landing-feature-${title.toLowerCase().replace(/\s+/g, "-")}`}>
              <Icon size={18} className="text-[#00E5A8]" />
              <div className="mt-3 font-semibold">{title}</div>
              <p className="mt-1 text-sm text-slate-400">{body}</p>
            </div>
          ))}
        </div>

        <p className="mt-10 text-xs text-slate-500 max-w-xl">
          All customers, communications, bookings, financial values, and outcomes are fictional
          and provided only for demonstration.
        </p>
      </div>
    </div>
  );
}
