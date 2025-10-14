"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import api from "@/api/api";


export default function TodaySchedule({ onItemClick, className = "" }) {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    // ✅ Fetch today's appointments dynamically
    useEffect(() => {
        const fetchToday = async () => {
            try {
                const res = await api.get("/admin/appointments/today");
                if (res.data.success) {
                    setAppointments(res.data.data || []);
                }
            } catch (err) {
                console.error("❌ Failed to fetch today's appointments:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchToday();
    }, []);

    return (
        <div
            className={`bg-white rounded-lg border border-gray-200 pt-6 px-4 flex flex-col ${className}`}
        >
            {/* Header */}
            <div className="flex items-center justify-between gap-4 mb-4 min-h-[40px]">
                <h3 className="text-lg font-semibold text-slate-900">
                    Today’s Schedule
                </h3>
            </div>

            {/* Loading / Empty / List */}
            {loading ? (
                <p className="text-sm text-gray-500">Loading schedule...</p>
            ) : appointments.length === 0 ? (
                <p className="text-sm text-gray-500">No schedule today.</p>
            ) : (
                <ul className="divide-y divide-gray-100 overflow-y-auto scroll-thin flex-1 pr-1">
                    {appointments.map((appt) => {
                        const timeLabel = appt.time
                            ? format(new Date(`1970-01-01T${appt.time}`), "h:mm a")
                            : "All day";
                        const color = getServiceColor(appt.serviceName);
                        const title = appt.serviceName || "Appointment";

                        return (
                            <li key={appt.id}>
                                <button
                                    type="button"
                                    onClick={() => onItemClick?.(appt)}
                                    className="w-full text-left py-3 px-2 border-b border-gray-100 hover:bg-gray-50 transition"
                                >
                                    <div className="grid grid-cols-[64px_5px_1fr] items-start gap-3">
                                        {/* Time */}
                                        <div className="text-xs text-gray-600 pt-0.5 whitespace-nowrap">
                                            {timeLabel}
                                        </div>

                                        {/* Dot */}
                                        <div className="pt-1">
                                            <span
                                                className="inline-block h-2.5 w-2.5 rounded-full"
                                                style={{ backgroundColor: color }}
                                                aria-hidden="true"
                                            />
                                        </div>

                                        {/* Content */}
                                        <div className="min-w-0">
                                            <div className="truncate font-medium text-slate-900">
                                                {title}
                                            </div>
                                            <div className="text-xs text-gray-500 truncate">
                                                {appt.name || ""}
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

/* 🎨 Color mapping per service */
function getServiceColor(serviceType) {
    const colors = {
        Wedding: "#dc2626",
        Baptism: "#2563eb",
        Counseling: "#d97706",
        Confirmation: "#059669",
        Funeral: "#7c3aed",
    };
    return colors[serviceType] || "#64748b"; // slate fallback
}
