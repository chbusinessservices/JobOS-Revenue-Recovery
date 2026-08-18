import { useState } from "react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clock } from "lucide-react";

/**
 * Compute an ISO snoozedUntil for a preset key, from "now" in the user's local tz.
 * This is a fictional demo simulation of time passage — no real background jobs.
 */
function computePreset(key) {
  const now = new Date();
  if (key === "1h") return { until: new Date(now.getTime() + 60 * 60 * 1000), label: "In 1 hour" };
  if (key === "tomorrow_9am") {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
    return { until: d, label: "Tomorrow at 9:00 AM" };
  }
  if (key === "next_business") {
    const d = new Date(now);
    do { d.setDate(d.getDate() + 1); } while (d.getDay() === 0 || d.getDay() === 6);
    d.setHours(9, 0, 0, 0);
    return { until: d, label: "Next business day" };
  }
  if (key === "next_week") {
    const d = new Date(now);
    d.setDate(d.getDate() + 7);
    d.setHours(9, 0, 0, 0);
    return { until: d, label: "Next week" };
  }
  return null;
}

export default function SnoozeMenu({ onSnooze, disabled, buttonTestId = "snooze-btn" }) {
  const [open, setOpen] = useState(false);
  const [customValue, setCustomValue] = useState("");

  async function pickPreset(key) {
    const p = computePreset(key);
    if (!p) return;
    setOpen(false);
    await onSnooze({ preset: key, preset_label: p.label, snoozed_until: p.until.toISOString() });
    toast.success(`Snoozed (demo)`, { description: `Wakes ${p.label} — no real messages sent.` });
  }

  async function pickCustom() {
    if (!customValue) {
      toast.error("Pick a date and time first");
      return;
    }
    const d = new Date(customValue);
    if (isNaN(d.getTime())) {
      toast.error("Invalid date/time");
      return;
    }
    setOpen(false);
    await onSnooze({ preset: "custom", preset_label: `Custom (${d.toLocaleString()})`, snoozed_until: d.toISOString() });
    toast.success("Snoozed (demo)", { description: `Wakes ${d.toLocaleString()} — no real messages sent.` });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          disabled={disabled}
          variant="outline"
          data-testid={buttonTestId}
          className="bg-transparent border-white/10 text-slate-200 hover:bg-white/5"
        >
          <Clock size={14} className="mr-1" /> Snooze
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="bg-slate-900 border-white/10 text-slate-100 w-72 p-2"
        data-testid="snooze-menu"
      >
        <div className="text-xs uppercase tracking-widest text-slate-500 px-2 py-1">Snooze until</div>
        {[
          { key: "1h", label: "In 1 hour" },
          { key: "tomorrow_9am", label: "Tomorrow at 9:00 AM" },
          { key: "next_business", label: "Next business day" },
          { key: "next_week", label: "Next week" },
        ].map((o) => (
          <button
            key={o.key}
            data-testid={`snooze-preset-${o.key}`}
            onClick={() => pickPreset(o.key)}
            className="w-full text-left px-2 py-2 rounded-md text-sm text-slate-200 hover:bg-white/5 transition-colors"
          >
            {o.label}
          </button>
        ))}
        <div className="border-t border-white/5 my-1" />
        <div className="text-xs text-slate-500 px-2 mt-1 mb-1">Custom date/time</div>
        <div className="flex gap-2 px-2 pb-2">
          <Input
            type="datetime-local"
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            data-testid="snooze-custom-input"
            className="bg-[#0D1424] border-white/10 text-slate-100 text-xs"
          />
          <Button size="sm" onClick={pickCustom} data-testid="snooze-custom-apply" className="bg-[#7C5CFC] hover:bg-[#6a4de0]">
            Snooze
          </Button>
        </div>
        <div className="text-[10px] text-slate-500 px-2 pb-2">
          Demo simulation of time passage. No real background jobs.
        </div>
      </PopoverContent>
    </Popover>
  );
}
