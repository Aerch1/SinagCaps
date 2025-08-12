import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { Toaster } from "react-hot-toast"

// Layouts
import PublicLayout from "./layouts/PublicLayout"
import AdminLayout from "./layouts/AdminLayout"

// Pages
import HomePage from "./pages/Public/HomePage"
import SignUpPage from "./pages/Auth/SignUpPage"
import LoginPage from "./pages/Auth/LoginPage"
import EmailVerificationPage from "./pages/Auth/EmailVerificationPage"
import ForgotPasswordPage from "./pages/Auth/ForgotPasswordPage"
import ResetPasswordPage from "./pages/Auth/ResetPasswordPage"
import AdminDashboard from "./pages/Admin/AdminDashboard"


import SettingsPage from "./pages/Public/settings/SettingsPage";
import PersonalInfoPanel from "./pages/Public/settings/panels/PersonalInfoPanel";
import AccountSecurityPanel from "./pages/Public/settings/panels/AccountSecurityPanel";
import AppointmentsPanel from "./pages/Public/settings/panels/AppointmentsPanel";
import MessagesPanel from "./pages/Public/settings/panels/MessagesPanel";

// Components
import FloatingShape from "./components/FloatingShape"
import ProtectedRoute from "./components/ProtectedRoute"
import ErrorBoundary from "./components/ErrorBoundary"
import AuthChecker from "./components/AuthChecker"

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthChecker>
          <div className="min-h-screen">
            <Routes>
              {/* Auth Routes with floating shapes background */}
              <Route
                path="/signup"
                element={
                  <SignUpPage />
                }

              />
              <Route
                path="/login"
                element={
                  <div >
                    {/* <FloatingShape color="bg-green-500" size="w-64 h-64" top="-5%" left="10%" delay={0} />
                    <FloatingShape color="bg-emerald-500" size="w-48 h-48" top="70%" left="80%" delay={5} />
                    <FloatingShape color="bg-lime-500" size="w-32 h-32" top="40%" left="-10%" delay={2} /> */}
                    <LoginPage />
                  </div>
                }
              />
              <Route
                path="/verify-email"
                element={
                  <div >
                    <EmailVerificationPage />
                  </div>
                }
              />
              <Route
                path="/forgot-password"
                element={
                  <div  >
                    <ForgotPasswordPage />
                  </div>
                }
              />
              <Route
                path="/reset-password/:token"
                element={
                  <div >
                    <ResetPasswordPage />
                  </div>
                }
              />

              {/* Public Routes */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/services" element={<div className="p-8">Services Page</div>} />
                <Route path="/about" element={<div className="p-8">About Page</div>} />
                <Route path="/contact" element={<div className="p-8">Contact Page</div>} />

                {/* 🔒 Protect the whole settings branch */}
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
                  <Route path="messages" element={<MessagesPanel />} />
                </Route>
              </Route>

              {/* Protected Admin Routes */}
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

              {/* Catch all routes */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#1f2937',
                  color: '#fff',
                  border: '1px solid #374151',
                },
                success: {
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#fff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </div>
        </AuthChecker>
      </Router>
    </ErrorBoundary>
  )
}

export default App;
