import { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "@/api/client";
import { useSession } from "@/context/SessionContext";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Workflow, PlayCircle, Save } from "lucide-react";

const FIELDS = [
  { key: "trigger", label: "Trigger conditions" },
  { key: "business_hours", label: "Business hours" },
  { key: "contact_channel", label: "Contact channel" },
  { key: "message_tone", label: "Message tone" },
  { key: "follow_up_timing", label: "Follow-up timing" },
  { key: "approval_mode", label: "Approval mode" },
  { key: "stop_rules", label: "Stop rules" },
  { key: "escalation", label: "Escalation conditions" },
];

function WorkflowCard({ wf, onSave, onTest }) {
  const [draft, setDraft] = useState(wf);
  useEffect(() => setDraft(wf), [wf]);

  return (
    <Card className="bg-[#111827] border-white/10 p-5" data-testid={`workflow-card-${wf.id}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="jobos-heading text-lg font-bold flex items-center gap-2">
            <Workflow size={16} className="text-[#7C5CFC]" /> {wf.name}
          </div>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">{wf.description}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">Workflow paused</span>
          <Switch
            data-testid={`pause-toggle-${wf.id}`}
            checked={draft.paused}
            onCheckedChange={(v) => setDraft({ ...draft, paused: v })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
        {FIELDS.map(({ key, label }) => (
          <div key={key}>
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">{label}</div>
            <Input
              value={draft[key] || ""}
              onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
              data-testid={`wf-${wf.id}-${key}`}
              className="bg-[#0D1424] border-white/10 text-slate-100"
            />
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        <Button onClick={() => onSave(draft)} className="bg-[#7C5CFC] hover:bg-[#6a4de0]" data-testid={`save-workflow-${wf.id}`}>
          <Save size={14} className="mr-1" /> Save configuration
        </Button>
        <Button onClick={() => onTest(wf.id)} variant="outline" className="bg-transparent border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10" data-testid={`test-workflow-${wf.id}`}>
          <PlayCircle size={14} className="mr-1" /> Test with sample data
        </Button>
      </div>
    </Card>
  );
}

export default function WorkflowBuilderPage() {
  const { sessionId } = useSession();
  const [workflows, setWorkflows] = useState([]);

  async function load() {
    const { data } = await api.get(`/demo/${sessionId}/workflows`);
    setWorkflows(data.workflows);
  }
  useEffect(() => { if (sessionId) load(); }, [sessionId]);

  async function save(wf) {
    await api.put(`/demo/${sessionId}/workflows/${wf.id}`, wf);
    toast.success("Workflow saved");
    load();
  }
  async function test(id) {
    const { data } = await api.post(`/demo/${sessionId}/workflows/${id}/test`);
    if (data.ok) toast.success("Workflow tested — no messages sent", { description: "Sample run completed 4 simulated steps." });
  }

  return (
    <div className="space-y-5" data-testid="workflow-builder-page">
      <div>
        <h1 className="jobos-heading text-3xl font-bold">Workflow Builder</h1>
        <p className="text-slate-400 text-sm mt-1">Editable templates — no drag-and-drop. Configure rules and pause anytime.</p>
      </div>
      <div className="space-y-4">
        {workflows.map((w) => <WorkflowCard key={w.id} wf={w} onSave={save} onTest={test} />)}
      </div>
    </div>
  );
}
