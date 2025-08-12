"use client";
import { useEffect, useState } from "react";
import { Eye, EyeOff, X, AlertCircle, ShieldAlert } from "lucide-react";

export default function DeleteAccountModal({
    open,
    onClose,
    onSubmit,          // async ({ password }) => { ok, field?, message? }
    loading = false,
    email,             // optional: show which account will be deleted
}) {
    const [password, setPassword] = useState("");
    const [confirmText, setConfirmText] = useState("");
    const [show, setShow] = useState(false);

    const [pwdErr, setPwdErr] = useState("");
    const [confErr, setConfErr] = useState("");

    useEffect(() => {
        if (open) {
            setPassword("");
            setConfirmText("");
            setShow(false);
            setPwdErr("");
            setConfErr("");
        }
    }, [open]);

    if (!open) return null;

    const base = "w-full rounded-md border px-4 py-3 pr-11 text-gray-900 placeholder:text-gray-400 outline-none transition";
    const ok = "border-gray-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-100";
    const err = "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-100";

    const canOk = password.length > 0 && confirmText === "DELETE" && !loading;

    const handleSubmit = async () => {
        // client-side checks
        setPwdErr(""); setConfErr("");
        if (confirmText !== "DELETE") {
            setConfErr('Please type "DELETE" to confirm.');
            return;
        }
        const res = await onSubmit?.({ password });
        if (res && !res.ok) {
            if (res.field === "password") setPwdErr(res.message || "Incorrect password.");
            else setConfErr(res.message || "Unable to delete account.");
        }
    };

    const handleClose = () => onClose?.();

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center">
            <button className="absolute inset-0 bg-black/40" onClick={handleClose} aria-hidden="true" />
            <div className="relative w-[92%] max-w-lg rounded-2xl bg-white shadow-2xl">
                <button className="absolute right-3 top-3 text-gray-400 hover:text-gray-600" onClick={handleClose} aria-label="Close">
                    <X className="h-5 w-5" />
                </button>

                <div className="px-6 pt-6 pb-4">
                    <div className="flex items-center justify-center">
                        <ShieldAlert className="h-8 w-8 text-rose-600" />
                    </div>
                    <h2 className="mt-2 text-2xl font-semibold text-center text-gray-900">Delete account</h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        This will permanently delete your account{email ? ` (${email})` : ""} and all related data. This action cannot be undone.
                    </p>

                    {/* Password */}
                    <div className="mt-6">
                        <div className="relative">
                            <input
                                type={show ? "text" : "password"}
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); setPwdErr(""); }}
                                autoComplete="current-password"
                                aria-invalid={pwdErr ? "true" : "false"}
                                className={`${base} ${pwdErr ? err : ok}`}
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
                        {pwdErr && (
                            <div className="mt-2 flex items-start text-sm text-red-600">
                                <AlertCircle className="h-4 w-4 mr-1 mt-0.5" />
                                <span>{pwdErr}</span>
                            </div>
                        )}
                    </div>

                    {/* Type DELETE */}
                    <div className="mt-4">
                        <input
                            type="text"
                            placeholder='Type "DELETE" to confirm'
                            value={confirmText}
                            onChange={(e) => { setConfirmText(e.target.value); setConfErr(""); }}
                            aria-invalid={confErr ? "true" : "false"}
                            className={`${base} ${confErr ? err : ok}`}
                        />
                        {confErr && (
                            <div className="mt-2 flex items-start text-sm text-red-600">
                                <AlertCircle className="h-4 w-4 mr-1 mt-0.5" />
                                <span>{confErr}</span>
                            </div>
                        )}
                    </div>

                    <p className="mt-3 text-xs text-gray-500 text-center">
                        You can’t recover your data after deletion.
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-3 px-6 pb-6">
                    <button
                        onClick={handleClose}
                        className="rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 font-medium"
                    >
                        CANCEL
                    </button>
                    <button
                        disabled={!canOk}
                        onClick={handleSubmit}
                        className={`rounded-lg py-3 font-medium ${canOk ? "bg-rose-600 text-white hover:bg-rose-700" : "bg-rose-300 text-white cursor-not-allowed"}`}
                    >
                        {loading ? "Deleting…" : "DELETE"}
                    </button>
                </div>
            </div>
        </div>
    );
}
