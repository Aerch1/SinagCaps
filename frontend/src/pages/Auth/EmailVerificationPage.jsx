// src/pages/auth/EmailVerificationPage.jsx
"use client";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore.js";
import toast from "react-hot-toast";
import ErrorAlert from "../../components/ErrorAlert.jsx";
import SuccessAlert from "../../components/SuccessAlert.jsx";

const EmailVerificationPage = () => {
    const [code, setCode] = useState(["", "", "", "", "", ""]);
    const inputRefs = useRef([]);
    const attemptedCodeRef = useRef(null);  // remembers last submitted code
    const submittingRef = useRef(false);    // prevents double submits

    const navigate = useNavigate();
    const { error, isLoading, verifyEmail, message, clearError, clearMessage } = useAuthStore();

    const handleChange = (index, value) => {
        clearError();
        const onlyDigits = value.replace(/\D/g, "");
        attemptedCodeRef.current = null; // allow new attempt

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

    const handleFocus = () => {
        // touching any box should clear the global error UI
        if (error) clearError();
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
            // store/ErrorAlert already shows server error
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

    // Auto-submit once when all 6 digits filled and it's a new value
    useEffect(() => {
        const codeStr = code.join("");
        const allFilled = codeStr.length === 6;
        if (!isLoading && allFilled && codeStr !== attemptedCodeRef.current) {
            submitCode(codeStr);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [code, isLoading]);

    const boxBase =
        "w-12 h-12 text-center text-2xl font-bold bg-gray-700 text-white border-2 rounded-lg outline-none transition";
    const boxIdle = "border-gray-600 focus:border-[#710000] focus:ring-2 focus:ring-[#710000]/40";
    const boxError =
        "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/30";

    const useErrorStyle = Boolean(error) && attemptedCodeRef.current === code.join("");

    return (

        <div className="min-h-screen bg-[url('/forgot.jpg')] bg-cover bg-center flex items-center justify-center p-2 sm:p-4">
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="max-w-md w-full bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden">
                <div className="p-8">
                    <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-[#710000] to-[#500000] text-transparent bg-clip-text">
                        Verify Your Email
                    </h2>
                    <p className="text-center text-gray-300 mb-6">
                        Enter the 6-digit code sent to your email address.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                        <div className="flex justify-between">
                            {code.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={(el) => (inputRefs.current[index] = el)}
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    autoComplete="one-time-code"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleChange(index, e.target.value)}
                                    onFocus={handleFocus}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    className={`${boxBase} ${useErrorStyle ? boxError : boxIdle}`}
                                />
                            ))}
                        </div>

                        <ErrorAlert error={error} onClose={clearError} />
                        <SuccessAlert message={message} onClose={clearMessage} />

                        <button
                            type="submit"
                            disabled={
                                isLoading ||
                                code.some((d) => !d) ||
                                code.join("") === attemptedCodeRef.current
                            }
                            className="w-full bg-gradient-to-r from-[#710000] to-[#500000] text-white font-medium py-3 px-4 rounded-lg shadow-lg hover:from-[#600000] hover:to-[#400000] focus:outline-none focus:ring-2 focus:ring-[#710000] focus:ring-offset-2 focus:ring-offset-gray-800 transition disabled:opacity-50"
                        >
                            {isLoading ? "Verifying..." : "Verify Email"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EmailVerificationPage;
