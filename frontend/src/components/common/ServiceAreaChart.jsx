// src/components/charts/ServiceAreaChart.jsx
import React, { useMemo } from "react";
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from "recharts";

// Mock data for different time periods
const mockServiceData = {
    Week: {
        data: [
            { name: "Mon", TotalEvents: 2, TotalAppointments: 4 },
            { name: "Tue", TotalEvents: 3, TotalAppointments: 4 },
            { name: "Wed", TotalEvents: 2, TotalAppointments: 4 },
            { name: "Thu", TotalEvents: 4, TotalAppointments: 6 },
            { name: "Fri", TotalEvents: 3, TotalAppointments: 5 },
            { name: "Sat", TotalEvents: 2, TotalAppointments: 3 },
            { name: "Sun", TotalEvents: 5, TotalAppointments: 7 },
        ],
    },
    Month: {
        data: [
            { name: "Week 1", TotalEvents: 8, TotalAppointments: 12 },
            { name: "Week 2", TotalEvents: 10, TotalAppointments: 15 },
            { name: "Week 3", TotalEvents: 9, TotalAppointments: 14 },
            { name: "Week 4", TotalEvents: 7, TotalAppointments: 12 },
        ],
    },
    Year: {
        data: [
            { name: "Jan", TotalEvents: 20, TotalAppointments: 25 },
            { name: "Feb", TotalEvents: 25, TotalAppointments: 30 },
            { name: "Mar", TotalEvents: 28, TotalAppointments: 35 },
            { name: "Apr", TotalEvents: 22, TotalAppointments: 28 },
            { name: "May", TotalEvents: 30, TotalAppointments: 38 },
            { name: "Jun", TotalEvents: 35, TotalAppointments: 42 },
        ],
    },
};

const serviceColors = {
    TotalEvents: "#fbbf24",        // amber-400
    TotalAppointments: "#fcd34d",  // amber-300
};

const AreaTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg ">
            <p className="mb-2 text-sm font-medium text-slate-900 ">{label}</p>
            {payload.map((entry, i) => (
                <div key={`${entry.dataKey}-${i}`} className="flex items-center gap-2 text-xs">
                    <span
                        className="inline-block h-3 w-3 rounded-full"
                        style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-gray-600 ">
                        {entry.dataKey === "TotalEvents" ? "Total Events" : "Total Appointments"}: {entry.value}
                    </span>
                </div>
            ))}
        </div>
    );
};

const ServiceAreaChart = ({ filter }) => {
    const chartData = useMemo(() => {
        return mockServiceData[filter] || mockServiceData.Month;
    }, [filter]);

    return (
        <div className="h-full rounded-lg border border-gray-200 bg-white p-4 md:p-6 ">
            {/* Header */}
            <div className="mb-4 md:mb-6">
                <h3 className="text-base md:text-lg font-semibold text-slate-900 ">
                    Service Overview
                </h3>
                <p className="mt-1 text-xs md:text-sm text-gray-500 ">
                    Events and appointments distribution
                </p>
            </div>

            {/* Chart */}
            <div className="h-64 md:h-80 -ml-7">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={chartData.data}
                        margin={{ top: 10, right: 15, left: 5, bottom: 5 }}
                    >
                        <defs>
                            <linearGradient id="gradient-TotalEvents" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={serviceColors.TotalEvents} stopOpacity={0.4} />
                                <stop offset="95%" stopColor={serviceColors.TotalEvents} stopOpacity={0.1} />
                            </linearGradient>
                            <linearGradient id="gradient-TotalAppointments" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={serviceColors.TotalAppointments} stopOpacity={0.4} />
                                <stop offset="95%" stopColor={serviceColors.TotalAppointments} stopOpacity={0.1} />
                            </linearGradient>
                        </defs>

                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="" />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: "#64748b" }}
                            className="dark:fill-slate-400"
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: "#64748b" }}
                            className="dark:fill-slate-400"
                        />
                        <Tooltip content={<AreaTooltip />} />

                        <Area
                            type="monotone"
                            dataKey="TotalEvents"
                            stackId="1"
                            stroke={serviceColors.TotalEvents}
                            strokeWidth={2}
                            fill="url(#gradient-TotalEvents)"
                            activeDot={false}
                        />
                        <Area
                            type="monotone"
                            dataKey="TotalAppointments"
                            stackId="1"
                            stroke={serviceColors.TotalAppointments}
                            strokeWidth={2}
                            fill="url(#gradient-TotalAppointments)"
                            activeDot={false}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ServiceAreaChart;
