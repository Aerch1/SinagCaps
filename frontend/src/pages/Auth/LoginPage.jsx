// src/pages/auth/LoginPage.jsx
"use client";
import { useState, useEffect } from "react";
import { Mail, Lock, Loader } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Input from "../../components/input.jsx";
import toast from "react-hot-toast";
import { useAuthStore } from "../../store/authStore.js";
import ErrorAlert from "../../components/ErrorAlert.jsx";
import SuccessAlert from "../../components/SuccessAlert.jsx";
import { validateLogin } from "../../../../shared/validation.js";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // inline field errors
  const [emailErr, setEmailErr] = useState("");
  const [passErr, setPassErr] = useState("");

  const navigate = useNavigate();
  const { login, isLoading, error, message, clearError, clearMessage, clearAll } = useAuthStore();

  useEffect(() => {
    clearAll();
  }, [clearAll]);

  const setFieldErrorFromMessage = (msg) => {
    if (/password/i.test(msg)) {
      setPassErr(msg);
      setEmailErr("");
    } else {
      setEmailErr(msg);
      setPassErr("");
    }
  };

  const prevalidate = () => {
    const v = validateLogin({ email, password });
    if (!v.ok) {
      setFieldErrorFromMessage(v.message);
      return false;
    }
    setEmailErr("");
    setPassErr("");
    return true;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!prevalidate()) return;

    try {
      const user = await login(email, password);
      if (user) navigate(user.role === "admin" ? "/admin" : "/");
      toast.success("Login Successfully");

    } catch {/* server error already handled by store */ }
  };

  return (
    <div className="min-h-screen bg-[url('/forgot.jpg')] bg-cover bg-center flex items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 bg-black/20"></div>
      <div className="w-full max-w-sm sm:max-w-md md:max-w-4xl bg-gray-800 bg-opacity-95 backdrop-filter backdrop-blur-xl rounded-lg shadow-2xl overflow-hidden">
        <div className="flex flex-col md:flex-row min-h-[500px] md:min-h-[550px]">

          {/* Left Side */}
          <div className="hidden md:flex md:w-1/2 relative overflow-hidden bg-[url('/church.jpg')] bg-cover bg-center">
            {/* dark overlay */}
            <div className="absolute inset-0 bg-black/22"></div>
            {/* content above the overlay */}
            <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col items-center justify-end p-8 text-white">

              <h1 className="text-3xl lg:text-4xl font-bold text-center mb-4">Welcome Back</h1>
              <p className="text-lg lg:text-xl text-center text-gray-200 leading-relaxed">
                Access your OLOPGV account to continue your academic journey
              </p>

            </div>
          </div>

          {/* Right Side */}
          <div className="w-full md:w-1/2 flex flex-col min-h-[500px] md:min-h-auto">
            <div className="flex-1 p-6 sm:p-8 md:p-8 flex flex-col justify-center">
              <div className="flex justify-center mb-2">


                <img src="/logo.png" alt="OLOPGV Logo" className="w-16 h-16 sm:w-20 sm:h-20" />
              </div>

              <div className="mb-6 sm:mb-8">
                <h2 className="text-2xl sm:text-3xl text-center font-bold mb-2 text-white">OLOPGV LOGIN</h2>
                <p className="text-gray-400 text-sm text-center">
                  Please enter your credentials to access your account
                </p>
              </div>

              <form onSubmit={handleLogin} noValidate className="space-y-4 sm:space-y-6">
                <Input
                  icon={Mail}
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => { setEmailErr(""); clearError(); }}
                  autoComplete="email"
                  error={emailErr}
                />

                <Input
                  icon={Lock}
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => { setPassErr(""); clearError(); }}
                  autoComplete="current-password"
                  error={passErr}
                />

                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <Link
                    to="/forgot-password"
                    className="text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors duration-200"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Server messages (wrong creds / unverified) */}
                <ErrorAlert error={error} onClose={clearError} />
                <SuccessAlert message={message} onClose={clearMessage} />

                <button
                  className="w-full py-3 px-4 bg-gradient-to-r from-[#710000] to-[#500000] text-white font-medium rounded-lg shadow-lg hover:from-[#600000] hover:to-[#400000] focus:outline-none focus:ring-2 focus:ring-[#710000] focus:ring-offset-2 focus:ring-offset-gray-800 transition-all duration-200 disabled:opacity-50 transform hover:scale-[1.02]"
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? <Loader className="w-6 h-6 animate-spin mx-auto" /> : "Sign In"}
                </button>
              </form>
            </div>

            <div className="px-6 sm:px-8 md:px-12 py-4 sm:py-6 bg-gray-900 bg-opacity-50 border-t border-gray-700">
              <p className="text-sm text-gray-400 text-center">
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
      </div>
    </div>
  );
};

export default LoginPage;
