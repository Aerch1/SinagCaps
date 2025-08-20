// src/components/common/modal/CreateAppointmentModal.jsx
"use client";

import { X } from "lucide-react";
import { format } from "date-fns";
import CreateAppointmentForm from "../../../forms/CreateAppointmentForm";

export default function CreateAppointmentModal({
    isOpen,
    onClose,
    onSave,
    selectedDate,
    fetchAvailableTimes, // async (dateISO, serviceType) => Promise<string[]>
}) {
    if (!isOpen) return null;

    const defaultDate = selectedDate ? format(selectedDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd");

    return (
        <div
            className="fixed inset-0 z-[99] bg-black/40 p-3 md:p-6 flex items-center justify-center"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-appointment-title"
        >
            {/* h-[90vh] on small screens, full h-screen on md+; inner scrollable */}
            <div className="w-full max-w-3xl bg-white dark:bg-slate-800 rounded-2xl shadow-xl h-[90vh] md:h-screen flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-5 md:px-6 py-4 md:py-5 border-b border-gray-200 dark:border-slate-700">
                    <div>
                        <h2 id="create-appointment-title" className="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-100">
                            Create Appointment
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Fill out the essentials. Status defaults to Pending.
                        </p>
                    </div>
                    <button
                        id="create-appointment-close"
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-300 transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Scrollable body */}
                <div className="flex-1 overflow-y-auto px-5 md:px-6 py-5">
                    <CreateAppointmentForm
                        defaultDate={defaultDate}
                        onSubmit={onSave}
                        fetchAvailableTimes={fetchAvailableTimes}
                    />
                </div>
            </div>
        </div>
    );
}
