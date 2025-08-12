"use client";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useMemo } from "react";
import SettingsSidebar from "./SettingsSidebar";

const META = [
    { match: /^\/settings\/profile/, title: "Personal information", desc: "Update your basic details and contact info." },
    { match: /^\/settings\/security/, title: "Account & security", desc: "Manage your login methods and keep your account safe." },
    { match: /^\/settings\/appointments/, title: "Appointments", desc: "View and manage your scheduled visits." },
    { match: /^\/settings\/messages/, title: "Messages", desc: "Read and reply to your conversations." },
];

export default function SettingsPage() {
    const { pathname } = useLocation();
    // const atRoot = pathname === "/settings";

    const header = useMemo(() => {
        const found = META.find(m => m.match.test(pathname));
        if (found) return found;
        // default if someone hits /settings directly
        return { title: "Account & security", desc: "Manage your login methods and keep your account safe." };
    }, [pathname]);

    return (
        <div className="min-h-[70vh] bg-white">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
                    <SettingsSidebar />
                    <main className="min-w-0">
                        {/* Dynamic title block (no borders) */}
                        <div className="mb-8">
                            <h1 className="text-2xl sm:text-3xl font-medium text-gray-900">{header.title}</h1>
                            <p className="mt-1 text-sm text-gray-600">{header.desc}</p>
                        </div>

                        {/* {atRoot ? <Navigate to="/settings/profile" replace /> : <Outlet />} */}
                        <Outlet />
                    </main>
                </div>
            </div>
        </div>
    );
}
