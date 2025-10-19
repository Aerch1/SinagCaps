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
    Tag,
} from "lucide-react";
import api from "@/api/api";
import toast from "react-hot-toast";

/* ---------- Helpers ---------- */
const cn = (...c) => c.filter(Boolean).join(" ");

function timeAgo(iso) {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
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
    })} • ${d.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    })}`;
}

/* ✅ Prettify "2025-10-13 at 13:00" → "October 13, 2025 at 1:00 PM" */
function prettifyMessageText(message = "") {
    return message.replace(
        /(\d{4})-(\d{2})-(\d{2})\s*at\s*(\d{2}):(\d{2})/g,
        (_, y, m, d, hh, mm) => {
            const date = new Date(`${y}-${m}-${d}T${hh}:${mm}:00`);
            const dateStr = date.toLocaleDateString(undefined, {
                month: "long",
                day: "numeric",
                year: "numeric",
            });
            const timeStr = date.toLocaleTimeString(undefined, {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
            });
            return `${dateStr} at ${timeStr}`;
        }
    );
}

/* ---------- Icon and Color Map ---------- */
function iconFor(notif) {
    switch (notif.type) {
        case "appointment":
            return { Icon: CalendarCheck2, tone: "text-emerald-600", bg: "bg-emerald-50" };
        case "announcement":
            return { Icon: Church, tone: "text-indigo-600", bg: "bg-indigo-50" };
        case "event":
            return { Icon: Clock, tone: "text-sky-600", bg: "bg-sky-50" };
        case "advisory":
            return { Icon: RefreshCcw, tone: "text-amber-600", bg: "bg-amber-50" };
        case "document":
            return { Icon: XCircle, tone: "text-rose-600", bg: "bg-rose-50" };
        default:
            return { Icon: Bell, tone: "text-gray-600", bg: "bg-gray-50" };
    }
}

/* ---------- Badge Colors ---------- */
function getBadgeClass(type) {
    switch (type) {
        case "announcement":
            return "bg-indigo-100 text-indigo-700 border border-indigo-200";
        case "event":
            return "bg-sky-100 text-sky-700 border border-sky-200";
        case "advisory":
            return "bg-amber-100 text-amber-700 border border-amber-200";
        case "document":
            return "bg-rose-100 text-rose-700 border border-rose-200";
        case "appointment":
            return "bg-emerald-100 text-emerald-700 border border-emerald-200";
        default:
            return "bg-gray-100 text-gray-700 border border-gray-200";
    }
}

/* ---------- Row ---------- */
function NotificationRow({ notif, onClick }) {
    const { Icon, tone, bg } = iconFor(notif);
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "w-full text-left px-6 py-4 flex items-start gap-4 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
            )}
        >
            <div className={cn("h-10 w-10 rounded-full grid place-items-center shrink-0", bg)}>
                <Icon className={cn("h-5 w-5", tone)} />
            </div>

            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <div className={cn("text-sm font-medium", notif.isRead ? "text-gray-800" : "text-gray-900")}>
                        {notif.title}
                    </div>
                    {!notif.isRead && <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />}
                </div>
                {/* ✅ category/status badge under title */}
                <div
                    className={cn(
                        "inline-flex items-center gap-1 text-[12px] font-medium mt-1 px-2 py-0.5 rounded-full",
                        getBadgeClass(notif.type)
                    )}
                >
                    <Tag className="h-3 w-3 opacity-70" />
                    {notif.type.charAt(0).toUpperCase() + notif.type.slice(1)}
                </div>

                <div className="mt-1.5 text-sm text-gray-600 line-clamp-2">
                    {prettifyMessageText(notif.message)}
                </div>
            </div>

            <div className="ml-4 shrink-0 text-xs text-gray-500">{timeAgo(notif.createdAt)}</div>
        </button>
    );
}

/* ---------- Modal ---------- */
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
            onMouseDown={(e) => {
                if (e.target === overlayRef.current) onClose();
            }}
        >
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

            <div className="relative z-10 w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden">
                {/* Header */}
                <div className="flex items-start justify-between px-6 sm:px-8 py-5 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className={cn("h-11 w-11 rounded-full grid place-items-center", bg)}>
                            <Icon className={cn("h-5 w-5", tone)} />
                        </div>
                        <div>
                            <div className="text-base font-semibold text-gray-900">{notif.title}</div>

                            {/* ✅ Category label under title */}
                            <div
                                className={cn(
                                    "inline-flex items-center gap-1 mt-1 text-xs font-medium px-2 py-0.5 rounded-full",
                                    getBadgeClass(notif.type)
                                )}
                            >
                                <Tag className="h-3 w-3 opacity-70" />
                                {notif.type.charAt(0).toUpperCase() + notif.type.slice(1)}
                            </div>

                            <div className="text-xs text-gray-600 mt-1">{formatDateTime(notif.createdAt)}</div>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100"
                        aria-label="Close"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 sm:px-8 py-6 max-h-[60vh] overflow-y-auto scroll-thin leading-relaxed">
                    <p className="text-[15px] text-gray-800 whitespace-pre-line">
                        {prettifyMessageText(notif.message)}
                    </p>
                </div>

                {/* Footer */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 sm:px-8 py-5 border-t border-gray-200 bg-gray-50">
                    <div className="text-xs text-gray-500">
                        {notif.isRead ? "Marked as read" : "Unread"}
                    </div>
                    <div className="flex items-center justify-end gap-2">
                        {!notif.isRead && (
                            <button
                                type="button"
                                onClick={() => onMarkRead(notif.id)}
                                className="inline-flex items-center gap-2 rounded-md bg-white border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
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

/* ---------- Main Panel ---------- */
/* ---------- Main Panel ---------- */
const PAGE_SIZE = 8;

export default function NotificationPanel() {
    const [items, setItems] = useState([]);
    const [page, setPage] = useState(1);
    const [openId, setOpenId] = useState(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await api.get("/notifications/my");
                if (res.data.success) setItems(res.data.notifications);
            } catch (err) {
                console.error("❌ Failed to fetch notifications:", err);
                toast.error("Failed to load notifications");
            }
        }
        fetchData();
    }, []);

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

    /* ✅ When a notification is opened, mark it read automatically */
    const handleOpen = async (id) => {
        setOpenId(id);
        const notif = items.find((n) => n.id === id);
        if (notif && !notif.isRead) {
            try {
                await api.patch(`/notifications/${id}/read`);
                setItems((prev) =>
                    prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
                );
            } catch {
                console.warn("⚠️ Failed to auto-mark notification as read");
            }
        }
    };

    /* ✅ Mark as read manually (still kept for footer button) */
    const handleMarkRead = async (id) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            setItems((prev) =>
                prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
            );
        } catch {
            toast.error("Failed to mark as read");
        }
    };

    /* ✅ Delete notification */
    const handleDelete = async (id) => {
        try {
            await api.delete(`/notifications/${id}`);
            setItems((prev) => prev.filter((n) => n.id !== id));
            setOpenId(null);
        } catch {
            toast.error("Failed to delete notification");
        }
    };

    /* ✅ Mark all read */
    const markAllRead = async () => {
        try {
            await Promise.all(items.map((n) => api.patch(`/notifications/${n.id}/read`)));
            setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
        } catch {
            toast.error("Failed to mark all as read");
        }
    };

    const selected = items.find((n) => n.id === openId) || null;

    /* ✅ Count unread to sync with avatar indicator globally */
    const unreadCount = items.filter((n) => !n.isRead).length;
    useEffect(() => {
        // Notify global store or localStorage if you track unread in header
        localStorage.setItem("unreadCount", unreadCount);
        window.dispatchEvent(new Event("unread-updated"));
    }, [unreadCount]);

    return (
        <section className="bg-white">
            <div className="max-w-4xl mx-auto py-4">
                <div className="mt-3 rounded-xl border border-gray-200 shadow-sm">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 bg-gray-50">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full grid place-items-center bg-emerald-50">
                                <Bell className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                                <div className="text-sm font-medium text-gray-900">Notifications</div>
                                <div className="text-xs text-gray-600">
                                    You have{" "}
                                    <span className="font-medium">{unreadCount}</span> unread
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={markAllRead}
                            className="inline-flex items-center gap-2 rounded-md bg-white border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                            <Check className="h-4 w-4" />
                            Mark all as read
                        </button>
                    </div>

                    {/* List */}
                    <div className="h-[480px] overflow-y-auto scroll-thin">
                        {paged.length === 0 ? (
                            <div className="px-6 py-12 text-center text-sm text-gray-600">
                                No notifications yet.
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-200">
                                {paged.map((n) => (
                                    <NotificationRow
                                        key={n.id}
                                        notif={n}
                                        onClick={() => handleOpen(n.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {hasPagination && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
                            <div className="text-xs text-gray-600">
                                Page <span className="font-medium">{page}</span> of{" "}
                                <span className="font-medium">{totalPages}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="inline-flex items-center gap-1 rounded-md bg-white border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    Prev
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="inline-flex items-center gap-1 rounded-md bg-white border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                                >
                                    Next
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            <NotificationModal
                open={!!selected}
                notif={selected}
                onClose={() => setOpenId(null)}
                onDelete={handleDelete}
                onMarkRead={handleMarkRead}
            />
        </section>
    );
}
