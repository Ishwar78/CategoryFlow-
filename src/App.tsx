import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/lib/auth";

import { AppShell } from "@/components/AppShell";
import Landing from "@/routes/index";
import Login from "@/routes/login";
import Dashboard from "@/routes/_authenticated/dashboard";
import Approvals from "@/routes/_authenticated/approvals";
import Category from "@/routes/_authenticated/category.$slug";
import Dispatch from "@/routes/_authenticated/dispatch.$slug";
import Items from "@/routes/_authenticated/items.$slug";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/" replace />;
  return <AppShell>{children}</AppShell>;
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/approvals"
            element={
              <ProtectedRoute>
                <Approvals />
              </ProtectedRoute>
            }
          />
          <Route
            path="/category/:slug"
            element={
              <ProtectedRoute>
                <Category />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dispatch/:slug"
            element={
              <ProtectedRoute>
                <Dispatch />
              </ProtectedRoute>
            }
          />
          <Route
            path="/items/:slug"
            element={
              <ProtectedRoute>
                <Items />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster richColors position="top-right" />
    </AuthProvider>
  );
}
