"use client"

import { useEffect, useState } from "react"
import {
    Calendar,
    Clock,
    CheckCircle2,
    Loader2,
    ArrowDownRight,
    ArrowUpRight,
} from "lucide-react"
import api from "@/api/api"

// 🎨 Map icons & colors per type
const ICON_MAP = {
    pending: { icon: Clock, color: "text-yellow-600 dark:text-yellow-400" },
    approved: { icon: CheckCircle2, color: "text-green-600 dark:text-green-400" },
    in_progress: { icon: Loader2, color: "text-blue-600 dark:text-blue-400" },
    upcoming: { icon: Calendar, color: "text-indigo-600 dark:text-indigo-400" }, // mock
}

export default function Card() {
    const [stats, setStats] = useState([])

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get("/admin/dashboard/kpis?period=Month")
                if (res.data.success) {
                    const row = res.data.data || []

                    const pending = row.find((r) => r.id === "pending")?.current || 0
                    const approved = row.find((r) => r.id === "approved")?.current || 0 // ⚠️ add in backend
                    const inProgress =
                        row.find((r) => r.id === "in_progress")?.current || 0 // ⚠️ add in backend

                    const cards = [
                        {
                            id: "pending",
                            title: "Pending",
                            count: pending,
                            change: 0,
                            ...ICON_MAP.pending,
                        },
                        {
                            id: "approved",
                            title: "Approved",
                            count: approved,
                            change: 0,
                            ...ICON_MAP.approved,
                        },
                        {
                            id: "in_progress",
                            title: "In Progress",
                            count: inProgress,
                            change: 0,
                            ...ICON_MAP.in_progress,
                        },
                        {
                            id: "upcoming",
                            title: "Upcoming Events",
                            count: 2, // mock
                            change: 0,
                            ...ICON_MAP.upcoming,
                        },
                    ]

                    setStats(cards)
                }
            } catch (err) {
                console.error("❌ Failed to fetch KPI stats:", err)
            }
        }

        fetchStats()
    }, [])

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
    )
}

// 🟢 Inner reusable card component
function StatCard({ icon: Icon, title, count, change = 0, iconColor }) {
    const isPositive = change >= 0

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6 transition-all duration-200 hover:shadow-md">
            <h3 className="text-sm font-medium text-gray-600 mb-3">{title}</h3>
            <div className="flex items-center justify-between gap-4">
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
                <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 bg-slate-50">
                    <Icon className={`w-6 h-6 ${iconColor}`} />
                </div>
            </div>
        </div>
    )
}
