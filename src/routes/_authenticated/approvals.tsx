import { Navigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@/lib/query";
import { api, type AppUser } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Check, X, Users, UserCheck } from "lucide-react";
import { toast } from "sonner";

export default function ApprovalsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  
  if (user && user.role !== "admin") return <Navigate to="/dashboard" />;

  const { data: pendingUsers } = useQuery({
    queryKey: ["users", "pending"],
    queryFn: () => api<AppUser[]>("/auth/users/pending"),
  });

  const approve = useMutation({
    mutationFn: (id: string) => api(`/auth/users/${id}/approve`, { method: "POST" }),
    onSuccess: () => {
      toast.success("User approved successfully!");
      qc.invalidateQueries({ queryKey: ["users", "pending"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const reject = useMutation({
    mutationFn: (id: string) => api(`/auth/users/${id}/reject`, { method: "POST" }),
    onSuccess: () => {
      toast.success("User registration rejected.");
      qc.invalidateQueries({ queryKey: ["users", "pending"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (!pendingUsers) return <div className="text-muted-foreground p-8">Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-xl gradient-bg text-white">
          <UserCheck className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pending User Approvals</h1>
          <p className="text-sm text-muted-foreground">
            {pendingUsers.length} user{pendingUsers.length === 1 ? "" : "s"} waiting for access approval
          </p>
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Requested Role</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingUsers.map((u) => (
                <tr key={u.id} className="border-t hover:bg-accent/40">
                  <td className="p-3 font-medium flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full gradient-bg grid place-items-center text-white text-xs font-semibold">
                      {(u.display_name?.[0] || u.email?.[0] || "?").toUpperCase()}
                    </div>
                    {u.display_name || "—"}
                  </td>
                  <td className="p-3 text-muted-foreground">{u.email}</td>
                  <td className="p-3">
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 capitalize">
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => approve.mutate(u.id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 text-emerald-700 px-3 py-1.5 text-xs font-medium hover:bg-emerald-500/20 cursor-pointer"
                      >
                        <Check className="h-3.5 w-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Reject and delete registration for ${u.email}?`)) {
                            reject.mutate(u.id);
                          }
                        }}
                        className="inline-flex items-center gap-1 rounded-lg bg-rose-500/10 text-rose-700 px-3 py-1.5 text-xs font-medium hover:bg-rose-500/20 cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" /> Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {pendingUsers.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-sm text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Users className="h-8 w-8 text-muted-foreground/60" />
                      <span>No pending users. All caught up!</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
