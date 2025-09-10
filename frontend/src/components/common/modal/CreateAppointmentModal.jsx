"use client";

import { format } from "date-fns";
import Modal from "../../ui/Modal";
import CreateAppointmentForm from "../../../forms/CreateAppointmentForm";

/**
 * UI shell only: owns open/close visuals and hosts the form.
 */
export default function CreateAppointmentModal({
    isOpen,
    onClose,
    onSave,
    selectedDate,
    fetchAvailableTimes,
}) {
    const defaultDate = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";

    const handleSubmit = async (data) => {
        await onSave?.(data);
        onClose(); // auto-close after save
    };

    return (
        <Modal open={isOpen} onClose={onClose} title="Create Appointment" className="max-w-3xl  dark:bg-slate-800 ">
            <div
                className="max-h-[90vh]  overflow-y-auto p-2 custom-scrollbar dark:scrollbar-thumb-slate-600"
            >
                <div className="w-[700px] max-w-full"> {/* wider form */}
                    <CreateAppointmentForm
                        defaultDate={defaultDate}
                        onSubmit={handleSubmit}
                        onCancel={onClose}         
                        fetchAvailableTimes={fetchAvailableTimes}
                    />
                </div>
            </div>
        </Modal>
    );
}
