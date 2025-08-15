// src/pages/Public/settings/panels/NotificationPanel.jsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
    Bell,
    Check,
    Clock,
    CalendarCheck2,
    RefreshCcw,
    XCircle,
    Church,
    ChevronLeft,
    ChevronRight,
    Trash2,
    X,
} from "lucide-react";

// ---------- Demo data (replace with API later) ----------
const DEMO_NOTIFS = [
    {
        id: "n-001",
        type: "appointment-approved",
        title: "Appointment approved",
        body: "Your baptism appointment on May 4, 2025 is approved.",
        createdAt: "2025-04-15T08:10:00.000Z",
        read: false,
        ref: "000085752257",
    },
    {
        id: "n-002",
        type: "appointment-rescheduled",
        title: "Appointment rescheduled",
        body: "Your wedding appointment has been moved to June 12, 2025, 2:00 PM.",
        createdAt: "2025-04-16T10:30:00.000Z",
        read: false,
        ref: "000085799001",
    },
    {
        id: "n-003",
        type: "announcement",
        title: "Parish announcement",
        body: "There will be a short maintenance of the booking system tonight.",
        createdAt: "2025-04-12T14:00:00.000Z",
        read: true,
    },
    {
        id: "n-004",
        type: "appointment-cancelled",
        title: "Appointment cancelled",
        body: "Your funeral mass request was cancelled by admin.",
        createdAt: "2025-04-11T09:00:00.000Z",
        read: true,
        ref: "000085745678",
    },
    ...Array.from({ length: 12 }).map((_, i) => ({
        id: `n-more-${i + 1}`,
        type: i % 3 ? "announcement" : "reminder",
        title: i % 3 ? "Parish update" : "Reminder",
        body: i % 3
            ? "Community activity this weekend. Check the parish board for details."
            : "Don’t forget to complete your profile before your scheduled date.",
        createdAt: new Date(Date.now() - (i + 1) * 3600_000).toISOString(),
        read: i % 4 === 0,
    })),
];

// ---------- Utils ----------
const cn = (...c) => c.filter(Boolean).join(" ");

function timeAgo(iso) {
    const d = new Date(iso);
    const now = Date.now();
    const diff = Math.max(0, now - d.getTime());
    const min = Math.floor(diff / 60000);
    if (min < 1) return "just now";
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const day = Math.floor(hr / 24);
    if (day < 7) return `${day}d ago`;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatDateTime(iso) {
    const d = new Date(iso);
    return `${d.toLocaleDateString(undefined, {
        weekday: "short",
        month: "long",
        day: "numeric",
        year: "numeric",
    })} • ${d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`;
}

function iconFor(notif) {
    switch (notif.type) {
        case "appointment-approved":
            return { Icon: CalendarCheck2, tone: "text-emerald-600", bg: "bg-emerald-50" };
        case "appointment-rescheduled":
            return { Icon: RefreshCcw, tone: "text-amber-600", bg: "bg-amber-50" };
        case "appointment-cancelled":
            return { Icon: XCircle, tone: "text-rose-600", bg: "bg-rose-50" };
        case "reminder":
            return { Icon: Clock, tone: "text-sky-600", bg: "bg-sky-50" };
        case "announcement":
            return { Icon: Church, tone: "text-indigo-600", bg: "bg-indigo-50" };
        default:
            return { Icon: Bell, tone: "text-gray-600", bg: "bg-gray-50" };
    }
}

// ---------- Row ----------
function NotificationRow({ notif, onClick }) {
    const { Icon, tone, bg } = iconFor(notif);
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "w-full text-left px-6 py-4 flex items-start gap-4 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/40",
                "transition"
            )}
        >
            {/* icon */}
            <div className={cn("h-10 w-10 rounded-full grid place-items-center shrink-0", bg)}>
                <Icon className={cn("h-5 w-5", tone)} />
            </div>

            {/* text */}
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <div className={cn("text-sm font-medium", notif.read ? "text-gray-800" : "text-gray-900")}>
                        {notif.title}
                    </div>
                    {!notif.read && <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />}
                </div>
                <div className="mt-0.5 text-sm text-gray-600 line-clamp-2">{notif.body}</div>
                {notif.ref && (
                    <div className="mt-1 text-xs text-gray-500">
                        Reference: <span className="font-mono">{notif.ref}</span>
                    </div>
                )}
            </div>

            {/* meta */}
            <div className="ml-4 shrink-0 text-xs text-gray-500">{timeAgo(notif.createdAt)}</div>
        </button>
    );
}

// ---------- Modal ----------
function NotificationModal({ open, notif, onClose, onDelete, onMarkRead }) {
    const overlayRef = useRef(null);

    useEffect(() => {
        if (!open) return;
        const onKey = (e) => e.key === "Escape" && onClose();
        document.addEventListener("keydown", onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = prev;
        };
    }, [open, onClose]);

    if (!open || !notif) return null;

    const { Icon, tone, bg } = iconFor(notif);

    return (
        <div
            ref={overlayRef}
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onMouseDown={(e) => {
                if (e.target === overlayRef.current) onClose();
            }}
        >
            {/* backdrop */}
            <div className="absolute inset-0 bg-black/20" />

            {/* panel */}
            <div className="relative z-10 w-full max-w-lg rounded-xl border border-gray-200 bg-white shadow-xl">
                {/* header */}
                <div className="flex items-start justify-between px-6 py-5 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className={cn("h-10 w-10 rounded-full grid place-items-center", bg)}>
                            <Icon className={cn("h-5 w-5", tone)} />
                        </div>
                        <div>
                            <div className="text-sm font-medium text-gray-900">{notif.title}</div>
                            <div className="text-xs text-gray-600">{formatDateTime(notif.createdAt)}</div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-50"
                        aria-label="Close"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* body */}
                <div className="px-6 py-5 max-h-[60vh] overflow-y-auto scroll-thin">
                    <p className="text-sm text-gray-800 leading-6">{notif.body}</p>

                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                        <div className="text-gray-600">Type</div>
                        <div className="text-gray-900">{notif.type}</div>

                        {notif.ref && (
                            <>
                                <div className="text-gray-600">Reference</div>
                                <div className="text-gray-900 font-mono">{notif.ref}</div>
                            </>
                        )}
                    </div>
                </div>

                {/* footer */}
                <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-200">
                    <div className="text-xs text-gray-500">{notif.read ? "Marked as read" : "Unread"}</div>
                    <div className="flex items-center gap-2">
                        {!notif.read && (
                            <button
                                type="button"
                                onClick={() => onMarkRead(notif.id)}
                                className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                                <Check className="h-4 w-4" />
                                Mark as read
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={() => onDelete(notif.id)}
                            className="inline-flex items-center gap-2 rounded-md bg-rose-600 px-3 py-2 text-sm text-white hover:bg-rose-700"
                        >
                            <Trash2 className="h-4 w-4" />
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ---------- Panel ----------
const PAGE_SIZE = 8;

export default function NotificationPanel() {
    const [items, setItems] = useState(() => DEMO_NOTIFS);
    const [page, setPage] = useState(1);
    const [openId, setOpenId] = useState(null);

    const total = items.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [totalPages, page]);

    const paged = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return items.slice(start, start + PAGE_SIZE);
    }, [items, page]);

    const hasPagination = total > PAGE_SIZE;

    const markAllRead = () => {
        setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    };

    const onRowClick = (id) => {
        // open only; do NOT auto-mark
        setOpenId(id);
    };

    const selected = items.find((n) => n.id === openId) || null;

    const handleClose = () => setOpenId(null);

    const handleMarkRead = (id) => {
        setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    };

    const handleDelete = (id) => {
        setItems((prev) => prev.filter((n) => n.id !== id));
        setOpenId(null);
    };

    return (
        <section className="bg-white">
            <div className="max-w-4xl mx-auto py-2">
                <div className="mt-3 rounded-xl border border-gray-200">
                    {/* header */}
                    <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full grid place-items-center bg-emerald-50">
                                <Bell className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                                <div className="text-sm font-medium text-gray-900">Notifications</div>
                                <div className="text-xs text-gray-600">
                                    You have <span className="font-medium">{items.filter((n) => !n.read).length}</span> unread
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={markAllRead}
                                className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                                <Check className="h-4 w-4" />
                                Mark all as read
                            </button>
                        </div>
                    </div>

                    {/* list area (fixed height + scroll) */}
                    <div className="h-[480px] overflow-y-auto scroll-thin">
                        {paged.length === 0 ? (
                            <div className="px-6 py-12 text-center text-sm text-gray-600">No notifications yet.</div>
                        ) : (
                            <div className="divide-y divide-gray-200">
                                {paged.map((n) => (
                                    <NotificationRow key={n.id} notif={n} onClick={() => onRowClick(n.id)} />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* footer / pagination (only when needed) */}
                    {hasPagination && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                            <div className="text-xs text-gray-600">
                                Page <span className="font-medium">{page}</span> of <span className="font-medium">{totalPages}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="inline-flex items-center gap-1 rounded-md bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    Prev
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="inline-flex items-center gap-1 rounded-md bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Next
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* modal */}
            <NotificationModal
                open={!!selected}
                notif={selected}
                onClose={handleClose}
                onDelete={handleDelete}
                onMarkRead={handleMarkRead}
            />
        </section>
    );
}
