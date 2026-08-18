import { useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useSession } from "@/context/SessionContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { RefreshCcw, Info } from "lucide-react";

export default function SettingsPage() {
  const { sessionId, reset, newSession } = useSession();
  const [resetting, setResetting] = useState(false);
  const nav = useNavigate();

  async function doReset() {
    setResetting(true);
    try {
      await reset();
      toast.success("Demo data restored", { description: "Your session was reset to the canonical seed state." });
      setTimeout(() => window.location.reload(), 400);
    } finally {
      setResetting(false);
    }
  }

  async function freshSession() {
    await newSession();
    toast.success("New demo session created");
    nav("/app/dashboard");
  }

  return (
    <div className="space-y-5 max-w-3xl" data-testid="settings-page">
      <div>
        <h1 className="jobos-heading text-3xl font-bold">Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Manage your demo session.</p>
      </div>

      <Card className="bg-[#111827] border-white/10 p-6">
        <div className="jobos-heading font-semibold">Demo session</div>
        <p className="text-sm text-slate-400 mt-1">Session ID</p>
        <div className="mt-2 font-mono text-xs px-3 py-2 rounded-md bg-[#0D1424] border border-white/10 text-slate-300 break-all" data-testid="settings-session-id">
          {sessionId}
        </div>

        <div className="border-t border-white/5 my-6" />

        <div className="jobos-heading font-semibold">Reset demo data</div>
        <p className="text-sm text-slate-400 mt-1">
          Restore all opportunities, drafts, ledger entries, workflows, and metrics to the canonical Northstar seed.
          This affects only your session.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="mt-3 bg-transparent border-amber-500/30 text-amber-200 hover:bg-amber-500/10" data-testid="reset-demo-btn-settings">
              <RefreshCcw size={14} className="mr-1" /> Reset demo data
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-slate-900 border-white/10 text-slate-100">
            <AlertDialogHeader>
              <AlertDialogTitle>Reset demo data?</AlertDialogTitle>
              <AlertDialogDescription className="text-slate-400">
                This deletes all visitor-created changes in your session and restores the canonical Northstar Heating &amp; Air seed data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-transparent border-white/10 text-slate-200">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={doReset} disabled={resetting} className="bg-[#7C5CFC] hover:bg-[#6a4de0]" data-testid="confirm-reset-btn">
                {resetting ? "Resetting…" : "Yes, reset"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="border-t border-white/5 my-6" />

        <div className="jobos-heading font-semibold">Start a fresh session</div>
        <p className="text-sm text-slate-400 mt-1">Create a brand-new anonymous session ID and load seed data.</p>
        <Button onClick={freshSession} variant="outline" className="mt-3 bg-transparent border-white/10 text-slate-200 hover:bg-white/5" data-testid="new-session-btn">
          Create new session
        </Button>
      </Card>

      <Card className="bg-[#111827] border-white/10 p-6">
        <div className="flex items-start gap-3">
          <Info size={16} className="text-[#7C5CFC] mt-1" />
          <div>
            <div className="jobos-heading font-semibold">About this demo</div>
            <p className="text-sm text-slate-400 mt-1">
              JobOS Revenue Recovery is a public demo. All customer names, contact information, messages, bookings,
              revenue values, and outcomes are fictional. No real communications are sent.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
