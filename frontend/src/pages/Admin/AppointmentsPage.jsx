// src/pages/Admin/AppointmentsPage.jsx
"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import DataTable from "../../components/common/DataTable";
import ViewAppointmentModal from "../../components/common/modal/ViewAppointmentModal"; // ← use your existing modal
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";

const normalize = (s = "") => s.trim().toLowerCase();

// fake fetch — replace with your API
async function fetchAllAppointments() {
    return [
        {
            id: "TXN-001",
            clientName: "Shawn Robertson",
            email: "shawn@example.com",
            phone: "+63 900 111 2222",
            address: "123 Street, City",
            serviceType: "Baptism",
            status: "Approved",
            date: "2025-08-20",
            time: "09:00",
            allDay: false,
            purpose: "Baptism inquiry",
            notes: "Bring documents",
        },
        {
            id: "TXN-002",
            clientName: "Eduardo Cooper",
            email: "eduardo@example.com",
            phone: "",
            address: "",
            serviceType: "Marriage",
            status: "Completed",
            date: "2025-08-10",
            time: "14:00",
            allDay: false,
            purpose: "",
            notes: "",
        },
        {
            id: "TXN-003",
            clientName: "Marjorie Miles",
            email: "marjorie@example.com",
            phone: "",
            address: "",
            serviceType: "Document Request",
            status: "Pending",
            date: "2025-08-22",
            time: "10:30",
            allDay: false,
            purpose: "",
            notes: "",
        },
    ];
}

// optional (used by the reschedule action inside your modal)
function mockGenerateTimes(startHHmm = "08:00", endHHmm = "17:30", everyMin = 30) {
    const [sh, sm] = startHHmm.split(":").map(Number);
    const [eh, em] = endHHmm.split(":").map(Number);
    const out = []; let h = sh, m = sm;
    while (h < eh || (h === eh && m <= em)) { out.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`); m += everyMin; while (m >= 60) { m -= 60; h += 1; } }
    return out;
}
const fetchAvailableTimes = async () => mockGenerateTimes("08:00", "17:30", 30);

export default function AppointmentsPage() {
    const navigate = useNavigate();
    const [params, setParams] = useSearchParams();
    const status = useMemo(() => normalize(params.get("status") || "all"), [params]);

    // full dataset (includes all fields)
    const [allRows, setAllRows] = useState([]);
    const [loading, setLoading] = useState(true);

    // modal state
    const [viewOpen, setViewOpen] = useState(false);
    const [viewAppt, setViewAppt] = useState(null);

    useEffect(() => {
        let mounted = true;
        (async () => {
            setLoading(true);
            try {
                const data = await fetchAllAppointments();
                if (mounted) setAllRows(data);
            } finally { if (mounted) setLoading(false); }
        })();
        return () => { mounted = false; };
    }, []);

    useEffect(() => {
        if (!params.get("status")) setParams({ status: "all" }, { replace: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const tabs = [
        { key: "all", label: "All Transactions" },
        { key: "pending", label: "Pending" },
        { key: "approved", label: "Approved" },
        { key: "completed", label: "Completed" },
    ];

    const counts = useMemo(() => {
        const c = { all: allRows.length, pending: 0, approved: 0, completed: 0 };
        for (const r of allRows) {
            const s = normalize(r.status);
            if (c[s] != null) c[s] += 1;
        }
        return c;
    }, [allRows]);

    // rows shown in the table (minimal fields)
    const tableRows = useMemo(() => {
        const base = status === "all" ? allRows : allRows.filter(r => normalize(r.status) === status);
        return base.map(a => ({
            id: a.id,
            name: a.clientName,            // map → DataTable expects `name`
            email: a.email,
            serviceType: a.serviceType,
            status: a.status,
            date: a.date,
            time: a.allDay ? "" : a.time,  // keep table tidy for all-day
        }));
    }, [allRows, status]);

    // open existing modal with the FULL record
    const handleView = useCallback((row) => {
        const full = allRows.find(a => a.id === row.id) || null;
        setViewAppt(full);
        setViewOpen(!!full);
    }, [allRows]);

    // modal updates should reflect in state + close modal
    const handleUpdate = useCallback((updated) => {
        setAllRows(prev => prev.map(a => a.id === updated.id ? { ...a, ...updated } : a));
        setViewOpen(false);
    }, []);

    return (
        <div className="space-y-4 md:space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-3 md:gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100">Appointments</h1>
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
                    {tabs.map(t => {
                        const active = status === t.key;
                        return (
                            <button
                                key={t.key}
                                onClick={() => setParams({ status: t.key }, { replace: true })}
                                className={`relative px-3 py-2 text-sm font-medium transition-colors
                  ${active ? "text-red-600 dark:text-red-400" : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"}`}
                            >
                                <span>{t.label}</span>
                                <span className={`ml-2 inline-flex min-w-[22px] items-center justify-center rounded-full px-2 text-xs
                  ${active ? "bg-red-50 text-red-700 dark:bg-red-600/10 dark:text-red-300"
                                        : "bg-slate-100 text-slate-700 dark:bg-slate-700/40 dark:text-slate-300"}`}>
                                    {counts[t.key] ?? 0}
                                </span>
                                <span className={`absolute left-0 right-0 -bottom-[1px] h-[2px] ${active ? "opacity-100 bg-red-600 dark:bg-red-400" : "opacity-0"}`} />
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    Loading appointments…
                </div>
            ) : (
                <DataTable
                    rows={tableRows}
                    initialPageSize={10}
                    onView={handleView}
                    onEdit={(r) => console.log("edit", r)}
                    onDelete={(r) => console.log("delete", r)}

                    // NEW bulk actions
                    onBulkApprove={async (ids) => {
                        // call API here; mock inline:
                        setAllRows(prev => prev.map(a => ids.includes(a.id) && isPending(a.status) ? { ...a, status: "Approved" } : a))
                        toast.success(`Approved ${ids.length} appointment(s)`)
                    }}
                    onBulkComplete={async (ids) => {
                        setAllRows(prev => prev.map(a => ids.includes(a.id) && (a.status === "Approved" || a.status === "Confirmed" || a.status === "success")
                            ? { ...a, status: "Completed" } : a))
                        toast.success(`Marked completed: ${ids.length}`)
                    }}
                    onBulkCancel={async ({ ids, reason }) => {
                        setAllRows(prev => prev.map(a => ids.includes(a.id) ? { ...a, status: "Cancelled", cancelReason: reason } : a))
                        toast.success(`Cancelled ${ids.length}`)
                    }}
                    onBulkReschedule={async ({ ids, dateISO, time }) => {
                        setAllRows(prev => prev.map(a => ids.includes(a.id) && isPending(a.status)
                            ? { ...a, date: dateISO, time, status: "In Process" } : a))
                        toast.success(`Rescheduled ${ids.length}`)
                    }}
                    fetchAvailableTimes={fetchAvailableTimes}
                />
            )}

            {/* Existing modal wired up */}
            <ViewAppointmentModal
                isOpen={viewOpen}
                onClose={() => setViewOpen(false)}
                appointment={viewAppt}
                onUpdate={handleUpdate}
                fetchAvailableTimes={fetchAvailableTimes}
            />
        </div>
    );
}
