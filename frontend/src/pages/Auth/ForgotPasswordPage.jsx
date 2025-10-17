"use client";
import { useState } from "react";
import { useAuthStore } from "../../store/authStore.js";
import Input from "../../components/ui/Input.jsx";
import { ArrowLeft, Loader, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import ErrorAlert from "../../components/common/ErrorAlert.jsx";
import SuccessAlert from "../../components/common/SuccessAlert.jsx";
import { validateForgotPassword } from "../../shared/validation.js";

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState("");
    const [emailErr, setEmailErr] = useState("");
    const [isSubmitted, setIsSubmitted] = useState(false);

    const { isLoading, forgotPassword, error, message, clearError, clearMessage } =
        useAuthStore();

    const handleSubmit = async (e) => {
        e.preventDefault();

        setEmailErr("");
        const v = validateForgotPassword({ email });
        if (!v.ok) {
            setEmailErr(v.message);
            return;
        }

        const ok = await forgotPassword(email);
        if (!ok) return;
        setIsSubmitted(true);
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat px-4"
            style={{ backgroundImage: "url('/bg.jpg')" }}
        >            <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6 sm:p-8">
                <div className="flex justify-center mb-6">
                    <img src="/logo.png" alt="OLOPGV Logo" className="w-14 h-14 sm:w-16 sm:h-16" />
                </div>

                <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-center text-gray-900">
                    Forgot Password
                </h2>

                {!isSubmitted ? (
                    <form onSubmit={handleSubmit} noValidate>
                        <p className="text-gray-600 mb-6 text-center">
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
                                if (emailErr) setEmailErr("");
                                if (error) clearError();
                            }}
                            autoComplete="email"
                        />

                        <ErrorAlert error={error} onClose={clearError} />

                        <button
                            className="w-full mt-4 py-3 px-4 bg-secondary text-white font-medium rounded-lg shadow-md 
                         hover:bg-secondary/90 transition-all duration-200 disabled:opacity-50"
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
                        <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                            <Mail className="h-8 w-8 text-white" />
                        </div>
                        <SuccessAlert message={message} onClose={clearMessage} />
                    </div>
                )}

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

export default ForgotPasswordPage;
