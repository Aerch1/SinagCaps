"use client";

import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import DataTable from "../../components/common/DataTable";
import ViewAppointmentModal from "../../components/common/modal/ViewAppointmentModal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";

export default function AppointmentsPage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // ✅ Status comes from URL
    const status = searchParams.get("status") || "all";

    // Modal state
    const [viewOpen, setViewOpen] = useState(false);
    const [viewAppt, setViewAppt] = useState(null);

    const tabs = [
        { key: "all", label: "All Transactions" },
        { key: "pending", label: "Pending" },
        { key: "approved", label: "Approved" },
        { key: "completed", label: "Completed" },
    ];

    // ✅ Tab changes update query param
    const handleTabChange = (newStatus) => {
        const newParams = new URLSearchParams(searchParams);
        if (newStatus === "all") {
            newParams.delete("status");
        } else {
            newParams.set("status", newStatus);
        }
        newParams.delete("page"); // reset pagination on filter change
        setSearchParams(newParams, { replace: true });
    };

    return (
        <div className="space-y-4 md:space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-3 md:gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100">
                        Appointments
                    </h1>
                    <p className="text-xs md:text-sm text-gray-500 dark:text-slate-400 mt-1">
                        View, filter, and manage appointment requests
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        onClick={() => navigate("/admin/calendar")}
                        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                    >
                        <Plus size={16} />
                        New Appointment
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200 dark:border-slate-700">
                <div className="flex flex-wrap gap-1">
                    {tabs.map((t) => {
                        const active = status === t.key || (t.key === "all" && !searchParams.get("status"));
                        return (
                            <button
                                key={t.key}
                                onClick={() => handleTabChange(t.key)}
                                className={`relative px-3 py-2 text-sm font-medium transition-colors duration-200
                  ${active
                                        ? "text-red-600 dark:text-red-400 border-b-2 border-red-600"
                                        : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800"
                                    }`}
                            >
                                <span>{t.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Table */}
            <DataTable
                initialPageSize={10}
                activeTab={status} // 👈 pass tab value here (all/pending/approved/completed)

                onView={(row) => {
                    setViewAppt(row);
                    setViewOpen(true);
                }}
                onEdit={(r) => {
                    console.log("edit", r);
                    // Handle edit action
                }}
                onDelete={(r) => {
                    console.log("delete", r);
                    // Handle delete action
                }}
            />

            {/* Modal */}
            <ViewAppointmentModal
                isOpen={viewOpen}
                onClose={() => setViewOpen(false)}
                appointment={viewAppt}
                onUpdate={(updated) => {
                    toast.success("Appointment updated");
                    setViewOpen(false);
                    // Optionally refresh the table data here
                }}
            />
        </div>
    );
}
