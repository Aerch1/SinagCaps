import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Toaster } from "react-hot-toast";

import ErrorBoundary from "./components/common/ErrorBoundary";
import AuthChecker from "./components/guards/AuthChecker";
import LoadingSpinner from "./components/common/LoadingSpinner";
import Contact from "./pages/Public/Contact";
import Events from "./pages/Public/Events";

// NEW: guards
import PublicOnly from "./components/guards/PublicOnly";
import PublicAuthOnly from "./components/guards/PublicAuthOnly";
import AdminOnly from "./components/guards/AdminOnly";

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

// --- Lazy-loaded Pages (Appointments) ---
const GeneralInformation = lazy(() => import("./pages/Public/appointments/GeneralInformation"));
const AppointmentForm = lazy(() => import("./pages/Public/appointments/AppointmentForm"));
const AppointmentSuccess = lazy(() => import("./pages/Public/appointments/AppointmentSuccess"));
const AppointmentTerms = lazy(() => import("./pages/Public/appointments/AppointmentTerms"));

// --- Admin ---
import AdminProviders from "./context/admin/AdminProviders";
import CalendarPage from "./pages/Admin/CalendarPage";
import { LucideAxe } from "lucide-react";
const AdminDashboard = lazy(() => import("./pages/Admin/AdminDashboard"));
const AdminAppointmentsPage = lazy(() => import("./pages/Admin/AppointmentsPage"));
const ContentManagement = lazy(() => import("./pages/Admin/ContentManagement"))
const ReportsPage = lazy(() => import("./pages/Admin/ReportsPage"))
const ManageAvailability = lazy(() => import("./pages/Admin/ManageAvailability"))
const Profile = lazy(() => import("./pages/Admin/Profile"))
const UserManagement = lazy(() => import("./pages/Admin/UserManagementaPage"))
const MessagesPage = lazy(() => import("./pages/Admin/MessagesPage"))
const SettingAdmin = lazy(() => import("./pages/Admin/SettingsPage"))


function App() {


  return (


    <ErrorBoundary>
      <Router>
        <AuthChecker>
          <div className="min-h-screen">
            <Suspense
              fallback={
                <div className="fixed inset-0 z-[9999] grid place-items-center">
                  <LoadingSpinner />
                </div>
              }
            >
              <Routes>
                {/* ---------- Auth pages (admins blocked) ---------- */}
                <Route path="/signup" element={<PublicOnly><SignUpPage /></PublicOnly>} />
                <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
                <Route path="/verify-email" element={<PublicOnly><EmailVerificationPage /></PublicOnly>} />
                <Route path="/forgot-password" element={<PublicOnly><ForgotPasswordPage /></PublicOnly>} />
                <Route path="/reset-password/:token" element={<PublicOnly><ResetPasswordPage /></PublicOnly>} />

                {/* ---------- Public layout (admins blocked) ---------- */}
                <Route element={<PublicOnly><PublicLayout /></PublicOnly>}>
                  {/* Public pages */}
                  <Route path="/" element={<HomePage />} />
                  <Route path="/services" element={<div className="p-8">Services Page</div>} />
                  <Route path="/about" element={<div className="p-8">About Page</div>} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/event" element={<Events />} />
                  <Route path="/services/generalinfo" element={<GeneralInformation />} />
                  <Route path="/services/appointments/terms" element={<AppointmentTerms />} />

                  {/* Public area but requires login (non-admin) */}
                  <Route
                    path="/services/appointments/book"
                    element={<PublicAuthOnly><AppointmentForm /></PublicAuthOnly>}
                  />

                  {/* Success page (open) */}
                  <Route path="/appointments/success" element={<AppointmentSuccess />} />

                  {/* Settings (entire branch requires login; admins blocked) */}
                  <Route
                    path="/settings/*"
                    element={<PublicAuthOnly><SettingsPage /></PublicAuthOnly>}
                  >
                    <Route index element={<Navigate to="profile" replace />} />
                    <Route path="profile" element={<PersonalInfoPanel />} />
                    <Route path="security" element={<AccountSecurityPanel />} />
                    <Route path="appointments" element={<AppointmentsPanel />} />
                    <Route path="appointments/:id" element={<AppointmentDetailPanel />} />
                    <Route path="notification" element={<NotificationPanel />} />
                  </Route>
                </Route>

                {/* ---------- Admin (admins only) ---------- */}
                <Route
                  path="/admin"
                  element={
                    <AdminOnly>
                      <AdminProviders>
                        <AdminLayout />
                      </AdminProviders>
                    </AdminOnly>
                  }
                >
                  <Route index element={<AdminDashboard />} />
                  <Route path="calendar" element={<CalendarPage />} />
                  <Route path="settings" element={<SettingAdmin />} />
                  <Route path="appointments" element={<AdminAppointmentsPage />} />
                  <Route path="content" element={<ContentManagement />} />
                  <Route path="report" element={<ReportsPage />} />
                  <Route path="schedule" element={<ManageAvailability />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="users" element={<UserManagement />} />
                  <Route path="messages" element={<MessagesPage />} />

                  <Route path="*" element={<Navigate to="/admin" replace />} />
                </Route>

                {/* ---------- Catch-all ---------- */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>

            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: { background: "#1f2937", color: "#fff", border: "1px solid #374151" },
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
