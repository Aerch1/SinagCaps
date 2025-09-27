"use client";
import React from "react";
import { AlertTriangle } from "lucide-react";
import Modal from "./Modal";

export default function ConfirmDialog({ open, title, message, onConfirm, onCancel }) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/40 z-[102] flex items-center justify-center ">
            <div className="bg-white rounded-lg shadow-lg max-w-sm w-full p-6">
                <div className="flex items-center gap-2 text-red-600 mb-3">
                    <AlertTriangle className="h-5 w-5" />
                    <h3 className="font-semibold text-base">{title}</h3>
                </div>
                <p className="text-sm text-gray-700 mb-6">{message}</p>
                <div className="flex justify-end gap-2">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
}
