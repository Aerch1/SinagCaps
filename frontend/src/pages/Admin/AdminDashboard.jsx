// src/pages/Admin/AdminDashboard.jsx
"use client";

import { useState, useMemo, useCallback } from "react";
import KpiCard from "../../components/common/KpiCard";
import Dropdown from "../../components/ui/Dropdown1";
import ServiceAreaChart from "../../components/common/ServiceAreaChart";
import ServiceBarChart from "../../components/common/ServiceBarChart "; // ← fixed import
import DataTable from "../../components/common/DataTable";
import ViewAppointmentModal from "../../components/common/modal/ViewAppointmentModal";

/* ---------------- helpers ---------------- */

const series = (arr) => arr.map((v, i) => ({ label: `P${i + 1}`, value: v }));

const mockKpiData = {
    Week: [
        { id: "total", title: "Total Appointments", current: 0, previous: 0, trend: series([1, 0, 0, 0, 0, 0, 0]) },
        { id: "pending", title: "Pending Appointments", current: 14, previous: 16, trend: series([18, 17, 16, 15, 14, 14, 14]) },
        { id: "today", title: "Today’s Schedule", current: 6, previous: 5, trend: series([3, 4, 5, 6, 6, 6, 6]) },
        { id: "canceled", title: "Canceled Appointments", current: 3, previous: 5, trend: series([5, 5, 4, 4, 4, 3, 3]) },
    ],
    Month: [
        { id: "total", title: "Total Appointments", current: 520, previous: 480, trend: series([380, 410, 430, 455, 489, 505, 520]) },
        { id: "pending", title: "Pending Appointments", current: 60, previous: 72, trend: series([80, 75, 70, 66, 63, 61, 60]) },
        { id: "today", title: "Today’s Schedule", current: 90, previous: 19, trend: series([10, 14, 16, 18, 19, 21, 22]) },
        { id: "canceled", title: "Canceled Appointments", current: 11, previous: 15, trend: series([15, 15, 14, 13, 12, 11, 11]) },
    ],
    Year: [
        { id: "total", title: "Total Appointments", current: 6320, previous: 5980, trend: series([4800, 5200, 5600, 5900, 6100, 6250, 6320]) },
        { id: "pending", title: "Pending Appointments", current: 180, previous: 220, trend: series([260, 240, 220, 210, 195, 185, 180]) },
        { id: "today", title: "Today’s Schedule", current: 28, previous: 24, trend: series([12, 16, 19, 21, 23, 26, 28]) },
        { id: "canceled", title: "Canceled Appointments", current: 80, previous: 96, trend: series([110, 105, 100, 95, 90, 85, 80]) },
    ],
};

// local date helpers
function ymd(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}
function ymdOffset(days = 0) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + days);
    return ymd(d);
}

// build local Date objects for modal meta
function buildStartEnd(dateISO, hhmm) {
    if (!dateISO) return { start: undefined, end: undefined };
    const [y, m, d] = dateISO.split("-").map(Number);
    if (!hhmm) {
        const start = new Date(y, m - 1, d, 0, 0, 0, 0);
        const end = new Date(y, m - 1, d + 1, 0, 0, 0, 0);
        return { start, end };
    }
    const [hh, mm] = hhmm.split(":").map(Number);
    const start = new Date(y, m - 1, d, hh, mm, 0, 0);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    return { start, end };
}

// reschedule suggestions
function mockGenerateTimes(startHHmm = "08:00", endHHmm = "17:30", everyMin = 30) {
    const [sh, sm] = startHHmm.split(":").map(Number);
    const [eh, em] = endHHmm.split(":").map(Number);
    const out = []; let h = sh, m = sm;
    while (h < eh || (h === eh && m <= em)) {
        out.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
        m += everyMin; while (m >= 60) { m -= 60; h += 1; }
    }
    return out;
}
const fetchAvailableTimes = async () => mockGenerateTimes("08:00", "17:30", 30);

/* --------- seed data (recent dates so they pass "Last 7 days") --------- */
const SEED = [
    {
        id: 1,
        clientName: "Latif L.",
        email: "latif@email.com",
        phone: "+63 900 111 2222",
        address: "123 Street, City",
        serviceType: "Wedding",
        status: "success",
        date: ymdOffset(-1),
        time: "10:30",
        allDay: false,
        purpose: "Wedding interview",
        notes: "Bring certificates.",
    },
    {
        id: 2,
        clientName: "Sherina P.",
        email: "sherina@email.com",
        phone: "",
        address: "",
        serviceType: "Counseling",
        status: "pending",
        date: ymdOffset(-2),
        time: "09:56",
        allDay: false,
        purpose: "",
        notes: "",
    },
    {
        id: 3,
        clientName: "Mykhailo M.",
        email: "mm@email.com",
        phone: "",
        address: "",
        serviceType: "Baptism",
        status: "success",
        date: ymdOffset(-3),
        time: "18:27",
        allDay: false,
        purpose: "",
        notes: "",
    },
    {
        id: 4,
        clientName: "Latif L.",
        email: "latif@email.com",
        phone: "",
        address: "",
        serviceType: "Funeral",
        status: "failed",
        date: ymdOffset(-4),
        time: "02:30",
        allDay: false,
        purpose: "",
        notes: "",
    },
    {
        id: 8,
        clientName: "Latif L.",
        email: "latif@email.com",
        phone: "",
        address: "",
        serviceType: "Funeral",
        status: "failed",
        date: ymdOffset(-5),
        time: "15:20",
        allDay: false,
        purpose: "",
        notes: "",
    },
].map((a) => ({ ...a, ...buildStartEnd(a.date, a.time) }));

/* ================== Component ================== */

export default function AdminDashboard() {
    const periodOptions = ["Week", "Month", "Year"];
    const [filter, setFilter] = useState("Month");

    // full dataset (keep here so modal can display everything)
    const [appointments, setAppointments] = useState(SEED);

    // modal state
    const [viewOpen, setViewOpen] = useState(false);
    const [viewAppt, setViewAppt] = useState(null);

    const calcChange = useCallback((current, previous) => {
        if (!previous) return 0;
        return Math.round(((current - previous) / previous) * 100);
    }, []);

    const kpis = useMemo(() => {
        const raw = mockKpiData[filter] || [];
        return raw.map((k) => ({
            id: k.id,
            title: k.title,
            value: k.current,
            change: calcChange(k.current, k.previous),
            data: k.trend,
        }));
    }, [filter, calcChange]);

    // minimal rows for the table
    const tableRows = useMemo(
        () =>
            appointments.map((a) => ({
                id: a.id,
                name: a.clientName,
                email: a.email,
                serviceType: a.serviceType,
                status: a.status,
                date: a.date,
                time: a.allDay ? "" : a.time,
            })),
        [appointments]
    );

    // open modal with the FULL record
    const handleView = useCallback(
        (row) => {
            const full = appointments.find((a) => a.id === row.id) || null;
            setViewAppt(full);
            setViewOpen(!!full);
        },
        [appointments]
    );

    // when modal edits/approves/reschedules/etc
    const handleUpdate = useCallback((updated) => {
        setAppointments((prev) => prev.map((a) => (a.id === updated.id ? { ...a, ...updated } : a)));
        setViewOpen(false);
    }, []);

    return (
        <div className="space-y-4 md:space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-3 md:gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100">
                        Dashboard Overview
                    </h1>
                    <p className="mt-1 text-xs md:text-sm text-gray-500 dark:text-slate-400">
                        Monitor your appointment metrics and performance
                    </p>
                </div>

                <Dropdown
                    value={filter}
                    onChange={setFilter}
                    options={periodOptions}
                    placeholder="Select period…"
                    className="w-40"
                />

            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:gap-6 xl:grid-cols-4">
                {kpis.map((kpi) => (
                    <KpiCard
                        key={kpi.id}
                        title={kpi.title}
                        value={kpi.value}
                        change={kpi.change}
                        data={kpi.data}
                    />
                ))}
            </div>

            {/* Analytics row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
                <div className="lg:col-span-8">
                    <ServiceAreaChart filter={filter} />
                </div>
                <div className="lg:col-span-4">
                    <ServiceBarChart filter={filter} />
                </div>

                <div className="lg:col-span-12">
                    <DataTable
                        rows={tableRows}
                        manageHref="/admin/appointments?status=all" // will show on dashboard only
                        onView={handleView}                           // ← opens ViewAppointmentModal
                        onEdit={(r) => console.log("edit", r)}
                        onDelete={(r) => console.log("delete", r)}
                    />
                </div>
            </div>

            {/* View details modal */}
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
