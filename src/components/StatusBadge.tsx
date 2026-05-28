import { CheckCircle2, Clock, XCircle } from "lucide-react";

export function StatusBadge({ status }: { status: "pending" | "approved" | "rejected" }) {
  const map = {
    pending: { Icon: Clock, cls: "bg-amber-500/10 text-amber-700 ring-amber-500/20", label: "Pending" },
    approved: { Icon: CheckCircle2, cls: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20", label: "Approved" },
    rejected: { Icon: XCircle, cls: "bg-rose-500/10 text-rose-700 ring-rose-500/20", label: "Rejected" },
  } as const;
  const { Icon, cls, label } = map[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${cls}`}>
      <Icon className="h-3 w-3" /> {label}
    </span>
  );
}
