"use client";

import { format, isSameDay } from "date-fns";

/**
 * props:
 *  - appointments: [{ id, start, end, serviceType, clientName, title?, backgroundColor?, allDay? }]
 *  - date?: Date (defaults to today)
 *  - onItemClick?: (appt) => void
 *  - className?: string (height can be controlled by parent; card scrolls internally)
 */
export default function TodaySchedule({ appointments = [], date = new Date(), onItemClick, className = "" }) {
    const todays = (appointments || [])
        .filter((e) => e?.start && isSameDay(new Date(e.start), date))
        .sort((a, b) => new Date(a.start) - new Date(b.start));

    return (
        <div className={`bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 pt-6 px-4 flex flex-col ${className}`}>
            {/* Header — matches calendar header sizing */}
            <div className="flex items-center justify-between gap-4 mb-4 min-h-[40px]">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Today Schedule
                </h3>
            </div>

            {!todays.length ? (
                <p className="text-sm text-gray-500 dark:text-slate-400">No schedule today.</p>
            ) : (
                <ul className="divide-y divide-gray-100 dark:divide-slate-700 overflow-y-auto scroll-thin flex-1 pr-1">
                    {todays.map((e) => {
                        const startDate = new Date(e.start);
                        const timeLabel = e.allDay ? "All day" : format(startDate, "h:mm a"); // 12-hour
                        const color = e.backgroundColor || getServiceColor(e.serviceType);
                        const title = e.title || e.serviceType || "Appointment";

                        return (
                            <li key={e.id}>
                                <button
                                    type="button"
                                    onClick={() => onItemClick?.(e)}
                                    className="w-full text-left py-3 border-b hover:bg-gray-50 dark:hover:bg-slate-700/40 dark:border-gray-600 px-2 transition"
                                >
                                    <div className="grid grid-cols-[64px_5px_1fr] items-start gap-3">
                                        {/* Time (first column) */}
                                        <div className="text-xs text-gray-600 dark:text-slate-400 pt-0.5 whitespace-nowrap">
                                            {timeLabel}
                                        </div>

                                        {/* Dot (second column) */}
                                        <div className="pt-1">
                                            <span
                                                className="inline-block h-2.5 w-2.5 rounded-full"
                                                style={{ backgroundColor: color }}
                                                aria-hidden="true"
                                            />
                                        </div>

                                        {/* Content (third column) */}
                                        <div className="min-w-0">
                                            <div className="truncate font-medium text-slate-900 dark:text-slate-100">
                                                {title}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-slate-400 truncate">
                                                {e.clientName || ""}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}

/* same color map as calendar */
function getServiceColor(serviceType) {
    const colors = {
        Wedding: "#dc2626",
        Baptism: "#2563eb",
        Counseling: "#d97706",
        Confirmation: "#059669",
        Funeral: "#7c3aed",
    };
    return colors[serviceType] || "#64748b"; // slate-500 fallback
}
