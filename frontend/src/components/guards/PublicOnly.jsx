import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/authStore.js";
import LoadingSpinner from "../common/LoadingSpinner";

/** Public/auth pages & layout; keep admins out. */
export default function PublicOnly({ children }) {
    const { user, isCheckingAuth, hasCheckedAuth } = useAuthStore();
    const location = useLocation();

    if (isCheckingAuth || !hasCheckedAuth) return <LoadingSpinner />;

    if (user?.role === "admin" && !location.pathname.startsWith("/admin")) {
        return <Navigate to="/admin" replace />;
    }
    return children;
}
