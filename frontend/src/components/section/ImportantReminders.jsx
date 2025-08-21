// src/components/section/ImportantReminders.jsx
"use client";

import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
    Bell,
    Calendar as CalendarIcon,
    Clock,
    Repeat,
    Search,
    MoreHorizontal,
    Check,
    Pause,
    Play,
    Trash2,
    ChevronDown,
    Plus,
} from "lucide-react";

/* ---------- helpers ---------- */

const fmtDate = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d)) return iso;
    return new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(d);
};

const fmtTime = (hhmm) => {
    if (!hhmm) return "—";
    const d = new Date(`1970-01-01T${hhmm}`);
    if (Number.isNaN(d)) return hhmm;
    return new Intl.DateTimeFormat(undefined, {
        hour: "numeric",
        minute: "2-digit",
    }).format(d);
};

const nextRunLabel = (r) => {
    if (r.type === "recurring") {
        const when = r.time ? `at ${fmtTime(r.time)}` : "";
        if (r.repeat === "Daily") return `Every day ${when}`.trim();
        if (r.repeat === "Weekly") return `Every week ${when}`.trim();
        if (r.repeat === "Monthly") return `Every month ${when}`.trim();
        return `Repeats ${when}`.trim();
    }
    return `${fmtDate(r.date)} • ${fmtTime(r.time)}`;
};

const statusBadge = (s) =>
    s === "Paused"
        ? "bg-gray-100 text-gray-600 ring-1 ring-gray-300"
        : s === "Completed"
            ? "bg-gray-100 text-gray-500 ring-1 ring-gray-300 line-through"
            : "bg-gray-100 text-gray-700 ring-1 ring-gray-300";

/* ---------- component ---------- */

export default function ImportantReminders({
    items = [],
    onCreate,         // (newItem) => void
    onEdit,           // (item) => void
    onDelete,         // (item) => void
    onTogglePause,    // (item) => void   // pause/resume
    onComplete,       // (item) => void   // mark done (one-time)
}) {
    // filters & search
    const [query, setQuery] = useState("");
    const [status, setStatus] = useState("All");       // All | Active | Paused | Completed
    const [type, setType] = useState("All");           // All | Recurring | One-time

    // quick add
    const [addOpen, setAddOpen] = useState(false);
    const [title, setTitle] = useState("");
    const [repeat, setRepeat] = useState("Never");     // Never | Daily | Weekly | Monthly
    const [date, setDate] = useState("");            // yyyy-MM-dd
    const [time, setTime] = useState("");            // HH:mm

    const filtered = useMemo(() => {
        let data = items;

        if (status !== "All") {
            data = data.filter((r) => r.status === status);
        }
        if (type !== "All") {
            data = data.filter((r) =>
                type === "Recurring" ? r.type === "recurring" : r.type === "one-time"
            );
        }
        if (query.trim()) {
            const q = query.toLowerCase();
            data = data.filter(
                (r) =>
                    (r.title || "").toLowerCase().includes(q) ||
                    (r.description || "").toLowerCase().includes(q) ||
                    (r.location || "").toLowerCase().includes(q)
            );
        }
        // newest first by createdAt or date
        return [...data].sort((a, b) => {
            const ax = new Date(a.createdAt || a.date || 0).getTime();
            const bx = new Date(b.createdAt || b.date || 0).getTime();
            return bx - ax;
        });
    }, [items, query, status, type]);

    const handleCreate = () => {
        if (!title.trim()) return;
        const payload =
            repeat === "Never"
                ? {
                    id: `r-${Date.now()}`,
                    title: title.trim(),
                    description: "",
                    type: "one-time",
                    status: "Active",
                    date,
                    time,
                    createdAt: new Date().toISOString(),
                }
                : {
                    id: `r-${Date.now()}`,
                    title: title.trim(),
                    description: "",
                    type: "recurring",
                    status: "Active",
                    repeat, // Daily | Weekly | Monthly
                    time,
                    createdAt: new Date().toISOString(),
                };

        onCreate?.(payload);
        // reset compact form
        setTitle("");
        setRepeat("Never");
        setDate("");
        setTime("");
        setAddOpen(false);
    };

    return (
        <div className="p-6">
            {/* header */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h3 className="text-base font-medium text-gray-900 dark:text-white">
                        Important Reminders
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Create quick, one-time notes or set up recurring reminders.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Search */}
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search reminders…"
                            className="h-9 w-64 rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400 dark:focus:ring-gray-500"
                        />
                    </div>

                    {/* Type filter */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                                {type === "All" ? "All types" : type}
                                <ChevronDown className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className="w-40 bg-white shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-gray-800 dark:ring-white/10"
                        >
                            {["All", "Recurring", "One-time"].map((t) => (
                                <DropdownMenuItem
                                    key={t}
                                    onClick={() => setType(t)}
                                    className="cursor-pointer px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700"
                                >
                                    {t}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Status filter */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                                {status === "All" ? "All status" : status}
                                <ChevronDown className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className="w-40 bg-white shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-gray-800 dark:ring-white/10"
                        >
                            {["All", "Active", "Paused", "Completed"].map((s) => (
                                <DropdownMenuItem
                                    key={s}
                                    onClick={() => setStatus(s)}
                                    className="cursor-pointer px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700"
                                >
                                    {s}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Quick add toggle */}
                    <Button
                        size="sm"
                        className="gap-2 bg-gray-900 text-white hover:bg-gray-800 focus:outline-none dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                        onClick={() => setAddOpen((v) => !v)}
                    >
                        <Plus className="h-4 w-4" />
                        New reminder
                    </Button>
                </div>
            </div>

            {/* quick add form */}
            {addOpen && (
                <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/40">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                        <div className="sm:col-span-4">
                            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Title</label>
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="What should we remember?"
                                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400"
                            />
                        </div>

                        <div className="sm:col-span-3">
                            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Repeat</label>
                            <select
                                value={repeat}
                                onChange={(e) => setRepeat(e.target.value)}
                                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                            >
                                <option>Never</option>
                                <option>Daily</option>
                                <option>Weekly</option>
                                <option>Monthly</option>
                            </select>
                        </div>

                        {/* Show date for one-time, otherwise hide */}
                        {repeat === "Never" && (
                            <div className="sm:col-span-3">
                                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Date</label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                                />
                            </div>
                        )}

                        <div className="sm:col-span-2">
                            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Time</label>
                            <input
                                type="time"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                            />
                        </div>

                        <div className="sm:col-span-12 flex items-end gap-2">
                            <Button
                                onClick={handleCreate}
                                className="bg-gray-900 text-white hover:bg-gray-800 focus:outline-none dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                            >
                                Save reminder
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => { setAddOpen(false); setTitle(""); setRepeat("Never"); setDate(""); setTime(""); }}
                                className="border-gray-300 text-gray-700 hover:bg-gray-50 focus:outline-none dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* list */}
            <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white dark:divide-gray-700 dark:border-gray-700 dark:bg-gray-900/40">
                {filtered.length === 0 && (
                    <li className="px-6 py-16 text-center text-sm text-gray-500 dark:text-gray-400">
                        No reminders yet.
                    </li>
                )}

                {filtered.map((r) => (
                    <li
                        key={r.id}
                        className="group px-6 py-4 hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors"
                    >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            {/* left: title + meta */}
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <Bell className="h-4 w-4 text-gray-400" />
                                    <h4
                                        className={`truncate text-sm font-medium ${r.status === "Completed"
                                                ? "text-gray-500 line-through"
                                                : "text-gray-900 dark:text-gray-100"
                                            }`}
                                    >
                                        {r.title}
                                    </h4>
                                </div>

                                {r.description ? (
                                    <p className="mt-1 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
                                        {r.description}
                                    </p>
                                ) : null}

                                {/* meta row */}
                                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                    {r.type === "recurring" ? (
                                        <>
                                            <Repeat className="h-3.5 w-3.5 text-gray-400" />
                                            <span>{nextRunLabel(r)}</span>
                                        </>
                                    ) : (
                                        <>
                                            <CalendarIcon className="h-3.5 w-3.5 text-gray-400" />
                                            <span>{fmtDate(r.date)}</span>
                                            <span className="mx-1 text-gray-400">•</span>
                                            <Clock className="h-3.5 w-3.5 text-gray-400" />
                                            <span>{fmtTime(r.time)}</span>
                                        </>
                                    )}

                                    <span className="mx-2 h-3 w-px bg-gray-200 dark:bg-gray-700" />

                                    <Badge className={`rounded-full px-2 py-0.5 ${statusBadge(r.status)}`}>
                                        {r.status}
                                    </Badge>

                                    <span className="text-gray-400">·</span>
                                    <span>Created {fmtDate(r.createdAt || new Date().toISOString())}</span>
                                </div>
                            </div>

                            {/* right: actions */}
                            <div className="flex items-center gap-1">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-gray-800"
                                        >
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                        align="end"
                                        className="w-44 bg-white shadow-lg ring-1 ring-black/10 dark:bg-gray-800 dark:ring-white/10"
                                    >
                                        {r.type === "one-time" && r.status !== "Completed" && (
                                            <DropdownMenuItem
                                                onClick={() => onComplete?.(r)}
                                                className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700"
                                            >
                                                <Check className="h-4 w-4" />
                                                Mark done
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem
                                            onClick={() => onTogglePause?.(r)}
                                            className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700"
                                        >
                                            {r.status === "Paused" ? (
                                                <>
                                                    <Play className="h-4 w-4" />
                                                    Resume
                                                </>
                                            ) : (
                                                <>
                                                    <Pause className="h-4 w-4" />
                                                    Pause
                                                </>
                                            )}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => onEdit?.(r)}
                                            className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700"
                                        >
                                            Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => onDelete?.(r)}
                                            className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
