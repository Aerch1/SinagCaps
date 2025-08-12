"use client";
import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, X, AlertCircle } from "lucide-react";
import PasswordStrengthMeter from "../PasswordStrengthMeter.jsx";

export default function ResetPasswordModal({
  open,
  onClose,
  onSubmit,     // ({ current, next }) -> returns { ok, field?, message? }
  loading = false,
}) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");

  // error placement
  const [oldErr, setOldErr] = useState("");    // under current password
  const [pairErr, setPairErr] = useState("");  // all new/confirm errors under confirm
  const [newHasErr, setNewHasErr] = useState(false);
  const [conHasErr, setConHasErr] = useState(false);

  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showCon, setShowCon] = useState(false);

  const oldRef = useRef(null);

  useEffect(() => {
    if (open) {
      setCurrent(""); setNext(""); setConfirm("");
      setOldErr(""); setPairErr("");
      setNewHasErr(false); setConHasErr(false);
      setShowCur(false); setShowNew(false); setShowCon(false);
      setTimeout(() => oldRef.current?.focus(), 0);
    }
  }, [open]);

  if (!open) return null;

  const base = "w-full rounded-md border px-4 py-3 pr-11 text-gray-900 placeholder:text-gray-400 outline-none transition";
  const okCls = "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
  const errCls = "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-100";

  const runClientValidation = () => {
    setOldErr(""); setPairErr("");
    setNewHasErr(false); setConHasErr(false);

    let hasError = false;

    if (!current) {
      setOldErr("Enter your current password.");
      hasError = true;
    }

    if (!next || next.length < 6) {
      setPairErr("Password must be at least 6 characters.");
      setNewHasErr(true); setConHasErr(true);
      hasError = true;
    } else if (next === current) {
      setPairErr("New password cannot be the same as the current password.");
      setNewHasErr(true); setConHasErr(true);
      hasError = true;
    } else if (confirm !== next) {
      setPairErr("Passwords do not match.");
      setNewHasErr(true); setConHasErr(true);
      hasError = true;
    }

    return !hasError;
  };

  const handleSubmit = async () => {
    if (!runClientValidation()) return;
    const res = await onSubmit?.({ current, next });
    if (res && !res.ok) {
      if (res.field === "current") {
        setOldErr(res.message || "Incorrect current password.");
      } else if (res.field === "new") {
        setPairErr(res.message || "New password is invalid.");
        setNewHasErr(true); setConHasErr(true);
      } else {
        setPairErr(res.message || "Unable to change password. Try again.");
        setConHasErr(true);
      }
    }
  };

  const handleClose = () => onClose?.();

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center">
      <button className="absolute inset-0 bg-black/40" onClick={handleClose} aria-hidden="true" />
      <div className="relative w-[92%] max-w-xl rounded-2xl bg-white shadow-2xl">
        <button
          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
          onClick={handleClose}
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="px-6 pt-6 pb-4">
          <h2 className="text-3xl font-semibold text-center text-gray-900">Reset password</h2>

          {/* Current password */}
          <div className="mt-6">
            <div className="relative">
              <input
                ref={oldRef}
                type={showCur ? "text" : "password"}
                placeholder="Enter current password"
                value={current}
                onChange={(e) => { setCurrent(e.target.value); setOldErr(""); }}
                autoComplete="current-password"
                aria-invalid={oldErr ? "true" : "false"}
                className={`${base} ${oldErr ? errCls : okCls}`}
              />
              <button
                type="button"
                onClick={() => setShowCur((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                aria-label={showCur ? "Hide password" : "Show password"}
              >
                {showCur ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {oldErr && (
              <div className="mt-2 flex items-start text-sm text-red-600">
                <AlertCircle className="h-4 w-4 mr-1 mt-0.5" />
                <span>{oldErr}</span>
              </div>
            )}
          </div>

          {/* New password */}
          <div className="mt-4">
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                placeholder="Enter new password"
                value={next}
                onChange={(e) => { setNext(e.target.value); setPairErr(""); setNewHasErr(false); setConHasErr(false); }}
                autoComplete="new-password"
                aria-invalid={newHasErr ? "true" : "false"}
                className={`${base} ${newHasErr ? errCls : okCls}`}
              />
              <button
                type="button"
                onClick={() => setShowNew((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                aria-label={showNew ? "Hide password" : "Show password"}
              >
                {showNew ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Confirm new (errors render here) */}
          <div className="mt-4">
            <div className="relative">
              <input
                type={showCon ? "text" : "password"}
                placeholder="Confirm new password"
                value={confirm}
                onChange={(e) => { setConfirm(e.target.value); setPairErr(""); setNewHasErr(false); setConHasErr(false); }}
                autoComplete="new-password"
                aria-invalid={conHasErr ? "true" : "false"}
                className={`${base} ${conHasErr ? errCls : okCls}`}
              />
              <button
                type="button"
                onClick={() => setShowCon((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                aria-label={showCon ? "Hide password" : "Show password"}
              >
                {showCon ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {pairErr && (
              <div className="mt-2 flex items-start text-sm text-red-600">
                <AlertCircle className="h-4 w-4 mr-1 mt-0.5" />
                <span>{pairErr}</span>
              </div>
            )}
          </div>

          {/* Strength meter */}
          <div className="mt-4">
            <PasswordStrengthMeter password={next} />
          </div>

          <p className="mt-3 text-xs text-gray-500">
            Do not use the same password as your other accounts.
          </p>
          <div className="mt-2 text-sm">
            <a href="/forgot-password" className="text-blue-600 hover:text-blue-700">
              Forgot password?
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 px-6 pb-6">
          <button
            onClick={handleClose}
            className="rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 font-medium"
          >
            CANCEL
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`rounded-lg py-3 font-medium ${loading ? "bg-secondary/50 text-white" : "bg-secondary/90 text-white hover:bg-secondary"}`}
          >
            {loading ? "Please wait…" : "OK"}
          </button>
        </div>
      </div>
    </div>
  );
}
