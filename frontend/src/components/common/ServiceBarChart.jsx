"use client";

import React, { useEffect, useState, useMemo } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import api from "@/api/api";

// Tooltip
const BarTooltip = ({ active, payload, label, serviceColors }) => {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;

  return (
    <div className="min-w-[200px] rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
      <p className="mb-2 text-sm font-medium text-slate-900">
        {label} - Total: {row.total}
      </p>
      <div className="space-y-1">
        {row.services &&
          Object.entries(row.services).map(([service, count]) => (
            <div key={service} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: serviceColors[service] || "#999" }}
                />
                <span className="text-gray-600">{service}</span>
              </div>
              <span className="font-medium text-slate-900">{count}</span>
            </div>
          ))}
      </div>
    </div>
  );
};

const ServiceBarChart = ({ filter }) => {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState([]);

  // 🎨 Color palette
  const colorPalette = [
    "#dc2626", "#2563eb", "#7c3aed", "#059669", "#d97706",
    "#0891b2", "#9333ea", "#e11d48",
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
      .catch((err) => console.error("❌ Failed to fetch services:", err));
  }, []);

  // ✅ Fetch chart data
  useEffect(() => {
    let active = true;
    setLoading(true);

    api
      .get(`/admin/dashboard/bar?period=${filter}`)
      .then((res) => {
        if (active && res.data.success) {
          const data = res.data.data || [];

          // ✅ Normalize services
          let normalized = data.map((row) => ({
            ...row,
            services: row.services || {},
          }));

          // ✅ Fix "Week 35" → "Week 1..4" if Month filter
          if (filter.toLowerCase() === "month") {
            normalized = normalized.map((row, idx) => ({
              ...row,
              name: `Week ${idx + 1}`,
            }));
          }

          setChartData(normalized);
        }
      })
      .catch((err) => console.error("❌ Failed to fetch bar chart data:", err))
      .finally(() => setLoading(false));

    return () => {
      active = false;
    };
  }, [filter]);

  return (
    <div className="flex h-full flex-col rounded-lg border border-gray-200 bg-white p-4 md:p-6">
      {/* Header */}
      <div className="mb-4 md:mb-6">
        <h3 className="text-base md:text-lg font-semibold text-slate-900">
          Appointment Distribution
        </h3>
        <p className="mt-1 text-xs md:text-sm text-gray-500">
          Total appointments by {filter.toLowerCase()}
        </p>
      </div>

      {/* Chart */}
      <div className="h-64 md:h-80 -ml-8">
        {loading ? (
          <p className="text-sm text-gray-500">Loading chart…</p>
        ) : chartData.length === 0 ? (
          <p className="text-sm text-gray-500">No data available</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 10, bottom: 1 }}
              barCategoryGap="20%"
            >
             <defs>
  {/* 🔵 Blue gradient instead of yellow */}
  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} /> 
    {/* blue-500 */}
    <stop offset="100%" stopColor="#93c5fd" stopOpacity={0.9} /> 
    {/* blue-300 */}
  </linearGradient>
</defs>

              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#64748b" }}
                interval={0}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#64748b" }}
              />
              <Tooltip content={<BarTooltip serviceColors={serviceColors} />} />
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
        )}
      </div>
    </div>
  );
};

export default ServiceBarChart;
