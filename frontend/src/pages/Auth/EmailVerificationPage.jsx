"use client";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore.js";
import toast from "react-hot-toast";
import ErrorAlert from "../../components/common/ErrorAlert.jsx";
import SuccessAlert from "../../components/common/SuccessAlert.jsx";
import api from "@/api/api"; // ✅ centralized axios instance

const EmailVerificationPage = () => {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef([]);
  const attemptedCodeRef = useRef(null);
  const submittingRef = useRef(false);

  const navigate = useNavigate();
  const { error, isLoading, verifyEmail, message, clearError, clearMessage, user } = useAuthStore();

  const handleChange = (index, value) => {
    clearError();
    const onlyDigits = value.replace(/\D/g, "");
    attemptedCodeRef.current = null;

    // Handle paste
    if (onlyDigits.length > 1) {
      const pasted = onlyDigits.slice(0, 6).split("");
      const next = [...code];
      for (let i = 0; i < 6; i++) next[i] = pasted[i] || "";
      setCode(next);
      const nextEmpty = next.findIndex((d) => d === "");
      inputRefs.current[nextEmpty === -1 ? 5 : nextEmpty]?.focus();
      return;
    }

    // Single digit
    const next = [...code];
    next[index] = onlyDigits;
    setCode(next);
    if (onlyDigits && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleFocus = (index) => {
    if (error) clearError();
    inputRefs.current[index].select(); // select on focus
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const submitCode = async (codeStr) => {
    if (submittingRef.current) return;
    submittingRef.current = true;

    try {
      const result = await verifyEmail(codeStr);
      toast.success("Email verified successfully");
      if (result?.user?.role === "admin") navigate("/admin");
      else navigate("/");
    } catch {
      // handled by store
    } finally {
      submittingRef.current = false;
      attemptedCodeRef.current = codeStr;
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    const codeStr = code.join("");
    if (codeStr.length !== 6) return;
    await submitCode(codeStr);
  };

  // ✅ NEW: handle resend code
  const handleResendCode = async () => {
    try {
      setIsResending(true);
      const emailToUse = user?.email || localStorage.getItem("pendingEmail");
      if (!emailToUse) {
        toast.error("Missing email. Please sign up again.");
        return;
      }
      const res = await api.post("/auth/resend-verification", { email: emailToUse });
      toast.success(res.data.message || "Verification code resent!");
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to resend code";
      toast.error(msg);
    } finally {
      setIsResending(false);
    }
  };

  useEffect(() => {
    const codeStr = code.join("");
    if (!isLoading && codeStr.length === 6 && codeStr !== attemptedCodeRef.current) {
      submitCode(codeStr);
    }
  }, [code, isLoading]);

  const baseClasses =
    "w-12 h-12 text-center text-2xl font-bold rounded-lg outline-none transition duration-200";
  const idleClasses =
    "bg-gray-100 border border-gray-300 focus:border-transparent focus:ring-2 focus:ring-secondary/50";
  const errorClasses =
    "bg-gray-100 border border-red-500 focus:border-transparent focus:ring-2 focus:ring-red-500/50";

  const useErrorStyle = Boolean(error) && attemptedCodeRef.current === code.join("");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 sm:p-8">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <img src="/logo.png" alt="OLOPGV Logo" className="w-16 h-16 sm:w-20 sm:h-20" />
          </div>

          {/* Heading */}
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-center text-gray-900">
            Verify Your Email
          </h2>
          <p className="text-center text-gray-500 mb-6">
            Enter the 6-digit code sent to your email address.
          </p>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="flex justify-between mb-6">
              {code.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(idx, e.target.value)}
                  onFocus={() => handleFocus(idx)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className={`${baseClasses} ${useErrorStyle ? errorClasses : idleClasses}`}
                />
              ))}
            </div>

            <ErrorAlert error={error} onClose={clearError} />
            <SuccessAlert message={message} onClose={clearMessage} />

            <button
              type="submit"
              disabled={
                isLoading || code.some((d) => !d) || code.join("") === attemptedCodeRef.current
              }
              className="w-full bg-secondary text-white font-medium py-3 px-4 rounded-lg shadow-md 
                         hover:bg-secondary/90 focus:outline-none focus:ring-2 focus:ring-secondary 
                         focus:ring-offset-2 focus:ring-offset-gray-100 transition disabled:opacity-50"
            >
              {isLoading ? "Verifying..." : "Verify Email"}
            </button>

            {/* ✅ NEW: Resend link */}
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={isResending}
                className="text-sm text-secondary hover:underline disabled:opacity-50"
              >
                {isResending ? "Resending..." : "Didn’t receive a code? Resend"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationPage;
