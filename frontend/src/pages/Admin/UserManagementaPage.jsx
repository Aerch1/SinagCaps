// src/pages/Admin/UserManagementPage.jsx
"use client";

import { useState } from "react";
import UserTable from "../../components/common/UserTable";
import { Button } from "@/components/ui/button";

const mockUsers = [
    {
        firstName: "Nathan",
        lastName: "McNair",
        email: "hello@nathan.com",
        status: "Mute",
        lastAccess: "Muted for 24 hours",
    },
    {
        firstName: "Kenny",
        lastName: "Campbell",
        email: "kenny@gmail.com",
        status: "Activated",
        lastAccess: "5 minutes ago",
    },
];

const mockAdmins = [
    {
        firstName: "Admin",
        lastName: "Smith",
        email: "admin@system.com",
        status: "Activated",
        lastAccess: "Active Now",
    },
];

export default function UserManagementPage() {
    const [tab, setTab] = useState("user");

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                    User & Admin
                </h1>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    Add New
                </Button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => setTab("user")}
                    className={`px-4 py-2 text-sm font-medium ${tab === "user"
                        ? "border-b-2 border-blue-600 text-blue-600"
                        : "text-gray-500 hover:text-gray-700"
                        }`}
                >
                    User
                </button>
                <button
                    onClick={() => setTab("admin")}
                    className={`px-4 py-2 text-sm font-medium ${tab === "admin"
                        ? "border-b-2 border-blue-600 text-blue-600"
                        : "text-gray-500 hover:text-gray-700"
                        }`}
                >
                    Admin
                </button>
            </div>

            {/* Table */}
            {tab === "user" ? (
                <UserTable rows={mockUsers} />
            ) : (
                <UserTable rows={mockAdmins} />
            )}
        </div>
    );
}
