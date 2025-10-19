import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Toaster } from "react-hot-toast";

import ErrorBoundary from "./components/common/ErrorBoundary";
import AuthChecker from "./components/guards/AuthChecker";
import LoadingSpinner from "./components/common/LoadingSpinner";
import Contact from "./pages/Public/Contact";
import Events from "./pages/Public/Events";
import EventDetail from "./components/section/EventDetail";
import Announcements from "./components/section/Announcements"; // ✅ NEW IMPORT
import AnnouncementDetail from "./components/section/AnnouncementDetail";



// NEW: guards
import PublicOnly from "./components/guards/PublicOnly";
import PublicAuthOnly from "./components/guards/PublicAuthOnly";
import AdminOnly from "./components/guards/AdminOnly";

// --- Lazy-loaded Layouts ---
const PublicLayout = lazy(() => import("./layouts/PublicLayout"));
const AdminLayout = lazy(() => import("./layouts/AdminLayout"));
const DocumentRequestPage = lazy(() => import("./pages/Public/DocumentRequestPage"));


// --- Lazy-loaded Pages (Public/Auth) ---
const HomePage = lazy(() => import("./pages/Public/HomePage"));
const SignUpPage = lazy(() => import("./pages/Auth/SignUpPage"));
const LoginPage = lazy(() => import("./pages/Auth/LoginPage"));
const EmailVerificationPage = lazy(() => import("./pages/Auth/EmailVerificationPage"));
const ForgotPasswordPage = lazy(() => import("./pages/Auth/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/Auth/ResetPasswordPage"));


// --- Lazy-loaded Pages (Settings branch) ---
const SettingsPage = lazy(() => import("./pages/Public/settings/SettingsPage"));
const AccountSecurityPanel = lazy(() => import("./pages/Public/settings/panels/AccountSecurityPanel"));
const AppointmentsPanel = lazy(() => import("./pages/Public/settings/panels/AppointmentsPanel"));
const AppointmentDetailPanel = lazy(() => import("./pages/Public/settings/panels/AppointmentDetailPanel"));
const NotificationPanel = lazy(() => import("./pages/Public/settings/panels/NotificationPanel"));
const DocumentRequestDetailPanel = lazy(() => import("./pages/Public/settings/panels/DocumentDetails"));

// --- Lazy-loaded Pages (Appointments) ---
const GeneralInformation = lazy(() => import("./pages/Public/appointments/GeneralInformation"));
const AppointmentPage = lazy(() => import("./pages/Public/appointments/AppointmentPage"));
const AppointmentSuccess = lazy(() => import("./pages/Public/appointments/AppointmentSuccess"));
const AppointmentTerms = lazy(() => import("./pages/Public/appointments/AppointmentTerms"));
const AboutPage = lazy(() => import("./pages/Public/About"))


// --- Admin ---
import AdminProviders from "./context/admin/AdminProviders";
import CalendarPage from "./pages/Admin/CalendarPage";
import AdminResetPasswordPage from "./pages/Auth/AdminResetPasswordPage";
const AdminDashboard = lazy(() => import("./pages/Admin/AdminDashboard"));
const AdminAppointmentsPage = lazy(() => import("./pages/Admin/AppointmentsPage"));
const ContentManagement = lazy(() => import("./pages/Admin/ContentManagement"))
const ReportsPage = lazy(() => import("./pages/Admin/ReportsPage"))
const ManageAvailability = lazy(() => import("./pages/Admin/ManageAvailability"))
const UserManagement = lazy(() => import("./pages/Admin/UserManagementaPage"))
const SettingAdmin = lazy(() => import("./pages/Admin/SettingsPage"))
const AdminDocumentManagement = lazy(() => import("./pages/Admin/AdminDocumentManagement"));


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
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/announcements" element={<Announcements />} /> {/* ✅ NEW PAGE */}
                  <Route path="/announcements/:id" element={<AnnouncementDetail />} />


                  <Route path="/event" element={<Events />} />
                  <Route path="/updates/:id" element={<EventDetail />} />
                  <Route path="/document-request" element={<DocumentRequestPage />} /> {/* ✅ NEW */}

                  <Route path="/services/generalinfo" element={<GeneralInformation />} />
                  <Route path="/services/appointments/terms" element={<AppointmentTerms />} />

                  {/* Public area but requires login (non-admin) */}
                  <Route
                    path="/services/appointments/book"
                    element={<PublicAuthOnly><AppointmentPage /></PublicAuthOnly>}
                  />

                  {/* Success page (open) */}
                  <Route path="/appointments/success" element={<AppointmentSuccess />} />

                  {/* Settings (entire branch requires login; admins blocked) */}
                  <Route
                    path="/settings/*"
                    element={<PublicAuthOnly><SettingsPage /></PublicAuthOnly>}
                  >
                    <Route index element={<Navigate to="profile" replace />} />
                    <Route path="security" element={<AccountSecurityPanel />} />
                    <Route path="appointments" element={<AppointmentsPanel />} />
                    <Route path="appointments/:id" element={<AppointmentDetailPanel />} />
                    <Route path="notification" element={<NotificationPanel />} />
                    <Route path="document-requests/:id" element={<DocumentRequestDetailPanel />} />

                  </Route>
                </Route>

                {/* ✅ Admin reset password (accessible without login) */}
                <Route
                  path="/admin/reset-password/:token"
                  element={<PublicOnly><AdminResetPasswordPage /></PublicOnly>}
                />


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
                  <Route path="users" element={<UserManagement />} />


                  <Route path="*" element={<Navigate to="/admin" replace />} />
                  <Route path="documents" element={<AdminDocumentManagement />} />

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
