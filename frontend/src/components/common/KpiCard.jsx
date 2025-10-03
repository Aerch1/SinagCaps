// src/components/common/KpiCard.jsx
import React from "react";
import { ArrowDownRight, ArrowUpRight, BarChart3 } from "lucide-react";

function formatNumber(val) {
  return typeof val === "number" ? val.toLocaleString() : val ?? "";
}

export default function KpiCard({
  title,
  value,
  previous = 0, // Dashboard passes previous
  icon: Icon = BarChart3,
  stripeColor = "bg-blue-500",
  periodLabel = "last period",
}) {
  // ✅ Centralized change calculation
  let displayChange;
  let isNumeric = true;

  if (!previous) {
    if (value > 0) {
      displayChange = `+${value} change`;
    } else {
      displayChange = "0 change";
    }
    isNumeric = false;
  } else if (previous < 5) {
    const diff = value - previous;
    displayChange =
      diff === 0 ? "0 change" : `${diff > 0 ? "+" : ""}${diff} change`;
    isNumeric = false;
  } else {
    displayChange = Math.round(((value - previous) / previous) * 100);
    isNumeric = true;
  }

  const isZeroChange =
    displayChange === "0 change" || Number(displayChange) === 0;

  const positive = !isZeroChange
    ? isNumeric
      ? Number(displayChange) >= 0
      : String(displayChange).startsWith("+")
    : null;

  return (
    <div className="relative overflow-hidden rounded-lg border border-gray-200 bg-white p-5 transition-all duration-200 hover:shadow-sm">
      {/* Left stripe */}
      <div className={`absolute top-0 left-0 h-full w-1 ${stripeColor}`} />

      <h3 className="mb-3 ml-1.5 text-sm font-medium text-gray-600">{title}</h3>

      <div className="flex items-center justify-between gap-4">
        {/* Value + Change */}
        <div className="ml-1.5 flex flex-col gap-2">
          <div className="text-2xl font-bold text-slate-900">
            {formatNumber(value)}
          </div>

          <div className="flex items-center gap-1.5 whitespace-nowrap">
            {isZeroChange ? (
              <span className="text-xs text-gray-500">
                0 change vs {periodLabel}
              </span>
            ) : (
              <>
                {positive ? (
                  <ArrowUpRight size={14} className="text-green-600" />
                ) : (
                  <ArrowDownRight size={14} className="text-red-600" />
                )}

                {isNumeric ? (
                  <span className="text-xs">
                    <span
                      className={`font-medium ${
                        positive ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {Math.abs(displayChange)}%
                    </span>
                    <span className="text-gray-500">
                      {"\u00A0"}vs {periodLabel}
                    </span>
                  </span>
                ) : (
                  <span
                    className={`text-xs font-medium ${
                      positive ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {displayChange} vs {periodLabel}
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        {/* Icon */}
        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-slate-50 text-slate-700">
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
}
