import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/authStore.js";
import LoadingSpinner from "../common/LoadingSpinner";

/** For public-tree pages that require login (and still block admins). */
export default function PublicAuthOnly({ children }) {
    const { user, isCheckingAuth, hasCheckedAuth } = useAuthStore();
    const location = useLocation();

    if (isCheckingAuth || !hasCheckedAuth) return <LoadingSpinner />;

    if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
    if (user.role === "admin") return <Navigate to="/admin" replace />;

    return children;
}
