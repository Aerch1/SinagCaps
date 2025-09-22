// src/components/charts/ServiceBarChart.jsx
import React, { useMemo } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

// Mock data showing total appointments per period with service breakdown
const mockServiceData = {
    Week: [
        { name: "Mon", total: 8, services: { Wedding: 2, Baptism: 1, Funeral: 0, Confirmation: 2, Counseling: 3 } },
        { name: "Tue", total: 12, services: { Wedding: 3, Baptism: 2, Funeral: 1, Confirmation: 3, Counseling: 3 } },
        { name: "Wed", total: 6, services: { Wedding: 1, Baptism: 1, Funeral: 0, Confirmation: 2, Counseling: 2 } },
        { name: "Thu", total: 15, services: { Wedding: 4, Baptism: 3, Funeral: 1, Confirmation: 3, Counseling: 4 } },
        { name: "Fri", total: 10, services: { Wedding: 2, Baptism: 2, Funeral: 0, Confirmation: 3, Counseling: 3 } },
        { name: "Sat", total: 5, services: { Wedding: 1, Baptism: 1, Funeral: 0, Confirmation: 1, Counseling: 2 } },
        { name: "Sun", total: 18, services: { Wedding: 5, Baptism: 4, Funeral: 1, Confirmation: 4, Counseling: 4 } },
    ],
    Month: [
        { name: "Week 1", total: 45, services: { Wedding: 12, Baptism: 8, Funeral: 3, Confirmation: 10, Counseling: 12 } },
        { name: "Week 2", total: 52, services: { Wedding: 15, Baptism: 10, Funeral: 4, Confirmation: 11, Counseling: 12 } },
        { name: "Week 3", total: 38, services: { Wedding: 10, Baptism: 7, Funeral: 2, Confirmation: 8, Counseling: 11 } },
        { name: "Week 4", total: 41, services: { Wedding: 11, Baptism: 8, Funeral: 3, Confirmation: 9, Counseling: 10 } },
    ],
    Year: [
        { name: "Jan", total: 180, services: { Wedding: 45, Baptism: 32, Funeral: 15, Confirmation: 38, Counseling: 50 } },
        { name: "Feb", total: 165, services: { Wedding: 40, Baptism: 28, Funeral: 12, Confirmation: 35, Counseling: 50 } },
        { name: "Mar", total: 195, services: { Wedding: 50, Baptism: 35, Funeral: 18, Confirmation: 42, Counseling: 50 } },
        { name: "Apr", total: 210, services: { Wedding: 55, Baptism: 38, Funeral: 20, Confirmation: 45, Counseling: 52 } },
        { name: "May", total: 188, services: { Wedding: 48, Baptism: 33, Funeral: 16, Confirmation: 40, Counseling: 51 } },
        { name: "Jun", total: 225, services: { Wedding: 60, Baptism: 42, Funeral: 22, Confirmation: 48, Counseling: 53 } },
    ],
};

const serviceColors = {
    Wedding: "#dc2626",
    Baptism: "#2563eb",
    Funeral: "#7c3aed",
    Confirmation: "#059669",
    Counseling: "#d97706",
};

const BarTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const row = payload[0]?.payload;
    if (!row) return null;

    return (
        <div className="min-w-[200px] rounded-lg border border-gray-200  bg-white p-3 shadow-lg ">
            <p className="mb-2 text-sm font-medium text-slate-900 ">
                {label} - Total: {row.total}
            </p>
            <div className="space-y-1">
                {Object.entries(row.services).map(([service, count]) => (
                    <div key={service} className="flex items-center justify-between  text-xs">
                        <div className="flex items-center gap-2">
                            <span
                                className="inline-block h-2 w-2 rounded-full"
                                style={{ backgroundColor: serviceColors[service] }}
                            />
                            <span className="text-gray-600 ">{service}</span>
                        </div>
                        <span className="font-medium text-slate-900 ">{count}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ServiceBarChart = ({ filter }) => {
    const chartData = useMemo(() => mockServiceData[filter] || mockServiceData.Month, [filter]);

    return (
        <div className="flex h-full flex-col rounded-lg border border-gray-200 bg-white p-4 md:p-6 ">
            {/* Header */}
            <div className="mb-4 md:mb-6">
                <h3 className="text-base md:text-lg font-semibold text-slate-900 ">
                    Appointment Distribution
                </h3>
                <p className="mt-1 text-xs md:text-sm text-gray-500 ">
                    Total appointments by {filter.toLowerCase()}
                </p>
            </div>

            {/* Chart */}
            <div className="h-64 outline-none focus:outline-none  md:h-80 -ml-8">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        margin={{ top: 10, right: 10, left: 10, bottom: 1 }}
                        barCategoryGap="20%"
                    >
                        <defs>
                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#fbbf24" stopOpacity={1} />
                                <stop offset="100%" stopColor="#f59e0b" stopOpacity={1} />
                            </linearGradient>
                        </defs>

                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: "#64748b" }}
                            className="dark:fill-slate-400"
                            interval={0}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: "#64748b" }}
                            className="dark:fill-slate-400"
                        />
                        <Tooltip content={<BarTooltip />} />
                        <Bar
                            dataKey="total"
                            radius={[4, 4, 0, 0]}
                            fill="url(#barGradient)"
                            isAnimationActive
                            animationDuration={700}
                            animationBegin={100}
                            animationEasing="ease-in-out"
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ServiceBarChart;
