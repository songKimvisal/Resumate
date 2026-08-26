import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/UseAuth";
import { useHydrateAiCredits } from "../hooks/useAiCredits";
import { markAppEntered } from "../lib/session";

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  useHydrateAiCredits();

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <p className="text-text-secondary">Loading…</p>
      </div>
    );
  }

  if (user) markAppEntered();

  return user ? (
    <Outlet />
  ) : (
    <Navigate to="/login" state={{ from: location.pathname }} replace />
  );
}
