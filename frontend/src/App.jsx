// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Toaster } from "react-hot-toast";

// Keep these non-lazy so auth splash shows immediately and error boundary stays active
import ErrorBoundary from "./components/ErrorBoundary";
import AuthChecker from "./components/AuthChecker";
import LoadingSpinner from "./components/LoadingSpinner";
import ProtectedRoute from "./components/ProtectedRoute";

// --- Lazy-loaded Layouts ---
const PublicLayout = lazy(() => import("./layouts/PublicLayout"));
const AdminLayout = lazy(() => import("./layouts/AdminLayout"));

// --- Lazy-loaded Pages (Public/Auth) ---
const HomePage = lazy(() => import("./pages/Public/HomePage"));
const SignUpPage = lazy(() => import("./pages/Auth/SignUpPage"));
const LoginPage = lazy(() => import("./pages/Auth/LoginPage"));
const EmailVerificationPage = lazy(() => import("./pages/Auth/EmailVerificationPage"));
const ForgotPasswordPage = lazy(() => import("./pages/Auth/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/Auth/ResetPasswordPage"));

// --- Lazy-loaded Pages (Settings branch) ---
const SettingsPage = lazy(() => import("./pages/Public/settings/SettingsPage"));
const PersonalInfoPanel = lazy(() => import("./pages/Public/settings/panels/PersonalInfoPanel"));
const AccountSecurityPanel = lazy(() => import("./pages/Public/settings/panels/AccountSecurityPanel"));
const AppointmentsPanel = lazy(() => import("./pages/Public/settings/panels/AppointmentsPanel"));
const AppointmentDetailPanel = lazy(() => import("./pages/Public/settings/panels/AppointmentDetailPanel"));
const NotificationPanel = lazy(() => import("./pages/Public/settings/panels/NotificationPanel"));
const GeneralInformation = lazy(() => import("./pages/Public/appointments/GeneralInformation"));

// --- Lazy-loaded Pages (Admin) ---
const AdminDashboard = lazy(() => import("./pages/Admin/AdminDashboard"));

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthChecker>
          <div className="min-h-screen">
            {/* Suspense handles code-split route loading spinners */}
            <Suspense
              fallback={
                <div className="fixed inset-0 z-[9999] grid place-items-center ">
                  <LoadingSpinner />
                </div>
              }
            >
              <Routes>
                {/* Auth Routes */}
                <Route path="/signup" element={<SignUpPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/verify-email" element={<EmailVerificationPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

                {/* Public Routes (layout) */}
                <Route element={<PublicLayout />}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/services" element={<div className="p-8">Services Page</div>} />
                  <Route path="/about" element={<div className="p-8">About Page</div>} />
                  <Route path="/contact" element={<div className="p-8">Contact Page</div>} />
                  <Route path="services/generalinfo" element={<GeneralInformation />} />

                  {/* Settings (protected branch) */}
                  <Route
                    path="/settings/*"
                    element={
                      <ProtectedRoute>
                        <SettingsPage />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<Navigate to="profile" replace />} />
                    <Route path="profile" element={<PersonalInfoPanel />} />
                    <Route path="security" element={<AccountSecurityPanel />} />
                    <Route path="appointments" element={<AppointmentsPanel />} />
                    <Route path="appointments/:id" element={<AppointmentDetailPanel />} />

                    <Route path="notification" element={<NotificationPanel />} />
                  </Route>
                </Route>

                {/* Admin (protected layout + nested) */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                      <AdminLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<AdminDashboard />} />
                  <Route path="users" element={<div>Users Management</div>} />
                  <Route path="settings" element={<div>Settings</div>} />
                </Route>

                {/* Catch-all */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>

            {/* Toaster outside Suspense so it doesn't remount on route loads */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: "#1f2937",
                  color: "#fff",
                  border: "1px solid #374151",
                },
                success: { iconTheme: { primary: "#10b981", secondary: "#fff" } },
                error: { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
              }}
            />
          </div>
        </AuthChecker>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
