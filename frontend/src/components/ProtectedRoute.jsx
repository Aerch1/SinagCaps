import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import LoadingSpinner from "./LoadingSpinner";

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, isAuthenticated, isCheckingAuth } = useAuthStore();

  // Show loading while checking authentication
  if (isCheckingAuth) {
    return <LoadingSpinner />;
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // If user is not verified, redirect to email verification
  if (!user.isVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  // If specific roles are required and user doesn't have the right role
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
