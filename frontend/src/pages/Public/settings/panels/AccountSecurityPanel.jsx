"use client";
import { useState } from "react";
import { User, Mail, Lock, Trash2, ChevronRight } from "lucide-react";
import { useAuthStore } from "../../../../store/authStore.js";
import PasswordConfirmModal from "../../../../components/ui/PasswordConfirmModal.jsx";
import ChangeEmailModal from "../../../../components/ui/ChangeEmailModal.jsx";
import ResetPasswordModal from "../../../../components/ui/ResetPasswordModal.jsx";
import DeleteAccountModal from "../../../../components/ui/DeleteAccountModal.jsx";

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
                <div className="flex h-10 w-10 items-center justify-center rounded-full">{icon}</div>
                <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900">{title}</div>
                    {description ? <div className="mt-0.5 text-sm text-gray-600 truncate">{description}</div> : null}
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
    const { user, reauthPassword, requestEmailChange, confirmEmailChange, changePassword, deleteAccount } =
        useAuthStore();

    // password modal (for change-email)
    const [pwdOpen, setPwdOpen] = useState(false);
    const [pwdLoading, setPwdLoading] = useState(false);
    const [pwdError, setPwdError] = useState("");

    // change email modal
    const [emailOpen, setEmailOpen] = useState(false);
    const [emailLoading, setEmailLoading] = useState(false);
    const [sendingCode, setSendingCode] = useState(false);
    const [emailErr, setEmailErr] = useState("");
    const [codeErr, setCodeErr] = useState("");

    // reset password modal
    const [resetOpen, setResetOpen] = useState(false);
    const [resetBusy, setResetBusy] = useState(false);
    const [curErr, setCurErr] = useState("");
    const [newErr, setNewErr] = useState("");
    const [conErr, setConErr] = useState("");

    //delete modal
    const [delOpen, setDelOpen] = useState(false);
    const [delBusy, setDelBusy] = useState(false);

    // --- change email flow ---
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

    // --- reset password flow ---
    const handleResetSubmit = async ({ current, next, logoutOthers }) => {
        // local checks (extra UX safety)
        setCurErr("");
        setNewErr("");
        setConErr("");
        if (!current) {
            setCurErr("Enter your current password.");
            return;
        }
        if (next.length < 6) {
            setNewErr("Password must be at least 6 characters.");
            return;
        }
        // the modal already prevents mismatch, but double-check:
        // (no field here because modal already guards OK button)
        setResetBusy(true);
        const res = await changePassword(current, next, logoutOthers);
        setResetBusy(false);
        if (!res.ok) {
            if (res.field === "current") setCurErr(res.message);
            else if (res.field === "new") setNewErr(res.message);
            else setConErr(res.message);
            return;
        }
        setResetOpen(false);
    };

    return (
        <section className="bg-white">
            <div className="max-w-4xl mx-auto py-2">
                <div className="overflow-hidden">
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
                        action={<ActionButton onClick={() => setPwdOpen(true)} disabled={!user}>Change</ActionButton>}
                    />
                    <Row
                        icon={<Lock className="h-5 w-5 text-amber-600" />}
                        title="Reset password"
                        description="Set a new password for your account."
                        action={<ActionButton onClick={() => setResetOpen(true)} disabled={!user}>Reset</ActionButton>}
                    />
                    <Row
                        icon={<Trash2 className="h-5 w-5 text-rose-600" />}
                        title="Delete account"
                        description="Permanently delete your account and related data."
                        action={<ActionButton variant="danger" onClick={() => setDelOpen(true)} disabled={!user}>Delete</ActionButton>}
                    />
                </div>
            </div>

            {/* change-email password confirm */}
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

            {/* change email */}
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

            {/* reset password */}
            <ResetPasswordModal
                open={resetOpen}
                loading={resetBusy}
                onClose={() => setResetOpen(false)}
                onSubmit={async ({ current, next }) => {
                    setResetBusy(true);
                    const res = await changePassword(current, next); // no logoutOthers arg
                    setResetBusy(false);
                    if (res.ok) setResetOpen(false);
                    return res;
                }}
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
                    if (res.ok) {
                        setDelOpen(false);
                        // optional: redirect or hard refresh
                        // window.location.href = "/";
                    }
                    return res;
                }}
            />

        </section>
    );
}
