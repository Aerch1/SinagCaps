// src/components/ProtectedRoute.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import LoadingSpinner from "../components/LoadingSpinner"

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, isCheckingAuth } = useAuthStore();
  const location = useLocation();

  // Wait for AuthChecker's initial check
  if (isCheckingAuth) {
    return <LoadingSpinner />;
  }

 
  // Not logged in -> go to login
  if (!user) return <Navigate to="/" replace state={{ from: location }} />;

  // Optional role check
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
