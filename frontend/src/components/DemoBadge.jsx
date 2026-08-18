import { Info } from "lucide-react";
import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger,
} from "@/components/ui/dialog";

export default function DemoBadge() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          data-testid="demo-mode-badge"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-200 text-xs font-medium hover:bg-purple-500/15 transition-colors"
        >
          <span className="jobos-dot" style={{ backgroundColor: "#7C5CFC" }} />
          Demo Mode — Fictional Data
          <Info size={13} />
        </button>
      </DialogTrigger>
      <DialogContent data-testid="demo-mode-modal" className="bg-slate-900 border border-white/10 text-slate-100 max-w-lg">
        <DialogHeader>
          <DialogTitle className="jobos-heading">This is a fictional demo</DialogTitle>
          <DialogDescription className="text-slate-400">
            All customers, communications, bookings, financial values, and outcomes shown in
            JobOS Revenue Recovery are fictional and provided only for demonstration.
          </DialogDescription>
        </DialogHeader>
        <ul className="space-y-2 text-sm text-slate-300 mt-2">
          <li>• No real messages are sent to any phone number or email.</li>
          <li>• Metrics are labeled <span className="text-slate-100">Estimated</span>, <span className="text-slate-100">Modeled</span>, or <span className="text-slate-100">Recorded in demo</span>.</li>
          <li>• AI drafts may only classify, prioritize, recommend, and explain — never invent customer facts.</li>
          <li>• Every action is captured in an immutable-looking audit timeline.</li>
        </ul>
      </DialogContent>
    </Dialog>
  );
}
