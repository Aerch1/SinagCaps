"use client";
import { ClipboardList, Calendar, FileText } from "lucide-react";
import Modal from "@/components/ui/Modal";

export default function NotificationModal({ open, onClose, notification }) {
    if (!notification) return null;

    const Icon =
        notification.type === "appointment"
            ? ClipboardList
            : notification.type === "event"
                ? Calendar
                : notification.type === "document"
                    ? FileText
                    : null;

    const formattedDate = new Date(notification.createdAt).toLocaleString("en-PH", {
        timeZone: "Asia/Manila",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={notification.title || "Notification Details"}
            className="max-w-lg"
        >
            <div className="space-y-4 text-sm text-gray-700">
                {/* Header Section */}
                <div className="flex items-center gap-3 border-b pb-2">
                    {Icon && <Icon size={20} className="text-gray-600" />}
                    <div>
                        <p className="font-medium text-gray-900">{notification.title}</p>
                        <p className="text-xs text-gray-500">{formattedDate}</p>
                    </div>
                </div>

                {/* 🆕 Transaction / Reference Info */}
                {notification.reference_id || notification.transaction_id ? (
                    <div className="bg-gray-50 border border-gray-200 rounded-md p-2.5 text-xs text-gray-600">
                        <p>
                            <span className="font-medium text-gray-800">Transaction ID:</span>{" "}
                            {notification.transaction_id
                                ? notification.transaction_id
                                : `APT-${String(notification.reference_id).padStart(5, "0")}`}
                        </p>
                    </div>
                ) : null}

                {/* Message Body */}
                <div className="whitespace-pre-wrap leading-relaxed text-gray-700">
                    {notification.message || "No message content."}
                </div>

                {/* Footer (View Details button) */}
                {notification.reference_id && (
                    <div className="pt-3">
                        <button
                            onClick={() => {
                                if (notification.type === "appointment") {
                                    window.location.href = `/admin/appointments/${notification.reference_id}`;
                                } else if (notification.type === "document") {
                                    window.location.href = `/admin/documents/${notification.reference_id}`;
                                }
                            }}
                            className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 transition"
                        >
                            View Details
                        </button>
                    </div>
                )}
            </div>
        </Modal>
    );
}
