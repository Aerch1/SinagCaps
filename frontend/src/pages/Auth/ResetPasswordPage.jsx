// src/pages/auth/ResetPasswordPage.jsx
"use client";
import { useState, useEffect } from "react";
import { useAuthStore } from "../../store/authStore.js";
import { useNavigate, useParams, Link } from "react-router-dom";
import Input from "../../components/input.jsx";
import { Lock, Loader, ArrowLeft } from "lucide-react";
import ErrorAlert from "../../components/ErrorAlert.jsx";
import SuccessAlert from "../../components/SuccessAlert.jsx";
import { validateResetPassword } from "../../../../shared/validation.js";

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

    // single source of truth for length/etc
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
      await resetPassword(token, password); // server errors surface via ErrorAlert
      setTimeout(() => navigate("/login"), 1500);
    } catch {
      /* no-op: ErrorAlert shows server messages */
    }
  };

  return (
        <div className="min-h-screen bg-[url('/forgot.jpg')] bg-cover bg-center flex items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 bg-black/20"></div>
          <div className="max-w-md w-full bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden">
      <div className="p-8">
        <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-[#710000] to-[#500000] text-transparent bg-clip-text">
          Reset Password
        </h2>

        <form onSubmit={handleSubmit} noValidate>
          <Input
            icon={Lock}
            type="password"
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => {
              if (fieldErr.password) setFieldErr((p) => ({ ...p, password: "" }));
              clearError();
            }}
            error={fieldErr.password}
            autoComplete="new-password"
          />
          <Input
            icon={Lock}
            type="password"
            placeholder="Confirm New Password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            onFocus={() => {
              if (fieldErr.confirm) setFieldErr((p) => ({ ...p, confirm: "" }));
              clearError();
            }}
            error={fieldErr.confirm}
            autoComplete="new-password"
          />

          <ErrorAlert error={error} onClose={clearError} />
          <SuccessAlert message={message} onClose={clearMessage} />

          <button
            className="w-full py-3 px-4 bg-gradient-to-r from-[#710000] to-[#500000] text-white font-medium rounded-lg shadow-lg hover:from-[#600000] hover:to-[#400000] focus:outline-none focus:ring-2 focus:ring-[#710000] focus:ring-offset-2 focus:ring-offset-gray-800 transition-all duration-200 disabled:opacity-50"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? <Loader className="w-6 h-6 animate-spin mx-auto" /> : "Set New Password"}
          </button>
        </form>
      </div>

      <div className="px-8 py-4 bg-gray-900/50 flex justify-center">
        <Link to="/login" className="text-sm text-blue-400 hover:text-blue-300 hover:underline flex items-center">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Login
        </Link>
      </div>
    </div>
    </div>

  );
  
};


export default ResetPasswordPage;
