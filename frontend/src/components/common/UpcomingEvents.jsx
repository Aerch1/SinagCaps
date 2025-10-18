"use client";

import { useEffect, useState } from "react";
import { parseISO, compareAsc } from "date-fns";
import api from "@/api/api";

export default function UpcomingEvents({ onItemClick, className = "" }) {
    const [todayEvents, setTodayEvents] = useState([]);
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await api.get("/admin/events/upcoming");
                if (res.data.success) {
                    const mapEvent = (e) => ({
                        id: e.id,
                        title: e.title,
                        description: e.description,
                        start: parseISO(`${e.date}T${e.time || "00:00:00"}`),
                        image_url: e.image_url,
                    });

                    // ✅ Use API-provided arrays directly
                    setTodayEvents(res.data.data.today.map(mapEvent).sort((a, b) => compareAsc(a.start, b.start)));
                    setUpcomingEvents(res.data.data.upcoming.map(mapEvent).sort((a, b) => compareAsc(a.start, b.start)));
                }
            } catch (err) {
                console.error("❌ Failed to fetch upcoming events:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    const renderEventItem = (e) => {
        const dateLabel = e.start.toLocaleDateString(undefined, { month: "short", day: "numeric" });
        const timeLabel = e.start.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", hour12: true });
        return (
            <li key={e.id}>
                <button
                    type="button"
                    onClick={() => onItemClick?.(e)}
                    className="w-full text-left py-3 px-2 border-b border-gray-100 hover:bg-gray-50 transition"
                >
                    <div className="grid grid-cols-[64px_1fr] items-start gap-3">
                        <div className="text-xs text-gray-600 pt-0.5 whitespace-nowrap">
                            <div className="font-medium text-gray-700">{dateLabel}</div>
                            <div>{timeLabel}</div>
                        </div>
                        <div className="min-w-0">
                            <div className="truncate font-medium text-slate-900">{e.title}</div>
                            {e.description && (
                                <p className="text-xs text-gray-500 truncate mt-0.5">{e.description}</p>
                            )}
                        </div>
                    </div>
                </button>
            </li>
        );
    };

    return (
        <div
            className={`bg-white rounded-lg border border-gray-200 pt-6 px-4 flex flex-col ${className}`}
        >
            {/* Header */}
            <div className="flex items-center justify-between gap-4 mb-4 min-h-[40px]">
                <h3 className="text-lg font-semibold text-slate-900">Upcoming Events</h3>
            </div>

            {loading ? (
                <p className="text-sm text-gray-500">Loading events...</p>
            ) : todayEvents.length === 0 && upcomingEvents.length === 0 ? (
                <p className="text-sm text-gray-500">No upcoming events.</p>
            ) : (
                <ul className="divide-y divide-gray-100 overflow-y-auto scroll-thin flex-1 pr-1">
                    {/* Today’s Events */}
                    {todayEvents.length > 0 && (
                        <>
                            <li className="py-2 px-2 text-sm font-semibold text-blue-600">Today</li>
                            {todayEvents.map(renderEventItem)}
                        </>
                    )}

                    {/* Future Events */}
                    {upcomingEvents.length > 0 && (
                        <>
                            {todayEvents.length > 0 && (
                                <li className="py-2 px-2 text-sm font-semibold text-gray-500">Upcoming</li>
                            )}
                            {upcomingEvents.map(renderEventItem)}
                        </>
                    )}
                </ul>
            )}
        </div>
    );
}
