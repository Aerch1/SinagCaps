"use client";

import { format, isAfter, isSameDay, startOfDay } from "date-fns";

/**
 * props:
 *  - events: [{ id, start, end, title, category?, location?, description?, allDay? }]
 *  - fromDate?: Date (default today)
 *  - onItemClick?: (evt) => void
 *  - className?: string (height can be controlled by parent; card scrolls internally)
 */
export default function UpcomingEvents({
    events = [],
    fromDate = new Date(),
    onItemClick,
    className = "",
}) {
    const source = events?.length ? events : getMockEvents(fromDate);

    const base = startOfDay(fromDate);
    const upcoming = (source || [])
        .filter((e) => {
            if (!e?.start) return false;
            const d = new Date(e.start);
            return !isSameDay(d, base) && isAfter(d, base); // strictly after today
        })
        .sort((a, b) => new Date(a.start) - new Date(b.start));

    return (
        <div className={`bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 pt-6 px-4 flex flex-col ${className}`}>
            {/* Header — match TodaySchedule */}
            <div className="flex items-center justify-between gap-4 mb-4 min-h-[40px]">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Upcoming Events
                </h3>
            </div>

            {!upcoming.length ? (
                <p className="text-sm text-gray-500 dark:text-slate-400">No upcoming events.</p>
            ) : (
                <ul className="divide-y divide-gray-100 dark:divide-slate-700 overflow-y-auto scroll-thin flex-1 pr-1">
                    {upcoming.map((e) => {
                        const start = new Date(e.start);
                        const isAllDay = !!e.allDay;
                        const dateShort = format(start, "MMM d");                // e.g., Sep 3
                        const timeLabel = isAllDay ? "All day" : format(start, "h:mm a"); // 12-hour
                        const title = e.title || "Event";
                        const sub = e.location || e.clientName || "";

                        return (
                            <li key={e.id}>
                                <button
                                    type="button"
                                    onClick={() => onItemClick?.(e)}
                                    className="w-full text-left py-3 border-b hover:bg-gray-50 dark:hover:bg-slate-700/40 dark:border-gray-600 px-2 transition"
                                >
                                    <div className="grid grid-cols-[64px_1fr] items-start gap-3">
                                        {/* First column (matches TodaySchedule width) */}
                                        <div className="text-xs text-gray-600 dark:text-slate-400 pt-0.5 whitespace-nowrap">
                                            <div className="font-medium text-gray-700 dark:text-slate-200">{dateShort}</div>
                                            <div>{timeLabel}</div>
                                        </div>

                                        {/* Content */}
                                        <div className="min-w-0">
                                            <div className="truncate font-medium text-slate-900 dark:text-slate-100">
                                                {title}
                                            </div>
                                            {sub ? (
                                                <div className="text-xs text-gray-500 dark:text-slate-400 truncate">
                                                    {sub}
                                                </div>
                                            ) : null}
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

/* ---------------- Mock data (local Date objects) ---------------- */

function getMockEvents(base = new Date()) {
    const e1s = atLocal(base, 1, 18, 0); const e1e = addMinutes(e1s, 90);
    const e2s = atLocal(base, 2, 9, 30); const e2e = addMinutes(e2s, 60);
    const e3s = atLocal(base, 5, 0, 0, true); const e3e = nextDayExclusive(e3s); // all-day
    const e4s = atLocal(base, 6, 15, 0); const e4e = addMinutes(e4s, 120);

    return [
        { id: "EVT-101", title: "Parish Council Meeting", category: "Community", location: "Parish Hall", start: e1s, end: e1e },
        { id: "EVT-102", title: "Wedding Rehearsal", category: "Wedding", location: "Main Church", start: e2s, end: e2e },
        { id: "EVT-103", title: "Town Fiesta", category: "Fiesta", location: "Town Center", start: e3s, end: e3e, allDay: true },
        { id: "EVT-104", title: "Baptism Seminar", category: "Baptism", location: "Room A-2", start: e4s, end: e4e },
    ];
}

function atLocal(base, plusDays, hh, mm, dateOnly = false) {
    const y = base.getFullYear(), m = base.getMonth(), d = base.getDate() + plusDays;
    if (dateOnly) return new Date(y, m, d, 0, 0, 0, 0);
    return new Date(y, m, d, hh, mm, 0, 0);
}
function nextDayExclusive(dateOnlyStart) {
    return new Date(dateOnlyStart.getFullYear(), dateOnlyStart.getMonth(), dateOnlyStart.getDate() + 1, 0, 0, 0, 0);
}
function addMinutes(dt, mins) { return new Date(dt.getTime() + mins * 60 * 1000); }
