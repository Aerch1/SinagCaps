import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/authStore.js";
import LoadingSpinner from "../common/LoadingSpinner.jsx";

export default function AdminOnly({ children }) {
    const { user, isCheckingAuth, hasCheckedAuth } = useAuthStore();
    const location = useLocation();

    if (isCheckingAuth || !hasCheckedAuth) return <LoadingSpinner />;

    if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
    if (user.role !== "admin") return <Navigate to="/" replace />;

    return children;
}