import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/authStore.js";
import LoadingSpinner from "../common/LoadingSpinner";

/** Public or auth pages (keep admins out). */
export default function PublicOnly({ children }) {
  const { user, isCheckingAuth, hasCheckedAuth } = useAuthStore();
  const location = useLocation();

  if (isCheckingAuth || !hasCheckedAuth) {
    return (
      <div className="fixed inset-0 grid place-items-center bg-white/70">
        <LoadingSpinner />
      </div>
    );
  }

  // Redirect admins who try to open public pages
  if (user?.role === "admin" && !location.pathname.startsWith("/admin")) {
    return <Navigate to="/admin" replace />;
  }

  return children;
}
