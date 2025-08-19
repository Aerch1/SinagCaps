// src/components/common/KpiCard.jsx
import React, { useId } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis } from "recharts";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

function formatNumber(val) {
  return typeof val === "number" ? val.toLocaleString() : val ?? "";
}

export default function KpiCard({ title, value, change = 0, data = [] }) {
  const positive = Number(change) >= 0;
  const stroke = positive ? "#22c55e" : "#ef4444";
  const gradientId = `kpi-grad-${useId()}`;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 transition-all duration-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
      <h3 className="mb-3 text-sm font-medium text-gray-600 dark:text-slate-400">
        {title}
      </h3>

      <div className="flex items-center justify-between gap-4">
        {/* Value + delta */}
        <div className="flex flex-col gap-2">
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {formatNumber(value)}
          </div>

          {/* keep percent + label on ONE line */}
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            {positive ? (
              <ArrowUpRight size={14} className="text-green-600 dark:text-green-400" />
            ) : (
              <ArrowDownRight size={14} className="text-red-600 dark:text-red-400" />
            )}

            <span className="text-xs">
              <span
                className={`font-medium ${
                  positive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                }`}
              >
                {Math.abs(change)}%
              </span>
              <span className="text-gray-500 dark:text-slate-500">
                {"\u00A0"}vs last period
              </span>
            </span>
          </div>
        </div>

        {/* Sparkline */}
        {Array.isArray(data) && data.length > 0 && (
          <div className="h-12 w-24 overflow-hidden rounded-md md:h-14 md:w-28">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={stroke} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={stroke} stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <YAxis hide domain={["auto", "auto"]} />
                <XAxis hide dataKey="label" />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={stroke}
                  strokeWidth={2}
                  fill={`url(#${gradientId})`}
                  dot={false}
                  isAnimationActive
                  animationDuration={700}
                  animationBegin={100}
                  animationEasing="ease-in-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
