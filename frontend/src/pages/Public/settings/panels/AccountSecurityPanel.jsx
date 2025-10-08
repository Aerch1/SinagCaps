"use client";
import { useState } from "react";
import { Mail, Lock, Trash2, ChevronRight } from "lucide-react";
import { useAuthStore } from "../../../../store/authStore.js";
import PasswordConfirmModal from "../../../../components/ui/PasswordConfirmModal.jsx";
import ChangeEmailModal from "../../../../components/ui/ChangeEmailModal.jsx";
import ResetPasswordModal from "../../../../components/ui/ResetPasswordModal.jsx";
import DeleteAccountModal from "../../../../components/ui/DeleteAccountModal.jsx";

/* ==================================================
   Utility: Mask Email (e.g. archi********@g****.com)
================================================== */
function maskEmail(email) {
    if (!email || !email.includes("@")) return "********@********";
    const [local, domain] = email.split("@");
    const domainParts = domain.split(".");
    const maskedLocal =
        local.slice(0, 5) + "*".repeat(Math.max(local.length - 5, 4));
    const maskedDomain =
        domainParts[0].slice(0, 1) +
        "*".repeat(Math.max(domainParts[0].length - 1, 3)) +
        "." +
        (domainParts[1] || "com");
    return `${maskedLocal}@${maskedDomain}`;
}

/* ==================================================
   UI Components
================================================== */
function ActionButton({ children, onClick, variant = "default", disabled }) {
    const cls =
        variant === "danger"
            ? "text-red-700 bg-rose-50 hover:bg-rose-100"
            : "text-blue-500 bg-gray-200 hover:bg-gray-300 ";
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`inline-flex items-center rounded-md w-26 justify-center px-3 py-3 text-xs font-medium uppercase tracking-wide transition disabled:opacity-50 ${cls}`}
        >
            {children}
        </button>
    );
}

function Row({ icon, title, description, action, rightChevron = false }) {
    return (
        <div className="flex items-center justify-between gap-6 px-6 py-6 border-b border-gray-200">
            <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full">
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

/* ==================================================
   Main Component
================================================== */
export default function AccountSecurityPanel() {
    const {
        user,
        reauthPassword,
        requestEmailChange,
        confirmEmailChange,
        changePassword,
        deleteAccount,
    } = useAuthStore();

    // Password modal (confirm before email change)
    const [pwdOpen, setPwdOpen] = useState(false);
    const [pwdLoading, setPwdLoading] = useState(false);
    const [pwdError, setPwdError] = useState("");

    // Change email modal
    const [emailOpen, setEmailOpen] = useState(false);
    const [emailLoading, setEmailLoading] = useState(false);
    const [sendingCode, setSendingCode] = useState(false);
    const [emailErr, setEmailErr] = useState("");
    const [codeErr, setCodeErr] = useState("");

    // Reset password modal
    const [resetOpen, setResetOpen] = useState(false);
    const [resetBusy, setResetBusy] = useState(false);

    // Delete account modal
    const [delOpen, setDelOpen] = useState(false);
    const [delBusy, setDelBusy] = useState(false);

    /* ==================================================
       Change Email Flow
    ================================================== */
    const handleConfirmPassword = async (password) => {
        setPwdLoading(true);
        setPwdError("");
        const res = await reauthPassword(password);
        setPwdLoading(false);
        if (!res.ok) return setPwdError(res.message);
        setPwdOpen(false);
        setEmailOpen(true);
    };

    const handleSendCode = async (newEmail) => {
        setSendingCode(true);
        setEmailErr("");
        const res = await requestEmailChange(newEmail);
        setSendingCode(false);
        if (!res.ok) setEmailErr(res.message);
    };

    const handleConfirmEmail = async ({ email, code }) => {
        setEmailLoading(true);
        setEmailErr("");
        setCodeErr("");
        const res = await confirmEmailChange(email, code);
        setEmailLoading(false);
        if (!res.ok) {
            if (res.field === "email") setEmailErr(res.message);
            else setCodeErr(res.message);
            return;
        }
        setEmailOpen(false);
    };

    /* ==================================================
       Reset Password Flow
    ================================================== */
    const handleResetSubmit = async ({ current, next }) => {
        setResetBusy(true);
        const res = await changePassword(current, next);
        setResetBusy(false);
        if (res.ok) setResetOpen(false);
        return res;
    };

    return (
        <section className="bg-white">
            <div className="max-w-4xl mx-auto py-2">
                <div className="overflow-hidden border-gray-200">
                    {/* Email row with masked display */}
                    <Row
                        icon={<Mail className="h-5 w-5 text-amber-600" />}
                        title="Email address"
                        description={
                            user?.email
                                ? maskEmail(user.email)
                                : "No email address linked yet."
                        }
                        action={
                            <ActionButton
                                onClick={() => setPwdOpen(true)}
                                disabled={!user}
                            >
                                Change
                            </ActionButton>
                        }
                    />

                    {/* Reset password */}
                    <Row
                        icon={<Lock className="h-5 w-5 text-amber-600" />}
                        title="Reset password"
                        description="Set a new password for your account."
                        action={
                            <ActionButton
                                onClick={() => setResetOpen(true)}
                                disabled={!user}
                            >
                                Reset
                            </ActionButton>
                        }
                    />

                    {/* Delete account */}
                    <Row
                        icon={<Trash2 className="h-5 w-5 text-rose-600" />}
                        title="Delete account"
                        description="Permanently delete your account and related data."
                        action={
                            <ActionButton
                                variant="danger"
                                onClick={() => setDelOpen(true)}
                                disabled={!user}
                            >
                                Delete
                            </ActionButton>
                        }
                    />
                </div>
            </div>

            {/* Modals */}
            <PasswordConfirmModal
                open={pwdOpen}
                email={user?.email}
                loading={pwdLoading}
                error={pwdError}
                onClearError={() => setPwdError("")}
                onClose={() => {
                    setPwdOpen(false);
                    setPwdError("");
                }}
                onSubmit={handleConfirmPassword}
            />

            <ChangeEmailModal
                open={emailOpen}
                initialEmail=""
                sending={sendingCode}
                loading={emailLoading}
                emailError={emailErr}
                codeError={codeErr}
                onClearEmailError={() => setEmailErr("")}
                onClearCodeError={() => setCodeErr("")}
                onClose={() => {
                    setEmailOpen(false);
                    setEmailErr("");
                    setCodeErr("");
                }}
                onSendCode={handleSendCode}
                onSubmit={handleConfirmEmail}
            />

            <ResetPasswordModal
                open={resetOpen}
                loading={resetBusy}
                onClose={() => setResetOpen(false)}
                onSubmit={handleResetSubmit}
            />

            <DeleteAccountModal
                open={delOpen}
                email={user?.email}
                loading={delBusy}
                onClose={() => setDelOpen(false)}
                onSubmit={async ({ password }) => {
                    setDelBusy(true);
                    const res = await deleteAccount(password);
                    setDelBusy(false);
                    if (res.ok) setDelOpen(false);
                    return res;
                }}
            />
        </section>
    );
}
