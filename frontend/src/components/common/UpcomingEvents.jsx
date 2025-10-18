"use client";

import { useEffect, useState } from "react";
import { format, startOfDay, parseISO } from "date-fns";
import api from "@/api/api";

export default function UpcomingEvents({ onItemClick, className = "" }) {
    const [loading, setLoading] = useState(true);
    const [todayEvents, setTodayEvents] = useState([]);
    const [upcomingEvents, setUpcomingEvents] = useState([]);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await api.get("/admin/events/upcoming");
                console.log("DEBUG: Raw API response", res.data);

                if (res.data.success) {
                    const mapped = res.data.data.map((e) => {
                        // Parse date in local time
                        const datePart = parseISO(e.date); // this gives local date
                        const [hours, minutes, seconds] = (e.time || "00:00:00").split(":").map(Number);

                        const start = new Date(
                            datePart.getFullYear(),
                            datePart.getMonth(),
                            datePart.getDate(),
                            hours,
                            minutes,
                            seconds
                        );

                        return {
                            id: e.id,
                            title: e.title,
                            description: e.description,
                            start,
                            image_url: e.image_url,
                            date: e.date,
                            time: e.time,
                        };
                    });

                    const today = startOfDay(new Date());

                    const todayList = mapped.filter(
                        (e) => startOfDay(e.start).getTime() === today.getTime()
                    );

                    const upcomingList = mapped
                        .filter((e) => startOfDay(e.start).getTime() > today.getTime())
                        .sort((a, b) => a.start - b.start);

                    console.log("DEBUG: Today Events", todayList);
                    console.log("DEBUG: Upcoming Events", upcomingList);

                    setTodayEvents(todayList);
                    setUpcomingEvents(upcomingList);
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
        const dateLabel = format(e.start, "MMM d");
        const timeLabel = format(e.start, "h:mm a"); // 12-hour format
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
        <div className={`bg-white rounded-lg border border-gray-200 pt-6 px-4 flex flex-col ${className}`}>
            <div className="flex items-center justify-between gap-4 mb-4 min-h-[40px]">
                <h3 className="text-lg font-semibold text-slate-900">Upcoming Events</h3>
            </div>

            {loading ? (
                <p className="text-sm text-gray-500">Loading events...</p>
            ) : todayEvents.length === 0 && upcomingEvents.length === 0 ? (
                <p className="text-sm text-gray-500">No upcoming events.</p>
            ) : (
                <ul className="divide-y divide-gray-100 overflow-y-auto scroll-thin flex-1 pr-1">
                    {todayEvents.length > 0 && (
                        <>
                            <li className="py-1 px-2 text-xs font-semibold text-blue-600">Today’s Events</li>
                            {todayEvents.map(renderEventItem)}
                        </>
                    )}
                    {upcomingEvents.length > 0 && (
                        <>
                            {todayEvents.length > 0 && (
                                <li className="py-1 px-2 text-xs font-semibold text-gray-500">Upcoming Events</li>
                            )}
                            {upcomingEvents.map(renderEventItem)}
                        </>
                    )}
                </ul>
            )}
        </div>
    );
}
