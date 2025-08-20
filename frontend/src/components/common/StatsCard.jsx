"use client"
import { ArrowDownRight, ArrowUpRight } from "lucide-react"

const StatsCard = ({ icon: Icon, title, count, change = 0, bgColor, iconColor }) => {
    const isPositive = change >= 0

    return (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6 transition-all duration-200 hover:shadow-md">
            <h3 className="text-sm font-medium text-gray-600 dark:text-slate-400 mb-3">{title}</h3>
            <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                        {typeof count === "number" ? count.toLocaleString() : count}
                    </div>
                    <div className="flex items-center gap-1">
                        {isPositive ? (
                            <ArrowUpRight size={14} className="text-green-600 dark:text-green-400" />
                        ) : (
                            <ArrowDownRight size={14} className="text-red-600 dark:text-red-400" />
                        )}
                        <span
                            className={`text-xs font-medium ${isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                                }`}
                        >
                            {Math.abs(change)}%
                        </span>
                        <span className="text-xs text-gray-500 dark:text-slate-500">vs last period</span>
                    </div>
                </div>
                <div className={`w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-6 h-6 ${iconColor}`} />
                </div>
            </div>
        </div>
    )
}

export default StatsCard
