"use client";

import { useEffect, useState } from "react";
import { User, Mail, Shield, Calendar, Edit2, Save, X } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import api from "@/api/api";
import toast from "react-hot-toast";

export default function AdminProfile() {
    const { user, setUser } = useAuthStore();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
    });

    // 🔹 Fetch on mount
    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const res = await api.get("/admin/security/profile");
            if (res.data.success) {
                const profileData = res.data.user;
                setFormData({
                    name: profileData.name || "",
                    email: profileData.email || "",
                });
                setUser(profileData);
            }
        } catch (err) {
            console.error("Failed to fetch profile:", err);
            toast.error("Failed to load profile");
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSaveProfile = async () => {
        if (!formData.name.trim()) return toast.error("Name is required");
        if (!formData.email.trim()) return toast.error("Email is required");

        try {
            setSaving(true);
            const res = await api.patch("/admin/security/profile", {
                name: formData.name.trim(),
                email: formData.email.trim(),
            });

            if (res.data.success) {
                toast.success("Profile updated successfully 🎉");

                // 🔹 Re-fetch profile for updated UI
                await fetchProfile();

                // 🔹 Close editing mode
                setIsEditing(false);
            }
        } catch (err) {
            console.error("Failed to update profile:", err);
            toast.error(err.response?.data?.message || "Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setFormData({
            name: user?.name || "",
            email: user?.email || "",
        });
        setIsEditing(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-sm text-gray-600">Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 md:space-y-6 w-full overflow-hidden px-2 md:px-0">
           
            {/* Profile Card */}
            <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="bg-secondary px-4 md:px-6 py-6 md:py-8">
                    <div className="flex flex-col sm:flex-row items-center gap-3 md:gap-4">
                        <div className="h-16 w-16 md:h-20 md:w-20 rounded-full bg-white flex items-center justify-center shadow-lg">
                            <User className="h-8 w-8 md:h-10 md:w-10 text-secondary" />
                        </div>
                        <div className="text-center sm:text-left">
                            <h2 className="text-lg md:text-xl font-bold text-white">
                                {user?.name || "Admin User"}
                            </h2>
                            <p className="text-xs md:text-sm text-blue-100 mt-0.5">
                                {user?.email}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Info */}
                <div className="p-4 md:p-6">
                    <div className="flex items-center justify-between mb-4 md:mb-6">
                        <h3 className="text-sm md:text-base font-semibold text-gray-900">
                            Account Information
                        </h3>
                        {!isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="inline-flex items-center gap-1 md:gap-1.5 px-3 md:px-4 py-1.5 md:py-2 bg-secondary hover:bg-secondary/90 text-white rounded-lg text-xs md:text-sm font-medium transition-colors"
                            >
                                <Edit2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                Edit Profile
                            </button>
                        )}
                    </div>

                    <div className="space-y-4 md:space-y-6">
                        {/* Name */}
                        <InputField
                            label="Full Name"
                            icon={User}
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            editable={isEditing}
                        />

                        {/* Email */}
                        <InputField
                            label="Email Address"
                            icon={Mail}
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            editable={isEditing}
                        />

                        {/* Role */}
                        <DisplayField
                            label="Role"
                            icon={Shield}
                            value={user?.role?.toUpperCase() || "ADMIN"}
                            badge
                        />

                        {/* Member Since */}
                        <DisplayField
                            label="Member Since"
                            icon={Calendar}
                            value={
                                user?.created_at
                                    ? new Date(user.created_at).toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    })
                                    : "N/A"
                            }
                        />

                        {/* Buttons */}
                        {isEditing && (
                            <div className="flex justify-end gap-2 md:gap-3 pt-2 md:pt-4 border-t border-gray-200">
                                <button
                                    onClick={handleCancel}
                                    disabled={saving}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-xs md:text-sm font-medium transition-colors disabled:opacity-50"
                                >
                                    <X className="h-3.5 w-3.5 md:h-4 md:w-4" /> Cancel
                                </button>
                                <button
                                    onClick={handleSaveProfile}
                                    disabled={saving}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-secondary hover:bg-secondary/90 text-white rounded-lg text-xs md:text-sm font-medium transition-colors disabled:opacity-50"
                                >
                                    {saving ? (
                                        <>
                                            <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-3.5 w-3.5 md:h-4 md:w-4" /> Save
                                            Changes
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* Helper Components */
function InputField({ label, icon: Icon, name, value, onChange, editable }) {
    return (
        <div>
            <label className="flex items-center gap-2 text-xs md:text-sm font-medium text-gray-700 mb-1.5">
                <Icon className="h-3.5 w-3.5 text-gray-400" /> {label}
            </label>
            {editable ? (
                <input
                    type="text"
                    name={name}
                    value={value}
                    onChange={onChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            ) : (
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900">
                    {value || "Not set"}
                </div>
            )}
        </div>
    );
}

function DisplayField({ label, icon: Icon, value, badge = false }) {
    return (
        <div>
            <label className="flex items-center gap-2 text-xs md:text-sm font-medium text-gray-700 mb-1.5">
                <Icon className="h-3.5 w-3.5 text-gray-400" /> {label}
            </label>
            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900">
                {badge ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        {value}
                    </span>
                ) : (
                    value
                )}
            </div>
        </div>
    );
}
