// src/pages/admin/AdminDashboard.jsx
"use client";

import { useState, useEffect } from "react";
import KpiCard from "../../components/common/KpiCard";
import Dropdown from "../../components/ui/Dropdown1";
import ServiceAreaChart from "../../components/common/ServiceAreaChart";
import ServiceBarChart from "../../components/common/ServiceBarChart";
import DataTable from "../../components/common/DataTable";
import ViewAppointmentModal from "../../components/common/modal/ViewAppointmentModal";
import api from "@/api/api";
import {
    BarChart3,
    CalendarDays,
    Clock,
    Users,
    ListChecks,
} from "lucide-react";

const KPI_CONFIG = {
    total: { icon: BarChart3, color: "bg-blue-500" },
    pending: { icon: Clock, color: "bg-yellow-500" },
    today: { icon: CalendarDays, color: "bg-green-500" },
    activeUsers: { icon: Users, color: "bg-purple-500" },
};

function getPeriodLabel(filter, id) {
    if (id === "today") return "yesterday"; // special case
    switch (filter) {
        case "Week":
            return "last week";
        case "Month":
            return "last month";
        case "Year":
            return "last year";
        default:
            return "last period";
    }
}

export default function AdminDashboard() {
    const periodOptions = ["Week", "Month", "Year"];
    const [filter, setFilter] = useState("Month");

    const [kpiData, setKpiData] = useState([]);
    const [loadingKpi, setLoadingKpi] = useState(false);

    const [viewOpen, setViewOpen] = useState(false);
    const [viewAppt, setViewAppt] = useState(null);

    // 🕒 Live time in Philippine Standard Time
    const [time, setTime] = useState(new Date());
    useEffect(() => {
        const interval = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    /* --- fetch KPI data --- */
    useEffect(() => {
        let active = true;
        setLoadingKpi(true);
        api
            .get(`/admin/dashboard/kpis?period=${filter}`)
            .then((res) => {
                if (active && res.data.success) {
                    const raw = res.data.data || [];
                    setKpiData(
                        raw.map((k) => ({
                            id: k.id,
                            title: k.title,
                            value: k.current,     // ✅ current KPI value
                            previous: k.previous, // ✅ previous KPI value
                            data: k.trend || [],
                        }))
                    );
                }
            })
            .catch((err) => console.error("❌ KPI fetch failed:", err))
            .finally(() => setLoadingKpi(false));
        return () => {
            active = false;
        };
    }, [filter]);

    return (
        <div className="space-y-4 md:space-y-6">
            {/* 🔵 Header strip */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-md bg-secondary px-6 py-2 text-white">
                <div className="border-white py-4">
                    <h1 className="text-lg md:text-xl font-bold">Dashboard</h1>
                    <p className="text-xs md:text-sm opacity-90">
                        Monitor your appointment metrics and performance
                    </p>
                </div>

                <div className="text-right mt-3 sm:mt-0">
                    <div className="text-sm md:text-base font-semibold">
                        {time.toLocaleTimeString("en-PH", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                            hour12: true,
                            timeZone: "Asia/Manila",
                        })}
                    </div>
                    <div className="text-xs md:text-sm opacity-90">
                        {time.toLocaleDateString("en-PH", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            timeZone: "Asia/Manila",
                        })}
                    </div>
                </div>
            </div>

            {/* Dropdown filter */}
            <div className="flex justify-end">
                <Dropdown
                    value={filter}
                    onChange={setFilter}
                    options={periodOptions}
                    placeholder="Select period…"
                    className="w-32 text-black"
                />
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:gap-6 xl:grid-cols-4">
                {loadingKpi && <p className="text-sm text-gray-500">Loading KPIs…</p>}
                {!loadingKpi &&
                    kpiData.map((kpi) => {
                        const { icon, color } = KPI_CONFIG[kpi.id] || {
                            icon: ListChecks,
                            color: "border-gray-400",
                        };
                        return (
                            <KpiCard
                                key={kpi.id}
                                title={kpi.title}
                                value={kpi.value}
                                previous={kpi.previous}
                                icon={icon}
                                stripeColor={color}
                                periodLabel={getPeriodLabel(filter, kpi.id)}
                            />
                        );
                    })}
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
                        initialPageSize={5}
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
