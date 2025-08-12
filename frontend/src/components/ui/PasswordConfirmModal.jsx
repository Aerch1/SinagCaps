"use client";
import { useEffect, useState } from "react";
import { Eye, EyeOff, X, AlertCircle } from "lucide-react";

function maskEmail(email = "") {
    const [user, domain] = email.split("@");
    if (!user || !domain) return email;
    const keep = Math.min(5, Math.max(2, Math.ceil(user.length / 3)));
    const maskedUser = user.slice(0, keep) + "*".repeat(Math.max(4, user.length - keep));
    const parts = domain.split(".");
    const first = parts.shift() || "";
    const maskedFirst = first.slice(0, 1) + "*".repeat(Math.max(3, first.length - 1));
    return `${maskedUser}@${maskedFirst}.${parts.join(".")}`;
}

export default function PasswordConfirmModal({
    open,
    email,
    onClose,
    onSubmit,
    loading = false,
    error,
    onClearError,
}) {
    const [password, setPassword] = useState("");
    const [show, setShow] = useState(false);
    const hasError = Boolean(error);

    // Reset when opening, or when email changes
    useEffect(() => {
        if (open) {
            setPassword("");
            setShow(false);
            
        }
    }, [open, email]);

    if (!open) return null;

    const canOk = password.length > 0 && !loading;
    const base = "w-full rounded-md border px-4 py-3 pr-11 text-gray-900 placeholder:text-gray-400 outline-none transition";
    const ok = "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
    const err = "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-100";

    const handleClose = () => {
        setPassword("");
        onClearError?.();
        onClose?.();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <button className="absolute inset-0 bg-black/40" onClick={handleClose} aria-hidden="true" />
            <div className="relative w-[92%] max-w-md rounded-2xl bg-white shadow-2xl">
                <button className="absolute right-3 top-3 text-gray-400 hover:text-gray-600" onClick={handleClose} aria-label="Close">
                    <X className="h-5 w-5" />
                </button>

                <div className="px-6 pt-6 pb-4">
                    <h2 className="text-2xl font-semibold text-gray-900 text-center">Enter password</h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Enter the password for your account ({maskEmail(email)})
                    </p>

                    <div className="mt-5">
                        <div className="relative">
                            <input
                                id="reauth-password"
                                type={show ? "text" : "password"}
                                placeholder="Password"
                                value={password}
                                onChange={(e) => { if (hasError) onClearError?.(); setPassword(e.target.value); }}
                                autoComplete="current-password"
                                aria-invalid={hasError ? "true" : "false"}
                                className={`${base} ${hasError ? err : ok}`}
                                autoFocus
                                onKeyDown={(e) => { if (e.key === "Enter" && canOk) onSubmit?.(password); }}
                            />
                            <button
                                type="button"
                                onClick={() => setShow((s) => !s)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                aria-label={show ? "Hide password" : "Show password"}
                            >
                                {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>

                        {hasError && (
                            <div className="mt-2 flex items-start text-sm text-red-600">
                                <AlertCircle className="h-4 w-4 mr-1 mt-0.5" />
                                <span>{error}</span>
                            </div>
                        )}
                    </div>

                    <div className="mt-3 text-center">
                        <a href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700">
                            Forgot password?
                        </a>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 px-6 pb-6">
                    <button onClick={handleClose} className="rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 font-medium">
                        CANCEL
                    </button>
                    <button
                        disabled={!canOk}
                        onClick={() => onSubmit?.(password)}
                        className={`rounded-lg py-3 font-medium ${canOk ? "bg-secondary/90 text-white hover:bg-secondary cursor-pointer" : "bg-secondary/50 text-white cursor-not-allowed"}`}
                    >
                        {loading ? "Please wait…" : "OK"}
                    </button>
                </div>
            </div>
        </div>
    );
}
