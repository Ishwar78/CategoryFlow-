import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, tokenStore, type AppUser } from "@/lib/api";

interface AuthCtx {
  user: AppUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, display_name?: string) => Promise<void>;
  signOut: () => void;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({} as any);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadMe() {
    try {
      if (!tokenStore.get()) { setUser(null); return; }
      const { user } = await api<{ user: AppUser }>("/auth/me");
      setUser(user);
    } catch {
      tokenStore.clear();
      setUser(null);
    }
  }

  useEffect(() => { loadMe().finally(() => setLoading(false)); }, []);

  async function signIn(email: string, password: string) {
    const { token, user } = await api<{ token: string; user: AppUser }>("/auth/login", { body: { email, password } });
    tokenStore.set(token); setUser(user);
  }
  async function signUp(email: string, password: string, display_name?: string) {
    const res = await api<{ token: string | null; user: AppUser; message?: string }>("/auth/signup", { body: { email, password, display_name } });
    if (res.token) {
      tokenStore.set(res.token);
      setUser(res.user);
    } else {
      throw new Error(res.message || "Account created! Pending admin approval.");
    }
  }
  function signOut() { tokenStore.clear(); setUser(null); }

  return <Ctx.Provider value={{ user, loading, signIn, signUp, signOut, refresh: loadMe }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
