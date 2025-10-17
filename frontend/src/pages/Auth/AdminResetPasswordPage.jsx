"use client";

import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Lock, Save } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/api/api";

export default function AdminResetPasswordPage() {
    const { token } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        newPassword: "",
        confirmPassword: "",
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.newPassword || !formData.confirmPassword)
            return toast.error("Please fill in both fields");
        if (formData.newPassword.length < 6)
            return toast.error("Password must be at least 6 characters");
        if (formData.newPassword !== formData.confirmPassword)
            return toast.error("Passwords do not match");

        try {
            setLoading(true);
            const res = await api.post(`/admin/security/reset-password/${token}`, {
                newPassword: formData.newPassword,
                confirmPassword: formData.confirmPassword,
            });

            if (res.data.success) {
                toast.success("Password reset successful! Please log in again.");
                setTimeout(() => navigate("/login"), 1500);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Reset failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center bg-cover bg-center bg-no-repeat px-4"
            style={{ backgroundImage: "url('/bg.jpg')" }}
        >
            {/* Header */}
            <div className="mb-8 text-center">
                <h1 className="text-2xl font-bold text-blue-800">Admin Password Reset</h1>
                <p className="text-sm text-gray-600 mt-1">
                    Securely create a new password for your admin account
                </p>
            </div>

            {/* Card */}
            <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-6 sm:p-8 border border-gray-100">
                <div className="flex flex-col items-center mb-6">
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                        <Lock className="h-6 w-6 text-blue-600" />
                    </div>
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                        Reset Admin Password
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1 text-center">
                        Enter your new password below.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            New Password
                        </label>
                        <input
                            type="password"
                            name="newPassword"
                            value={formData.newPassword}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter new password"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Confirm new password"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 text-sm font-medium transition disabled:opacity-50"
                    >
                        {loading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        {loading ? "Updating..." : "Reset Password"}
                    </button>
                </form>
            </div>

            {/* Footer */}
            <p className="text-xs text-gray-500 mt-8">
                &copy; {new Date().getFullYear()} Our Lady of Peace Parish Admin Portal
            </p>
        </div>
    );
}
