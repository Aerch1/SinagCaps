"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  Clock,
  CheckCircle2,
  ArrowDownRight,
  ArrowUpRight,
} from "lucide-react";
import api from "@/api/api";

// 🎨 Icon & color mapping per KPI type
const ICON_MAP = {
  pending: { icon: Clock, color: "text-yellow-600 dark:text-yellow-400" },
  approved: { icon: CheckCircle2, color: "text-green-600 dark:text-green-400" },
  completed: { icon: CheckCircle2, color: "text-blue-600 dark:text-blue-400" },
  upcoming: { icon: Calendar, color: "text-indigo-600 dark:text-indigo-400" },
};

export default function Card() {
  const [stats, setStats] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // ✅ Use new controller for calendar KPIs
        const res = await api.get("/admin/dashboard/calendar/kpis");
        if (res.data.success) {
          const rows = res.data.data || [];

          const cards = rows.map((item) => {
            const { id, title, current, previous } = item;
            const iconInfo = ICON_MAP[id] || {};

            // 📊 Compute percentage change safely
            let change = 0;
            if (previous && previous !== 0) {
              change = ((current - previous) / previous) * 100;
            }

            return {
              id,
              title,
              count: current || 0,
              change: Math.round(change),
              ...iconInfo,
            };
          });

          setStats(cards);
        }
      } catch (err) {
        console.error("❌ Failed to fetch Calendar KPI stats:", err);
      }
    };

    fetchStats();
  }, []);

  return (
    <>
      {stats.map((stat) => (
        <StatCard
          key={stat.id}
          icon={stat.icon}
          title={stat.title}
          count={stat.count}
          change={stat.change}
          iconColor={stat.color}
        />
      ))}
    </>
  );
}

// 🟢 Reusable stat card component
function StatCard({ icon: Icon, title, count, change = 0, iconColor }) {
  const isPositive = change >= 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 transition-all duration-200 hover:shadow-md">
      {/* Title */}
      <h3 className="text-sm font-medium text-gray-600 mb-3">{title}</h3>

      <div className="flex items-center justify-between gap-4">
        {/* Left side (numbers + trend) */}
        <div className="flex flex-col gap-2">
          <div className="text-2xl font-bold text-slate-900">
            {typeof count === "number" ? count.toLocaleString() : count}
          </div>

          <div className="flex items-center gap-1">
            {isPositive ? (
              <ArrowUpRight size={14} className="text-green-600" />
            ) : (
              <ArrowDownRight size={14} className="text-red-600" />
            )}
            <span
              className={`text-xs font-medium ${isPositive ? "text-green-600" : "text-red-600"
                }`}
            >
              {Math.abs(change)}%
            </span>
            <span className="text-xs text-gray-500">vs last period</span>
          </div>
        </div>

        {/* Right side (icon) */}
        <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 bg-slate-50">
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
}
