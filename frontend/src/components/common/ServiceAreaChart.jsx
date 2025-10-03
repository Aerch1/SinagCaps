// src/components/charts/ServiceAreaChart.jsx
"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from "recharts";
import api from "@/api/api";

// Fixed labels
const WEEK_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_LABELS = ["Week 1", "Week 2", "Week 3", "Week 4"];
const YEAR_LABELS = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// Tooltip
const AreaTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
            <p className="mb-2 text-sm font-medium text-slate-900">{label}</p>
            {payload.map((entry, i) => (
                <div key={`${entry.dataKey}-${i}`} className="flex items-center gap-2 text-xs">
                    <span
                        className="inline-block h-3 w-3 rounded-full"
                        style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-gray-600">
                        {entry.dataKey}: {entry.value}
                    </span>
                </div>
            ))}
        </div>
    );
};

const ServiceAreaChart = ({ filter }) => {
    const [services, setServices] = useState([]);
    const [rawData, setRawData] = useState([]);
    const [loading, setLoading] = useState(false);

    // 🎨 Color palette
    const colorPalette = [
        "#dc2626", "#2563eb", "#7c3aed", "#059669", "#d97706",
        "#0891b2", "#9333ea", "#e11d48", "#ca8a04", "#0d9488"
    ];

    const serviceColors = useMemo(() => {
        const colors = {};
        services.forEach((s, i) => {
            colors[s.name] = colorPalette[i % colorPalette.length];
        });
        return colors;
    }, [services]);

    // ✅ Fetch services
    useEffect(() => {
        api.get("/admin/services")
            .then((res) => {
                if (res.data.success) setServices(res.data.services || []);
            })
            .catch((err) => console.error("❌ Fetch services failed:", err));
    }, []);

    // ✅ Fetch chart data
    useEffect(() => {
        let active = true;
        setLoading(true);
        api.get(`/admin/dashboard/area?period=${filter}`)
            .then((res) => {
                if (active && res.data.success) {
                    setRawData(res.data.data || []);
                }
            })
            .catch((err) => console.error("❌ Fetch area chart data failed:", err))
            .finally(() => setLoading(false));

        return () => { active = false };
    }, [filter]);

    // ✅ Normalize chartData
    const chartData = useMemo(() => {
        let labels = [];
        if (filter.toLowerCase() === "week") labels = WEEK_LABELS;
        else if (filter.toLowerCase() === "month") labels = MONTH_LABELS;
        else if (filter.toLowerCase() === "year") labels = YEAR_LABELS;

        // map rawData by name
        const map = {};
        rawData.forEach((row) => { map[row.name] = row });

        // fill missing
        return labels.map((label) => {
            const base = map[label] || {};
            const servicesObj = services.reduce((acc, s) => {
                acc[s.name] = base[s.name] || 0;
                return acc;
            }, {});
            return { name: label, ...servicesObj };
        });
    }, [rawData, filter, services]);

    return (
        <div className="h-full rounded-lg border border-gray-200 bg-white p-4 md:p-6">
            {/* Header */}
            <div className="mb-4 md:mb-6">
                <h3 className="text-base md:text-lg font-semibold text-slate-900">
                    Service Overview
                </h3>
                <p className="mt-1 text-xs md:text-sm text-gray-500">
                    Appointments distribution by {filter.toLowerCase()}
                </p>
            </div>

            {/* Chart */}
            <div className="h-64 md:h-80 -ml-7">
                {loading ? (
                    <p className="text-sm text-gray-500">Loading chart…</p>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={chartData}
                            margin={{ top: 10, right: 15, left: 5, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 11, fill: "#64748b" }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 11, fill: "#64748b" }}
                            />
                            <Tooltip content={<AreaTooltip />} />

                            {services.map((s, i) => (
                                <Area
                                    key={s.id}
                                    type="monotone"
                                    dataKey={s.name}
                                    stroke={serviceColors[s.name]}
                                    strokeWidth={2}
                                    fillOpacity={0.3}
                                    fill={serviceColors[s.name]}
                                    activeDot={{ r: 4 }}
                                />
                            ))}
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
};

export default ServiceAreaChart;
