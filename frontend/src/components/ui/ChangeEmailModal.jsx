"use client";
import { useEffect, useState } from "react";
import { X, AlertCircle, Mail, Hash } from "lucide-react";

export default function ChangeEmailModal({
    open,
    onClose,
    onSendCode,
    onSubmit,
    sending = false,
    loading = false,
    emailError,
    codeError,
    onClearEmailError,
    onClearCodeError,
    initialEmail = "",
}) {
    const [email, setEmail] = useState(initialEmail || "");
    const [code, setCode] = useState("");

    // Reset when opening and whenever initialEmail changes while open
    useEffect(() => {
        if (open) {
            setEmail(initialEmail || "");
            setCode("");

        }
    }, [open, initialEmail]);

    if (!open) return null;

    const base = "w-full rounded-md border px-4 py-3 text-gray-900 placeholder:text-gray-400 outline-none transition";
    const ok = "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
    const err = "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-100";

    const canSend = email.length > 3 && !sending && !loading;
    const canOk = email.length > 3 && code.length > 0 && !loading;

    const handleClose = () => {
        setEmail(initialEmail || "");
        setCode("");
        onClearEmailError?.();
        onClearCodeError?.();
        onClose?.();
    }

    return (
        <div className="fixed inset-0 z-[101] flex items-center justify-center">
            <button className="absolute inset-0 bg-black/40" onClick={handleClose} aria-hidden="true" />
            <div className="relative w-[92%] max-w-lg rounded-2xl bg-white shadow-2xl">
                <button className="absolute right-3 top-3 text-gray-400 hover:text-gray-600" onClick={handleClose} aria-label="Close">
                    <X className="h-5 w-5" />
                </button>

                <div className="px-6 pt-6 pb-4">
                    <h2 className="text-2xl font-semibold text-gray-900 text-center">Change email</h2>
                    <p className="mt-2 text-center text-sm text-gray-600">Enter your new email and the verification code we send to it.</p>

                    {/* New Email */}
                    <div className="mt-5">
                        <div className="relative">
                            <input
                                id="new-email"
                                type="email"
                                placeholder="you@newmail.com"
                                value={email}
                                onChange={(e) => { if (emailError) onClearEmailError?.(); setEmail(e.target.value); }}
                                autoComplete="email"
                                aria-invalid={emailError ? "true" : "false"}
                                className={`${base} pr-11 ${emailError ? err : ok}`}
                                autoFocus
                            />
                            <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                        </div>
                        {emailError && (
                            <div className="mt-2 flex items-start text-sm text-red-600">
                                <AlertCircle className="h-4 w-4 mr-1 mt-0.5" />
                                <span>{emailError}</span>
                            </div>
                        )}

                        <div className="mt-3">
                            <button
                                type="button"
                                disabled={!canSend}
                                onClick={() => onSendCode?.(email)}
                                className={`w-full rounded-lg py-3 font-medium ${canSend ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-blue-300 text-white"}`}
                            >
                                {sending ? "Sending code…" : "Send verification code"}
                            </button>
                        </div>
                    </div>

                    {/* Code */}
                    <div className="mt-4">
                        <div className="relative">
                            <input
                                id="verify-code"
                                type="text"
                                inputMode="numeric"
                                placeholder="Enter 6-digit code"
                                value={code}
                                onChange={(e) => {
                                    if (codeError) onClearCodeError?.();
                                    const digits = e.target.value.replace(/\D/g, "").slice(0, 6);
                                    setCode(digits);
                                }}
                                aria-invalid={codeError ? "true" : "false"}
                                className={`${base} pr-11 ${codeError ? err : ok}`}
                                autoComplete="one-time-code"
                                onKeyDown={(e) => { if (e.key === "Enter" && canOk) onSubmit?.({ email, code }); }}
                            />
                            <Hash className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                        </div>
                        {codeError && (
                            <div className="mt-2 flex items-start text-sm text-red-600">
                                <AlertCircle className="h-4 w-4 mr-1 mt-0.5" />
                                <span>{codeError}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 px-6 pb-6">
                    <button onClick={handleClose} className="rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 font-medium">
                        CANCEL
                    </button>
                    <button
                        disabled={!canOk}
                        onClick={() => onSubmit?.({ email, code })}
                        className={`rounded-lg py-3 font-medium ${canOk ? "bg-secondary/90 text-white hover:bg-secondary cursor-pointer" : "bg-secondary/50 text-white cursor-not-allowed"}`}
                    >
                        {loading ? "Please wait…" : "OK"}
                    </button>
                </div>
            </div>
        </div>
    );
}
