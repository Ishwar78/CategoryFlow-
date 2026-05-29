// Centralized API client for the Express backend.
// Configure VITE_API_BASE_URL in your project env (e.g. https://yourapi.onrender.com)
//https://categoryflow.onrender.com
export const API_BASE = (import.meta.env.VITE_API_BASE_URL || "https://categoryflow.onrender.com").replace(/\/$/, "");
const TOKEN_KEY = "lf.token";

export const tokenStore = {
  get: () => (typeof localStorage !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export function fileUrl(path: string | null | undefined) {
  if (!path) return null;
  if (/^https?:/.test(path)) return path;
  return `${API_BASE}${path}`;
}

async function handle(res: Response) {
  const ct = res.headers.get("content-type") || "";
  const body = ct.includes("application/json") ? await res.json() : await res.text();
  if (!res.ok) {
    const msg = (body && typeof body === "object" && body.error) || (typeof body === "string" ? body : `Request failed (${res.status})`);
    throw new Error(msg);
  }
  return body;
}

export async function api<T = any>(
  path: string,
  opts: { method?: string; body?: any; form?: FormData; auth?: boolean } = {}
): Promise<T> {
  const headers: Record<string, string> = {};
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  if (opts.auth !== false) {
    const t = tokenStore.get();
    if (t) headers["Authorization"] = `Bearer ${t}`;
  }
  const res = await fetch(`${API_BASE}${path}`, {
    method: opts.method || (opts.body || opts.form ? "POST" : "GET"),
    headers,
    body: opts.form ? opts.form : opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  return handle(res);
}

export type AppUser = { id: string; email: string; display_name: string; role: "admin" | "employee" };
export type Category = { id: string; name: string; slug: string; description: string; icon: string; color: string };
export type Expense = {
  id: string; category_id: string; item_name: string; quantity: number; price: number;
  vendor: string; description: string; purchase_date: string; payment_method: string;
  bill_path: string | null; status: "pending" | "approved" | "rejected"; approval_note: string;
  allotted_to: string; dispatch_date: string;
  approved_at: string | null; added_by: string; added_by_name: string | null; approved_by_name: string | null;
  created_at: string;
};
