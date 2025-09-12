// src/pages/auth/SignUpPage.jsx
"use client";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader, Lock, Mail, User } from "lucide-react";

import Input from "../../components/ui/Input.jsx";
import PasswordStrengthMeter from "../../components/common/PasswordStrengthMeter.jsx";
import ErrorAlert from "../../components/common/ErrorAlert.jsx";
import SuccessAlert from "../../components/common/SuccessAlert.jsx";
import { useAuthStore } from "../../store/authStore.js";
import { validateSignup } from "../../../../shared/validation.js";

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [fieldErr, setFieldErr] = useState({ name: "", email: "", password: "" });

  const navigate = useNavigate();
  const { signup, error, isLoading, message, clearError, clearMessage, clearAll } =
    useAuthStore();

  useEffect(() => {
    clearAll();
  }, [clearAll]);

  const handleAnyFieldFocus = (field) => {
    if (fieldErr[field]) {
      setFieldErr((prev) => ({ ...prev, [field]: "" }));
    }
    if (error) clearError();
  };

  // 🔑 validate all fields at once
  const runClientValidation = () => {
    const errs = { name: "", email: "", password: "" };

    if (!name.trim()) errs.name = "Full name is required";
    if (!email.trim()) errs.email = "Email address is required";
    if (!password.trim()) errs.password = "Password is required";

    // Also run your shared validation
    const v = validateSignup({ name, email, password });
    if (!v.ok) {
      if (/full name/i.test(v.message)) errs.name = v.message;
      else if (/email/i.test(v.message)) errs.email = v.message;
      else if (/password/i.test(v.message)) errs.password = v.message;
    }

    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    const errs = runClientValidation();
    setFieldErr(errs);

    if (errs.name || errs.email || errs.password) return;

    try {
      const ok = await signup(email, password, name);
      if (ok) navigate("/verify-email");
    } catch {
      /* handled globally */
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 sm:p-8">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <img src="/logo.png" alt="OLOPGV Logo" className="w-16 h-16" />
          </div>

          {/* Title */}
          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-2">
              OLOPGV SIGN UP
            </h2>
            <p className="text-gray-500 text-sm text-center">
              Create your account with your details below
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <Input
              icon={User}
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={() => handleAnyFieldFocus("name")}
              error={fieldErr.name}
              autoComplete="name"
            />

            <Input
              icon={Mail}
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => handleAnyFieldFocus("email")}
              error={fieldErr.email}
              autoComplete="email"
            />

            <Input
              icon={Lock}
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => handleAnyFieldFocus("password")}
              error={fieldErr.password}
              autoComplete="new-password"
            />

            <PasswordStrengthMeter password={password} />

            {/* Alerts */}
            <ErrorAlert error={error} onClose={clearError} />
            <SuccessAlert message={message} onClose={clearMessage} />

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-secondary text-white font-medium rounded-lg shadow-md 
             hover:bg-secondary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 
             focus:ring-secondary transition-all duration-200 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader className="w-6 h-6 animate-spin mx-auto" />
              ) : (
                "Create Account"
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
