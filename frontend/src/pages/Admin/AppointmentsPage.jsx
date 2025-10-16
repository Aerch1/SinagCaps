"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import DataTable from "../../components/common/DataTable";
import ViewAppointmentModal from "../../components/common/modal/ViewAppointmentModal";
import CreateAppointmentModal from "../../components/common/modal/CreateAppointmentModal";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/api/api"; // assuming you have an API helper

export default function AppointmentsPage() {
    const [searchParams, setSearchParams] = useSearchParams();

    // ✅ Status comes from URL
    const status = searchParams.get("status") || "all";

    // Modal states
    const [viewOpen, setViewOpen] = useState(false);
    const [viewAppt, setViewAppt] = useState(null);
    const [createOpen, setCreateOpen] = useState(false);

    // ✅ rows shared with DataTable
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);

    // ✅ Tabs
    const tabs = [
        { key: "all", label: "All Transactions" },
        { key: "pending", label: "Pending" },
        { key: "approved", label: "Approved" },
        { key: "completed", label: "Completed" },
        { key: "cancelled", label: "Cancelled" },
        { key: "rejected", label: "Rejected" },
        { key: "archived", label: "Archived" },
    ];

    // ✅ Fetch rows whenever status changes
    useEffect(() => {
        const fetchAppointments = async () => {
            setLoading(true);
            try {
                const res = await api.get("/admin/appointments", {
                    params: status !== "all" ? { status } : {},
                });
                setRows(res.data?.appointments || []);
            } catch (err) {
                console.error("Failed to fetch appointments", err);
                toast.error("Failed to load appointments");
            } finally {
                setLoading(false);
            }
        };

        fetchAppointments();
    }, [status]);

    // ✅ Tab changes update query param
    const handleTabChange = (newStatus) => {
        const newParams = new URLSearchParams(searchParams);
        if (newStatus === "all") {
            newParams.delete("status");
        } else {
            newParams.set("status", newStatus);
        }
        newParams.delete("page"); // reset pagination
        setSearchParams(newParams, { replace: true });
    };

    return (
        <div className="space-y-4 md:space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-3 md:gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-slate-900">
                        Appointments
                    </h1>
                    <p className="text-xs md:text-sm text-gray-500 mt-1">
                        View, filter, and manage appointment requests
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setCreateOpen(true)}
                        className="inline-flex items-center gap-2 bg-secondary hover:bg-secondary/90 text-white text-sm font-medium rounded-lg transition-colors duration-200 px-4 py-2"
                    >
                        <Plus size={16} />
                        New Appointment
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200">
                <div className="flex flex-wrap gap-1">
                    {tabs.map((t) => {
                        const active =
                            status === t.key ||
                            (t.key === "all" && !searchParams.get("status"));
                        return (
                            <button
                                key={t.key}
                                onClick={() => handleTabChange(t.key)}
                                className={`relative px-3 py-2 text-sm font-medium transition-colors duration-200
                  ${active
                                        ? "text-red-600 border-b-2 border-red-600"
                                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
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
                activeTab={status}
                rows={rows}
                setRows={setRows}
                loading={loading} // optional: show loading spinner
            />

            {/* View Modal */}
            <ViewAppointmentModal
                isOpen={viewOpen}
                onClose={() => setViewOpen(false)}
                appointment={viewAppt}
                onUpdate={(updated) => {
                    toast.success("Appointment updated");
                    setViewOpen(false);
                    setRows((prev) =>
                        prev.map((row) =>
                            row.id === updated.id ? { ...row, ...updated } : row
                        )
                    );
                }}
            />

            {/* Create Modal */}
            <CreateAppointmentModal
                isOpen={createOpen}
                onClose={() => setCreateOpen(false)}
                onSave={(newAppt) => {
                    setCreateOpen(false);
                    toast.success("Appointment created");
                    setRows((prev) => [newAppt, ...prev]);
                    window.dispatchEvent(new Event("appointmentCreated"));
                }}
            />
        </div>
    );
}
