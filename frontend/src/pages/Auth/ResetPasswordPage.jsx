"use client";
import { useState, useEffect } from "react";
import { useAuthStore } from "../../store/authStore.js";
import { useNavigate, useParams, Link } from "react-router-dom";
import Input from "../../components/ui/Input.jsx";
import { Lock, Loader, ArrowLeft } from "lucide-react";
import ErrorAlert from "../../components/common/ErrorAlert.jsx";
import SuccessAlert from "../../components/common/SuccessAlert.jsx";
import { validateResetPassword } from "../../shared/validation.js";

const ResetPasswordPage = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fieldErr, setFieldErr] = useState({ password: "", confirm: "" });

  const {
    resetPassword,
    isLoading,
    error,
    message,
    clearError,
    clearMessage,
    clearAll,
  } = useAuthStore();

  const { token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    clearAll();
    return () => clearAll();
  }, [clearAll]);

  const runClientValidation = () => {
    const errs = { password: "", confirm: "" };

    const v = validateResetPassword({ token, password });
    if (!v.ok) errs.password = v.message;

    if (!confirm) errs.confirm = "Please confirm your password";
    else if (password && confirm && password !== confirm) {
      errs.confirm = "Passwords do not match";
    }

    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    const errs = runClientValidation();
    setFieldErr(errs);
    if (errs.password || errs.confirm) return;

    try {
      await resetPassword(token, password);
      setTimeout(() => navigate("/login"), 1500);
    } catch {
      /* handled by ErrorAlert */
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6 sm:p-8">
        <div className="flex justify-center mb-6">
          <img
            src="/logo.png"
            alt="OLOPGV Logo"
            className="w-14 h-14 sm:w-16 sm:h-16"
          />
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-center text-gray-900">
          Reset Password
        </h2>

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-4">
            <Input
              icon={Lock}
              type="password"
              placeholder="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => {
                if (fieldErr.password)
                  setFieldErr((p) => ({ ...p, password: "" }));
                clearError();
              }}
              error={fieldErr.password}
              autoComplete="new-password"
            />
          </div>

          <div className="mb-4">
            <Input
              icon={Lock}
              type="password"
              placeholder="Confirm New Password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              onFocus={() => {
                if (fieldErr.confirm)
                  setFieldErr((p) => ({ ...p, confirm: "" }));
                clearError();
              }}
              error={fieldErr.confirm}
              autoComplete="new-password"
            />
          </div>

          <ErrorAlert error={error} onClose={clearError} />
          <SuccessAlert message={message} onClose={clearMessage} />

          <button
            className="w-full py-3 px-4 bg-secondary text-white font-medium rounded-lg shadow-md 
                       hover:bg-secondary/90 transition-all duration-200 disabled:opacity-50"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader className="w-6 h-6 animate-spin mx-auto" />
            ) : (
              "Set New Password"
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="text-sm text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
