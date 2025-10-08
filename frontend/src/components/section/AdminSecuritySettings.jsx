"use client";

import { useState } from "react";
import { Eye, EyeOff, Edit2, Save, X, Mail, Send } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/api/api";

export default function AdminSecuritySettings() {
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState("");
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ==============================
  // Change Password Logic
  // ==============================
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword)
      return toast.error("Current password is required");
    if (!passwordData.newPassword)
      return toast.error("New password is required");
    if (passwordData.newPassword.length < 6)
      return toast.error("New password must be at least 6 characters");
    if (passwordData.newPassword !== passwordData.confirmPassword)
      return toast.error("Passwords do not match");

    try {
      setSaving(true);
      const res = await api.patch("/admin/security/change-password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      if (res.data.success) {
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setShowPasswordSection(false);
        toast.success("Password changed successfully");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  // ==============================
  // Forgot Password Logic
  // ==============================
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email.trim()) return toast.error("Please enter your email address");
    try {
      setSaving(true);
      const res = await api.post("/admin/security/forgot-password", { email });
      toast.success(res.data.message || "Reset link sent to your email");
      setShowForgotModal(false);
      setEmail("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send reset link");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <div>
            <h3 className="text-sm md:text-base font-semibold text-gray-900">
              Security Settings
            </h3>
            <p className="text-xs md:text-sm text-gray-500 mt-0.5">
              Manage your password and security preferences
            </p>
          </div>
          {!showPasswordSection && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowForgotModal(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-xs md:text-sm font-medium transition-colors"
              >
                <Mail className="h-3.5 w-3.5 md:h-4 md:w-4" />
                Forgot Password
              </button>

              <button
                onClick={() => setShowPasswordSection(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-xs md:text-sm font-medium transition-colors"
              >
                <Edit2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                Change Password
              </button>
            </div>
          )}
        </div>

        {showPasswordSection && (
          <div className="space-y-3 md:space-y-4 border-t border-gray-200 pt-4 md:pt-6">
            <PasswordField
              label="Current Password"
              name="currentPassword"
              value={passwordData.currentPassword}
              onChange={handlePasswordChange}
              show={showCurrentPassword}
              toggleShow={() => setShowCurrentPassword(!showCurrentPassword)}
            />

            <PasswordField
              label="New Password"
              name="newPassword"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
              show={showNewPassword}
              toggleShow={() => setShowNewPassword(!showNewPassword)}
              placeholder="Enter new password (min. 6 characters)"
            />

            <PasswordField
              label="Confirm New Password"
              name="confirmPassword"
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
              show={showConfirmPassword}
              toggleShow={() => setShowConfirmPassword(!showConfirmPassword)}
            />

            {/* Actions */}
            <div className="flex justify-end gap-2 md:gap-3 pt-2 md:pt-4">
              <button
                onClick={() => {
                  setShowPasswordSection(false);
                  setPasswordData({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                  });
                }}
                disabled={saving}
                className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-xs md:text-sm font-medium transition-colors disabled:opacity-50"
              >
                <X className="h-3.5 w-3.5 md:h-4 md:w-4" /> Cancel
              </button>

              <button
                onClick={handleChangePassword}
                disabled={saving}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs md:text-sm font-medium transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    Update Password
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white w-[90%] max-w-md rounded-lg shadow-lg p-5 md:p-6">
            <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-1">
              Forgot Password
            </h2>
            <p className="text-xs md:text-sm text-gray-500 mb-4">
              Enter your email address to receive a password reset link.
            </p>

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  disabled={saving}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-xs md:text-sm font-medium transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs md:text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5 md:h-4 md:w-4" />
                      Send Reset Link
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* Helper Subcomponent */
function PasswordField({
  label,
  name,
  value,
  onChange,
  show,
  toggleShow,
  placeholder,
}) {
  return (
    <div>
      <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder || `Enter ${label.toLowerCase()}`}
          className="w-full px-3 md:px-4 py-2 md:py-2.5 pr-10 border border-gray-300 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          type="button"
          onClick={toggleShow}
          className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {show ? (
            <EyeOff className="h-4 w-4 md:h-5 md:w-5" />
          ) : (
            <Eye className="h-4 w-4 md:h-5 md:w-5" />
          )}
        </button>
      </div>
    </div>
  );
}
