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
  FileText,
} from "lucide-react";
import api from "@/api/api";
import NotificationModal from "../../common/modal/NotificationModal"; // 🆕 Added

const ALLOWED_TYPES = new Set([
  "appointment",
  "schedule",
  "event",
  "message",
  "announcement",
  "advisory",
  "document",
]);

const LeftVisual = ({ type, avatarUrl, unread }) => {
  const box = `h-8 w-8 shrink-0 flex items-center justify-center rounded-md ${unread ? "ring-2 ring-gray-300" : ""
    }`;

  if (type === "message" && avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt=""
        className={`h-8 w-8 rounded-full object-cover shrink-0 ${unread ? "ring-2 ring-gray-300" : ""
          }`}
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
          : type === "document"
            ? FileText
            : MessageSquare;

  const color =
    type === "appointment"
      ? "text-red-500"
      : type === "schedule"
        ? "text-gray-500"
        : type === "event"
          ? "text-green-600"
          : type === "document"
            ? "text-blue-600"
            : "text-gray-500";

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
    <X size={18} className="text-gray-500" aria-label="Unread" />
  );

const Row = ({ n, onClick }) => {
  const isUnread = !n.isRead;

  return (
    <button
      type="button"
      onClick={() => onClick(n)} // 🆕 triggers modal
      className={`w-full px-3 py-2.5 text-left transition-colors rounded-md ${isUnread ? "bg-gray-50 hover:bg-gray-100" : "hover:bg-gray-50"
        }`}
    >
      <div className="flex items-start gap-3">
        <LeftVisual type={n.type} avatarUrl={n.avatarUrl} unread={isUnread} />
        <div className="min-w-0 flex-1">
          <p
            className={`truncate text-sm ${isUnread ? "text-gray-900 font-medium" : "text-gray-700"
              }`}
          >
            {n.title || n.text}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {new Date(n.createdAt).toLocaleString("en-PH", {
              timeZone: "Asia/Manila",
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            })}
          </p>
        </div>
        <StatusIcon read={n.isRead} />
      </div>
    </button>
  );
};

export default function NotificationDropdown({ isMobile = false, onOpen }) {
  const rootRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [selectedNotif, setSelectedNotif] = useState(null); // 🆕
  const [showModal, setShowModal] = useState(false); // 🆕

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
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

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get("/admin/notifications");
      if (res.data.success) {
        setNotifications(
          (res.data.notifications || []).filter((n) =>
            ALLOWED_TYPES.has(n.type)
          )
        );
      }
    } catch (err) {
      console.error("❌ Failed to load notifications:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const onClickNotification = async (n) => {
    try {
      // ✅ Close dropdown first to prevent overlap
      close();

      // Mark as read if unread
      if (!n.isRead) {
        await api.patch(`/admin/notifications/${n.id}/read`);
        setNotifications((prev) =>
          prev.map((item) =>
            item.id === n.id ? { ...item, isRead: true } : item
          )
        );
      }

      // ✅ Then open modal after a short delay for smoothness
      setTimeout(() => {
        setSelectedNotif(n);
        setShowModal(true);
      }, 150);
    } catch (err) {
    }
  };


  const markAllAsRead = async () => {
    try {
      await Promise.all(
        notifications
          .filter((n) => !n.isRead)
          .map((n) => api.patch(`/admin/notifications/${n.id}/read`))
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.warn("⚠️ Failed to mark all as read:", err.message);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={toggle}
        className={`relative flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 ${isOpen ? "bg-gray-100 text-gray-800" : ""
          }`}
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center">
            <span className="absolute inline-flex h-full w-full rounded-full bg-gray-400 opacity-75" />
            <span className="relative inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-600 text-xs font-medium text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-[26rem] max-w-[calc(100vw-2rem)] rounded-lg border border-gray-200 bg-white shadow-md z-[200] overflow-hidden">
          <div className="max-h-[28rem] overflow-y-auto py-3 px-2 custom-scrollbar">
            {loading ? (
              <div className="p-8 text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-gray-500" />
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
                  <Row key={n.id} n={n} onClick={onClickNotification} />
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 border-t bg-gray-50 border-gray-200 px-3 py-2">
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

      {/* 🆕 Notification Detail Modal */}
      {showModal && (
        <NotificationModal
          open={showModal}
          onClose={() => setShowModal(false)}
          notification={selectedNotif}
        />
      )}
    </div>
  );
}
