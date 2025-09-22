"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  X,
  Check,
  ClipboardList,
  CalendarDays,
  Calendar,
  MessageSquare,
  List,
} from "lucide-react";

const ALLOWED_TYPES = new Set(["appointment", "schedule", "event", "message"]);

const LeftVisual = ({ type, avatarUrl }) => {
  const box = "h-8 w-8 shrink-0 flex items-center justify-center";
  if (type === "message" && avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt=""
        className="h-8 w-8 rounded-full object-cover shrink-0"
      />
    );
  }
  const Icon =
    type === "appointment"
      ? ClipboardList
      : type === "schedule"
        ? CalendarDays
        : type === "event"
          ? Calendar
          : MessageSquare;
  const color =
    type === "appointment"
      ? "text-red-600"
      : type === "schedule"
        ? "text-amber-500"
        : type === "event"
          ? "text-emerald-600"
          : "text-slate-500";
  return (
    <div className={box}>
      <Icon size={20} className={color} />
    </div>
  );
};

const StatusIcon = ({ read }) =>
  read ? (
    <Check size={18} className="text-gray-400" aria-label="Read" />
  ) : (
    <X size={18} className="text-red-600" aria-label="Unread" />
  );

const Row = ({ n, onToggleRead }) => (
  <button
    type="button"
    onClick={() => onToggleRead(n.id)}
    className="w-full px-3 py-2.5 text-left transition-colors hover:bg-gray-50"
  >
    <div className="flex items-start gap-3">
      <LeftVisual type={n.type} avatarUrl={n.avatarUrl} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-slate-900">{n.text}</p>
        <p className="mt-1 text-xs text-gray-500">{n.time}</p>
      </div>
      <div className="mt-0.5 shrink-0">
        <StatusIcon read={n.read} />
      </div>
    </div>
  </button>
);

const NotificationDropdown = ({ isMobile = false, onOpen }) => {
  const rootRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const toggle = useCallback(() => {
    setIsOpen((v) => {
      const next = !v;
      if (next) onOpen?.();
      return next;
    });
  }, [onOpen]);

  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await new Promise((r) => setTimeout(r, 200));
        const mock = [
          {
            id: 1,
            type: "appointment",
            text: "Appointment booked by John Doe — Aug 22, 10:00 AM (Consultation).",
            time: "2 min ago",
            read: false,
          },
          {
            id: 2,
            type: "schedule",
            text: "Today’s schedule: 3 appointments. First at 9:00 AM.",
            time: "Today, 8:00 AM",
            read: false,
          },
          {
            id: 3,
            type: "event",
            text: "Event soon: Parish Assembly — Aug 25, 3:00 PM.",
            time: "in 2 days",
            read: true,
          },
          {
            id: 4,
            type: "message",
            text: "Jane Roe: “Can we move my appointment to Friday afternoon?”",
            time: "10:31 AM",
            read: false,
            avatarUrl: "/avatars/jane.png",
          },
        ].filter((n) => ALLOWED_TYPES.has(n.type));
        if (mounted) setNotifications(mock);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onDown = (e) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) close();
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [isOpen, close]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  const onToggleRead = (id) =>
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );

  const markAllAsRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  // ---------- Mobile ----------
  if (isMobile) {
    return (
      <div ref={rootRef} className="relative">
        <button
          type="button"
          onClick={toggle}
          className="relative flex items-center gap-3 w-full px-3 py-3 text-sm rounded-lg text-gray-700 hover:bg-gray-100"
        >
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gray-200">
            <Bell size={16} className="text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-[4px] text-[10px] font-medium text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>
          <span>Notifications</span>
        </button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-[200] bg-black/40" onClick={close} />
            <div className="fixed inset-x-3 top-1/2 z-[210] -translate-y-1/2 overflow-hidden rounded-2xl border border-gray-300 bg-white shadow-xl">
              <button
                onClick={close}
                className="absolute right-3 top-3 rounded p-1 hover:bg-gray-200"
                aria-label="Close"
              >
                <X size={18} className="text-gray-500" />
              </button>

              <div className="max-h-96 overflow-y-auto py-2">
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-red-600" />
                    <p className="mt-2 text-sm text-gray-500">Loading…</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell size={32} className="mx-auto mb-2 text-gray-300" />
                    <p className="text-sm text-gray-500">No notifications yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {notifications.map((n) => (
                      <Row key={n.id} n={n} onToggleRead={onToggleRead} />
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-gray-200 px-3 py-2">
                <Link
                  to="/admin/notifications"
                  className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                  onClick={close}
                >
                  <span className="inline-block h-1 w-3 rounded-sm bg-current" />
                  See all
                </Link>
                <button
                  onClick={markAllAsRead}
                  disabled={unreadCount === 0}
                  className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                >
                  Mark all read
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // ---------- Desktop ----------
  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={toggle}
        className="relative flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center">
            <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-medium text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-[26rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-gray-300 bg-white shadow-lg">
          <div className="max-h-96 overflow-y-auto py-4 px-2 custom-scrollbar">
            {loading ? (
              <div className="p-8 pt-2 text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-red-600" />
                <p className="mt-2 text-sm text-gray-500">Loading…</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 pt-2 text-center">
                <Bell size={32} className="mx-auto mb-2 text-gray-300" />
                <p className="text-sm text-gray-500">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {notifications.map((n) => (
                  <Row key={n.id} n={n} onToggleRead={onToggleRead} />
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 border-t bg-gray-100/90 border-gray-200 px-3 py-2">
            <Link
              to="/admin/notifications"
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              onClick={close}
            >
              <List size={16} />
              See all
            </Link>
            <button
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              Mark all read
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default NotificationDropdown;
