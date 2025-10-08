"use client";

import React, { useState } from "react";

import { useSearchParams, useNavigate } from "react-router-dom";

import { User, Clock, Shield, Database } from "lucide-react";
import ChurchHoursSettings from ".././../components/common/availability/ChurchHoursSettings";
import AdminProfile from "../../components/section/AdminProfile";
import AdminSecuritySettings from "../../components/section/AdminSecuritySettings";


export default function SettingsPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const active = searchParams.get("tab") || "church_hours";

    const setActive = (key) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set("tab", key);
        navigate({ search: newParams.toString() }, { replace: true });
    };

    const navItems = [
        { key: "personal_info", label: "Personal Info", icon: User },
        { key: "church_hours", label: "Working Hours", icon: Clock },
        { key: "backup", label: "Backup & Restore", icon: Database },
        { key: "security", label: "Security", icon: Shield },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-900">Settings</h1>
                <p className="text-xs md:text-sm text-gray-500 mt-1">
                    Manage your account preferences, working hours, and other options
                </p>
            </div>

            {/* Layout: Sidebar + Content */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Sidebar */}
                <div className="p-2 md:col-span-1">
                    <nav className="flex flex-col text-sm">
                        {navItems.map((item) => {
                            const isActive = active === item.key;
                            return (
                                <button
                                    key={item.key}
                                    onClick={() => setActive(item.key)}
                                    className={`flex items-center gap-2 px-2 py-2 border-l-2 transition-colors ${isActive
                                        ? "text-gray-900 font-medium border-gray-400"
                                        : "text-gray-500 hover:text-gray-700 border-transparent"
                                        }`}
                                >
                                    <item.icon className="h-4 w-4 shrink-0" />
                                    {item.label}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Content */}
                <div className="md:col-span-3 space-y-6">
                    {active === "personal_info" && <AdminProfile />}

                    {active === "church_hours" && <ChurchHoursSettings />}

                    {active === "backup" && (
                        <div className="p-4 md:p-6 border rounded-lg">
                            <h2 className="text-base font-semibold mb-3">Backup & Restore</h2>
                            <p className="text-sm text-gray-600">
                                Placeholder – manage database backups or system exports.
                            </p>
                        </div>
                    )}

                    {active === "security" && <AdminSecuritySettings />}

                </div>
            </div>
        </div>
    );
}