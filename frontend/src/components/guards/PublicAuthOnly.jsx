import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/authStore.js";
import LoadingSpinner from "../common/LoadingSpinner";

/** For public-tree pages that require login (and block admins). */
export default function PublicAuthOnly({ children }) {
    const { user, isCheckingAuth, hasCheckedAuth } = useAuthStore();
    const location = useLocation();

    // Wait for AuthChecker to complete before deciding
    if (isCheckingAuth || !hasCheckedAuth) {
        return (
            <div className="fixed inset-0 grid place-items-center bg-white/70">
                <LoadingSpinner />
            </div>
        );
    }

    if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
    if (user.role === "admin") return <Navigate to="/admin" replace />;

    return children;
}
