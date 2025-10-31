import React from "react";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

export default function ApproveConfirmationModal({
    open,
    onClose,
    onConfirm,
    requirementsProgress,
}) {
    if (!open) return null;

    const { done, total } = requirementsProgress;
    const allCompleted = done === total && total > 0;
    const noneCompleted = done === 0;
    const hasRequirements = total > 0;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-[1001]"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-[1002] flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in-95 duration-200">
                    {/* Header */}
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-start gap-4">
                            {allCompleted ? (
                                <div className="p-2 bg-green-100 rounded-full">
                                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                                </div>
                            ) : (
                                <div className="p-2 bg-yellow-100 rounded-full">
                                    <AlertTriangle className="w-6 h-6 text-yellow-600" />
                                </div>
                            )}
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {allCompleted
                                        ? "Approve Appointment"
                                        : "Incomplete Requirements"}
                                </h3>
                                <p className="text-sm text-gray-600 mt-1">
                                    {allCompleted
                                        ? "All requirements have been completed."
                                        : "Some requirements are not yet completed."}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-4">
                        {hasRequirements ? (
                            <>
                                {/* Requirements Status */}
                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-medium text-gray-700">
                                            Requirements Progress
                                        </span>
                                        <span
                                            className={`text-sm font-semibold ${allCompleted
                                                    ? "text-green-600"
                                                    : noneCompleted
                                                        ? "text-red-600"
                                                        : "text-yellow-600"
                                                }`}
                                        >
                                            {done}/{total} Completed
                                        </span>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                        <div
                                            className={`h-2 rounded-full transition-all duration-500 ${allCompleted
                                                    ? "bg-green-500"
                                                    : noneCompleted
                                                        ? "bg-red-500"
                                                        : "bg-yellow-500"
                                                }`}
                                            style={{
                                                width: total > 0 ? `${(done / total) * 100}%` : "0%",
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Warning Message */}
                                {!allCompleted && (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                        <div className="flex gap-3">
                                            <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                                            <div className="text-sm text-yellow-800">
                                                {noneCompleted ? (
                                                    <p>
                                                        <strong>No requirements completed yet.</strong> Are
                                                        you sure you want to approve this appointment
                                                        without any completed requirements?
                                                    </p>
                                                ) : (
                                                    <p>
                                                        <strong>
                                                            Only {done} out of {total} requirements completed.
                                                        </strong>{" "}
                                                        Approving now means the client can proceed even
                                                        though {total - done} requirement
                                                        {total - done !== 1 ? "s are" : " is"} still
                                                        pending.
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Success Message */}
                                {allCompleted && (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                        <div className="flex gap-3">
                                            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                                            <p className="text-sm text-green-800">
                                                All requirements have been completed. You can safely
                                                approve this appointment.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            /* No Requirements */
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                                    <p className="text-sm text-blue-800">
                                        This service has no requirements. You can approve this
                                        appointment directly.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Confirmation Question */}
                        <p className="text-sm text-gray-700 font-medium text-center pt-2">
                            Do you want to proceed with approving this appointment?
                        </p>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${allCompleted || !hasRequirements
                                    ? "bg-green-600 hover:bg-green-700"
                                    : "bg-yellow-600 hover:bg-yellow-700"
                                }`}
                        >
                            {allCompleted || !hasRequirements
                                ? "Approve"
                                : "Approve Anyway"}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}