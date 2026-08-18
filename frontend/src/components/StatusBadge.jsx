import { Badge } from "@/components/ui/badge";

const STATUS_STYLES = {
  "Detected":        { bg: "rgba(59,130,246,0.12)", text: "#93C5FD", label: "Detected" },
  "Draft Ready":     { bg: "rgba(124,92,252,0.14)", text: "#C4B5FD", label: "Draft Ready" },
  "Needs Approval":  { bg: "rgba(245,158,11,0.14)", text: "#FCD34D", label: "Needs Approval" },
  "Approval Required": { bg: "rgba(245,158,11,0.14)", text: "#FCD34D", label: "Approval Required" },
  "Follow-up Due":   { bg: "rgba(245,158,11,0.12)", text: "#FDBA74", label: "Follow-up Due" },
  "Campaign Eligible":{ bg: "rgba(124,92,252,0.12)", text: "#C4B5FD", label: "Campaign Eligible" },
  "Ready":           { bg: "rgba(0,229,168,0.12)",  text: "#6EE7B7", label: "Ready" },
  "Approved":        { bg: "rgba(0,229,168,0.14)",  text: "#00E5A8", label: "Approved" },
  "Sent":            { bg: "rgba(156,163,175,0.15)",text: "#E5E7EB", label: "Sent" },
  "Replied":         { bg: "rgba(124,92,252,0.14)", text: "#C4B5FD", label: "Replied" },
  "Appointment Booked":{ bg: "rgba(0,229,168,0.18)",text: "#00E5A8", label: "Appointment Booked" },
  "Won":             { bg: "rgba(0,229,168,0.18)",  text: "#00E5A8", label: "Won" },
  "Lost":            { bg: "rgba(248,113,113,0.14)",text: "#FCA5A5", label: "Lost" },
  "Snoozed":         { bg: "rgba(156,163,175,0.14)",text: "#D1D5DB", label: "Snoozed" },
  "Paused":          { bg: "rgba(156,163,175,0.14)",text: "#D1D5DB", label: "Paused" },
  "Needs Human Follow-up": { bg: "rgba(248,113,113,0.14)", text: "#FCA5A5", label: "Needs Human Follow-up" },
};

export default function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || { bg: "rgba(156,163,175,0.14)", text: "#D1D5DB", label: status };
  return (
    <Badge
      data-testid={`status-badge-${(status || "").toLowerCase().replace(/\s+/g, "-")}`}
      style={{ backgroundColor: style.bg, color: style.text, borderColor: "transparent" }}
      className="font-medium px-2.5 py-1 text-xs rounded-full border-transparent"
    >
      {style.label}
    </Badge>
  );
}

export function UrgencyPill({ urgency }) {
  const colorMap = { High: "#F87171", Medium: "#FCD34D", Low: "#9CA3AF" };
  const color = colorMap[urgency] || "#9CA3AF";
  return (
    <span
      data-testid={`urgency-${(urgency || "").toLowerCase()}`}
      className="inline-flex items-center gap-1.5 text-xs text-slate-300"
    >
      <span className="jobos-dot" style={{ backgroundColor: color }} />
      {urgency}
    </span>
  );
}
