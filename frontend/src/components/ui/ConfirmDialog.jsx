"use client";
import React from "react";
import { AlertTriangle } from "lucide-react";

export default function ConfirmDialog({
    open,
    title,
    message,
    onConfirm,
    onCancel,
    submitting = false,
}) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-2xl border border-gray-200 max-w-sm w-full p-6 relative">
                <div className="flex items-center gap-2 text-red-600 mb-3">
                    <AlertTriangle className="h-5 w-5" />
                    <h3 className="font-semibold text-base">{title}</h3>
                </div>

                <p className="text-sm text-gray-700 mb-4">{message}</p>

                <div className="flex justify-end gap-2">
                    <button
                        onClick={onCancel}
                        disabled={submitting}
                        className="px-4 py-2 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={submitting}
                        className="flex items-center gap-2 px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                    >
                        {submitting && (
                            <svg
                                className="h-4 w-4 animate-spin text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                />
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                />
                            </svg>
                        )}
                        {submitting ? "Processing..." : "Confirm"}
                    </button>
                </div>
            </div>
        </div>
    );
}
