"use client";

import { useState, useMemo, useCallback } from "react";
import KpiCard from "../../components/common/KpiCard";
import Dropdown from "../../components/ui/Dropdown1";
import ServiceAreaChart from "../../components/common/ServiceAreaChart";
import ServiceBarChart from "../../components/common/ServiceBarChart";
import DataTable from "../../components/common/DataTable";
import ViewAppointmentModal from "../../components/common/modal/ViewAppointmentModal";

/* ---------------- helpers ---------------- */
const series = (arr) => arr.map((v, i) => ({ label: `P${i + 1}`, value: v }));

// ✅ KEEP MOCKED KPI DATA
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

export default function AdminDashboard() {
    const periodOptions = ["Week", "Month", "Year"];
    const [filter, setFilter] = useState("Month");

    // state for modal (hooked up later if you connect DataTable actions)
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

    return (
        <div className="space-y-4 md:space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-3 md:gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-slate-900">
                        Dashboard Overview
                    </h1>
                    <p className="mt-1 text-xs md:text-sm text-gray-500">
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

            {/* KPI Grid (mocked for now) */}
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

                {/* DataTable preview */}
                <div className="lg:col-span-12">
                    <DataTable
                        initialPageSize={5} // ✅ preview mode
                        manageHref="/admin/appointments?status=all"
                        onView={(row) => {
                            setViewAppt(row);
                            setViewOpen(true);
                        }}
                    />
                </div>
            </div>

            {/* Modal */}
            <ViewAppointmentModal
                isOpen={viewOpen}
                onClose={() => setViewOpen(false)}
                appointment={viewAppt}
            />
        </div>
    );
}
