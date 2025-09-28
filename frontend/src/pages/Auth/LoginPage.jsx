"use client";
import { useState, useEffect } from "react";
import { Mail, Lock, Loader } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Input from "../../components/ui/Input.jsx";
import toast from "react-hot-toast";
import { useAuthStore } from "../../store/authStore.js";
import ErrorAlert from "../../components/common/ErrorAlert.jsx";
import SuccessAlert from "../../components/common/SuccessAlert.jsx";
import { validateLogin } from "../../shared/validation.js";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErr, setFieldErr] = useState({ email: "", password: "" });

  const navigate = useNavigate();
  const { login, isLoading, error, message, clearError, clearMessage, clearAll } = useAuthStore();

  useEffect(() => {
    clearAll();
  }, [clearAll]);

  const handleFocus = (field) => {
    if (fieldErr[field]) setFieldErr((prev) => ({ ...prev, [field]: "" }));
    if (error) clearError();
  };

  const runClientValidation = () => {
    const errs = { email: "", password: "" };
    if (!email.trim()) errs.email = "Email is required";
    if (!password.trim()) errs.password = "Password is required";

    const v = validateLogin({ email, password });
    if (!v.ok) {
      if (/email/i.test(v.message)) errs.email = v.message;
      else if (/password/i.test(v.message)) errs.password = v.message;
    }

    return errs;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    clearError();

    const errs = runClientValidation();
    setFieldErr(errs);

    if (errs.email || errs.password) return;

    try {
      const user = await login(email, password);
      if (user) navigate(user.role === "admin" ? "/admin" : "/");
      toast.success("Login Successfully");
    } catch {
      // handled by store
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 sm:p-8">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <img src="/logo.png" alt="OLOPGV Logo" className="w-16 h-16 sm:w-20 sm:h-20" />
          </div>

          {/* Heading */}
          <div className="mb-6 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">OLOPGV LOGIN</h2>
            <p className="text-sm text-gray-500">Please enter your credentials to access your account</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} noValidate className="space-y-4">
            <Input
              icon={Mail}
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => handleFocus("email")}
              autoComplete="email"
              error={fieldErr.email}
            />

            <Input
              icon={Lock}
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => handleFocus("password")}
              autoComplete="current-password"
              error={fieldErr.password}
            />

            <div className="flex justify-end mb-2">
              <Link
                to="/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors duration-200"
              >
                Forgot password?
              </Link>
            </div>

            {/* Alerts */}
            <ErrorAlert error={error} onClose={clearError} />
            <SuccessAlert message={message} onClose={clearMessage} />

            {/* Button */}
            <button
              className="w-full py-3 px-4 bg-secondary text-white font-medium rounded-lg shadow-md 
                         hover:bg-secondary/90 transition-all duration-200 disabled:opacity-50"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? <Loader className="w-6 h-6 animate-spin mx-auto" /> : "Sign In"}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors duration-200"
            >
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
