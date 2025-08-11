"use client";

import { useEffect, useState } from "react";
import { User, Mail, Lock, Trash2, ChevronRight, X } from "lucide-react";
import Modal from "../../../../components/ui/Modal";
import { useAuthStore } from "../../../../store/authStore.js";

// Buttons without borders
function ActionButton({ children, onClick, variant = "default", disabled }) {
    const cls =
        variant === "danger"
            ? "text-rose-700 bg-rose-50 hover:bg-rose-100"
            : "text-gray-700 bg-gray-100 hover:bg-gray-200";
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`inline-flex items-center rounded-md w-24 justify-center px-3 py-2 text-xs font-semibold uppercase tracking-wide transition disabled:opacity-50 ${cls}`}
        >
            {children}
        </button>
    );
}

// Each row draws only a bottom border
function Row({ icon, title, description, action, rightChevron = false }) {
    return (
        <div className="flex items-center justify-between gap-6 px-6 py-6 border-b border-gray-200">
            <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                    {icon}
                </div>
                <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900">{title}</div>
                    {description ? (
                        <div className="mt-0.5 text-sm text-gray-600 truncate">
                            {description}
                        </div>
                    ) : null}
                </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
                {action}
                {rightChevron ? <ChevronRight className="h-5 w-5 text-gray-300" /> : null}
            </div>
        </div>
    );
}

export default function AccountSecurityPanel() {
    const {
        user,
        isCheckingAuth,
        isLoading,
        error,
        message,
        clearError,
        clearMessage,
        changeEmail,
        forgotPassword,
    } = useAuthStore();

    const [emailOpen, setEmailOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [newEmail, setNewEmail] = useState(user?.email || "");
    const [localNotice, setLocalNotice] = useState("");

    // 🔒 Do NOT call checkAuth here. It should run once at app startup.

    useEffect(() => {
        if (user?.email) setNewEmail(user.email);
    }, [user?.email]);

    const handleResetPassword = async () => {
        if (!user?.email) {
            clearError();
            clearMessage();
            setLocalNotice("Your account has no email on file.");
            return;
        }
        setLocalNotice("");
        try {
            await forgotPassword(user.email);
        } catch { }
    };

    const handleEmailSave = async () => {
        setLocalNotice("");
        try {
            const ok = await changeEmail(newEmail);
            if (ok) setEmailOpen(false);
        } catch { }
    };

    const handleDelete = () => {
        setDeleteOpen(false);
        setLocalNotice("Delete account is not connected yet. Backend hookup coming soon.");
    };

    // Optional: while the one-time auth check is in progress, render nothing.
    if (isCheckingAuth) return null;

    return (
        <section className="bg-white">
            <div className="max-w-4xl mx-auto py-10">
                {/* Alerts from store */}
                {error ? (
                    <div className="mx-6 mb-6 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700 flex items-start justify-between">
                        <span>{error}</span>
                        <button onClick={clearError} className="ml-4 opacity-70 hover:opacity-100">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ) : null}
                {message ? (
                    <div className="mx-6 mb-6 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700 flex items-start justify-between">
                        <span>{message}</span>
                        <button onClick={clearMessage} className="ml-4 opacity-70 hover:opacity-100">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ) : null}

                {/* Local notice */}
                {localNotice ? (
                    <div className="mx-6 mb-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-start justify-between">
                        <span>{localNotice}</span>
                        <button onClick={() => setLocalNotice("")} className="ml-4 opacity-70 hover:opacity-100">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ) : null}

                {/* Sections (only border-bottoms) */}
                <div className="overflow-hidden">
                    {/* Section header (bottom border only) */}
                    <div className="px-6 py-5 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">Login methods</h2>
                        <p className="mt-1 text-sm text-gray-600">
                            You can log in using your email address, phone number, or a supported third-party account.
                        </p>
                    </div>

                    <Row
                        icon={<User className="h-5 w-5 text-sky-600" />}
                        title="Login ID"
                        description={user?.name || "—"}
                        action={<ActionButton disabled>Change</ActionButton>}
                    />

                    <Row
                        icon={<Mail className="h-5 w-5 text-amber-600" />}
                        title="Email address"
                        description={user?.email || "—"}
                        action={<ActionButton onClick={() => setEmailOpen(true)} disabled={!user}>Change</ActionButton>}
                    />

                    {/* Security center */}
                    <div className="px-6 py-5 border-b border-gray-200 mt-6">
                        <h2 className="text-lg font-semibold text-gray-900">Security center</h2>
                        <p className="mt-1 text-sm text-gray-600">Manage your password and account safety.</p>
                    </div>

                    <Row
                        icon={<Lock className="h-5 w-5 text-amber-600" />}
                        title="Reset password"
                        description="Send a password reset link to your email."
                        action={
                            <ActionButton onClick={handleResetPassword} disabled={isLoading || !user}>
                                {isLoading ? "Sending…" : "Reset"}
                            </ActionButton>
                        }
                    />

                    <Row
                        icon={<Trash2 className="h-5 w-5 text-rose-600" />}
                        title="Delete account"
                        description="Permanently delete your account and related data."
                        action={
                            <ActionButton variant="danger" onClick={() => setDeleteOpen(true)} disabled={!user}>
                                Delete
                            </ActionButton>
                        }
                    />
                </div>
            </div>

            {/* Change Email Modal */}
            <Modal open={emailOpen} onClose={() => setEmailOpen(false)} title="Change email address">
                <div className="space-y-4">
                    <div>
                        <label className="mb-1 block text-sm text-gray-700">New email</label>
                        <input
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            type="email"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-secondary/40"
                            placeholder="you@example.com"
                        />
                    </div>
                    <div className="flex items-center justify-end gap-2">
                        <button
                            onClick={() => setEmailOpen(false)}
                            className="rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleEmailSave}
                            disabled={isLoading}
                            className="rounded-md bg-secondary px-3 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50"
                        >
                            {isLoading ? "Saving…" : "Save"}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Delete Account Modal */}
            <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete account">
                <p className="text-sm text-gray-700">
                    This will permanently delete your account and related data. Are you sure you want to continue?
                </p>
                <div className="mt-4 flex items-center justify-end gap-2">
                    <button
                        onClick={() => setDeleteOpen(false)}
                        className="rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleDelete}
                        className="rounded-md bg-rose-600 px-3 py-2 text-sm text-white hover:bg-rose-700"
                    >
                        Yes, delete
                    </button>
                </div>
            </Modal>
        </section>
    );
}
