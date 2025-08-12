// src/pages/auth/ForgotPasswordPage.jsx
"use client";
import { useState } from "react";
import { useAuthStore } from "../../store/authStore.js";
import Input from "../../components/input.jsx";
import { ArrowLeft, Loader, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import ErrorAlert from "../../components/ErrorAlert.jsx";
import SuccessAlert from "../../components/SuccessAlert.jsx";
import { validateForgotPassword } from "../../../../shared/validation.js";

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState("");
    const [emailErr, setEmailErr] = useState("");
    const [isSubmitted, setIsSubmitted] = useState(false);

    const { isLoading, forgotPassword, error, message, clearError, clearMessage } =
        useAuthStore();

    const handleSubmit = async (e) => {
        e.preventDefault();

        // client-side check first (uses your shared rules)
        setEmailErr("");
        const v = validateForgotPassword({ email });
        if (!v.ok) {
            setEmailErr(v.message);
            return;
        }

        // server call; server errors still surface in <ErrorAlert />
        const ok = await forgotPassword(email);
        if (!ok) return;
        setIsSubmitted(true);
    };

    return (
        <div className="min-h-screen bg-[url('/forgot.jpg')] bg-cover bg-center flex items-center justify-center p-2 sm:p-4">
            <div className="absolute inset-0 bg-black/20"></div>

            <div className="max-w-md w-full bg-gray-800/95 backdrop-blur-xl rounded-lg shadow-2xl overflow-hidden">
                <div className="p-6 sm:p-8">
                    <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-center text-white">
                        Forgot Password
                    </h2>

                    {!isSubmitted ? (
                        <form onSubmit={handleSubmit} noValidate>
                            <p className="text-gray-300 mb-6 text-center">
                                Enter your email address and we’ll send you a link to reset your password.
                            </p>

                            <Input
                                icon={Mail}
                                type="email"
                                placeholder="Email Address"
                                value={email}
                                error={emailErr}
                                onChange={(e) => setEmail(e.target.value)}
                                onFocus={() => {
                                    // clear inline + global error when typing again
                                    if (emailErr) setEmailErr("");
                                    if (error) clearError();
                                }}
                                autoComplete="email"
                                // theme override to match your burgundy focus color
                                className="focus:border-[#710000] focus:ring-2 focus:ring-[#710000]/40"
                            />

                            <ErrorAlert error={error} onClose={clearError} />

                            <button
                                className="w-full py-3 px-4 bg-gradient-to-r from-[#710000] to-[#500000] text-white font-medium rounded-lg shadow-lg hover:from-[#600000] hover:to-[#400000] focus:outline-none focus:ring-2 focus:ring-[#710000] focus:ring-offset-2 focus:ring-offset-gray-800 transition-all duration-200 disabled:opacity-50"
                                type="submit"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <Loader className="w-6 h-6 animate-spin mx-auto" />
                                ) : (
                                    "Send Reset Link"
                                )}
                            </button>
                        </form>
                    ) : (
                        <div className="text-center">
                            <div className="w-16 h-16 bg-[#710000] rounded-full flex items-center justify-center mx-auto mb-4">
                                <Mail className="h-8 w-8 text-white" />
                            </div>
                            <SuccessAlert message={message} onClose={clearMessage} />
                        </div>
                    )}
                </div>

                <div className="px-6 sm:px-8 py-4 bg-gray-900/60 flex justify-center">
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

export default ForgotPasswordPage;
