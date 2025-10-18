"use client";

import { useEffect, useState } from "react";
import { format, startOfDay } from "date-fns";
import api from "@/api/api";

/**
 * UpcomingEvents.jsx
 * - Fetches upcoming events dynamically from /admin/events/upcoming
 * - Only includes active events of type "event"
 * - Maintains UI and sorting for today and future events
 */
export default function UpcomingEvents({ onItemClick, className = "" }) {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await api.get("/admin/events/upcoming");
                if (res.data.success) {
                    // Only include type = 'event'
                    const filtered = res.data.data
                        .filter((e) => e.type === "event")
                        .map((e) => ({
                            id: e.id,
                            title: e.title,
                            description: e.description,
                            start: new Date(`${e.date}T${e.time || "00:00:00"}`),
                            image_url: e.image_url,
                        }));

                    setEvents(filtered);
                }
            } catch (err) {
                console.error("❌ Failed to fetch upcoming events:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    const today = startOfDay(new Date());

    const upcoming = events
        .filter((e) => e.start >= today)
        .sort((a, b) => a.start - b.start);

    return (
        <div
            className={`bg-white rounded-lg border border-gray-200 pt-6 px-4 flex flex-col ${className}`}
        >
            {/* Header */}
            <div className="flex items-center justify-between gap-4 mb-4 min-h-[40px]">
                <h3 className="text-lg font-semibold text-slate-900">Upcoming Events</h3>
            </div>

            {/* Loading / Empty / List */}
            {loading ? (
                <p className="text-sm text-gray-500">Loading events...</p>
            ) : upcoming.length === 0 ? (
                <p className="text-sm text-gray-500">No upcoming events.</p>
            ) : (
                <ul className="divide-y divide-gray-100 overflow-y-auto scroll-thin flex-1 pr-1">
                    {upcoming.map((e) => {
                        const dateLabel = format(e.start, "MMM d");
                        const timeLabel = format(e.start, "h:mm a");
                        return (
                            <li key={e.id}>
                                <button
                                    type="button"
                                    onClick={() => onItemClick?.(e)}
                                    className="w-full text-left py-3 px-2 border-b border-gray-100 hover:bg-gray-50 transition"
                                >
                                    <div className="grid grid-cols-[64px_1fr] items-start gap-3">
                                        {/* Date/Time */}
                                        <div className="text-xs text-gray-600 pt-0.5 whitespace-nowrap">
                                            <div className="font-medium text-gray-700">{dateLabel}</div>
                                            <div>{timeLabel}</div>
                                        </div>

                                        {/* Content */}
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
                    })}
                </ul>
            )}
        </div>
    );
}
