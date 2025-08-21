"use client";

import React, { useMemo, useState } from "react";
import { CalendarDays, Clock, MapPin, Search, MoreHorizontal, Edit2, Trash2 } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

/* helpers */
const fmtDate = (iso) =>
    new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "2-digit" });
const fmtTime = (hhmm) => {
    if (!hhmm) return "";
    const d = new Date(`1970-01-01T${hhmm}`);
    return isNaN(d)
        ? hhmm
        : new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(d);
};

/* neutral status chip (gray only) */
const StatusChip = ({ children }) => (
    <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-700 ring-1 ring-gray-300 px-2.5 py-1 text-xs font-medium">
        {children}
    </span>
);

/* one card */
function EventCard({ item, onEdit, onDelete }) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm/0 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>

                <div className="flex items-center gap-2">
                    <StatusChip>{item.status}</StatusChip>

                    {/* quiet “more” menu (gray only) */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none"
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-32 bg-white border border-gray-200">
                            <DropdownMenuItem
                                onClick={() => onEdit?.(item)}
                                className="flex items-center gap-2 text-gray-700 hover:bg-gray-50 cursor-pointer"
                            >
                                <Edit2 className="h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => onDelete?.(item)}
                                className="flex items-center gap-2 text-gray-700 hover:bg-gray-50 cursor-pointer"
                            >
                                <Trash2 className="h-4 w-4" /> Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {item.description && (
                <p className="mt-3 text-sm leading-6 text-gray-600">{item.description}</p>
            )}

            <div className="mt-4 space-y-2 text-sm text-gray-700">
                <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-gray-500" />
                    <span>{fmtDate(item.date)}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>{fmtTime(item.time)}</span>
                </div>
                <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span>{item.location || "—"}</span>
                </div>
            </div>

            <div className="mt-4 flex items-center gap-4 text-sm">
                <button
                    onClick={() => onEdit?.(item)}
                    className="text-gray-600 hover:text-gray-900 underline-offset-2 hover:underline"
                >
                    Edit
                </button>
                <button
                    onClick={() => onDelete?.(item)}
                    className="text-gray-600 hover:text-gray-900 underline-offset-2 hover:underline"
                >
                    Delete
                </button>
            </div>
        </div>
    );
}

/* grid + search (neutral focus) */
export default function EventsGrid({ events = [], onEdit, onDelete }) {
    const [query, setQuery] = useState("");
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return events;
        return events.filter(
            (e) =>
                (e.title || "").toLowerCase().includes(q) ||
                (e.description || "").toLowerCase().includes(q) ||
                (e.location || "").toLowerCase().includes(q)
        );
    }, [events, query]);

    return (
        <div className="p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-base font-medium text-gray-900">Church Events</h2>

                <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search events…"
                        className="
              h-9 w-64 rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm text-gray-900
              placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300
            "
                    />
                </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {filtered.map((ev) => (
                    <EventCard key={ev.id} item={ev} onEdit={onEdit} onDelete={onDelete} />
                ))}

                {filtered.length === 0 && (
                    <div className="col-span-full rounded-xl border border-gray-200 bg-white p-10 text-center text-gray-500">
                        No events found.
                    </div>
                )}
            </div>
        </div>
    );
}
