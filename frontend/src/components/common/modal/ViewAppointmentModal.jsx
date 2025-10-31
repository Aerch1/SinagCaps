"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  X,
  Pencil,
  CalendarClock,
  Clock,
  Tag,
  Mail,
  Phone,
  MapPin,
  ClipboardList,
  Check,
  Archive,
} from "lucide-react";
import api from "@/api/api";
import toast from "react-hot-toast";
import { formatDate, to12h } from "@/utils/availabilityUtils";
import { statusClass } from "@/lib/utils";
import ProcessModal from "../ProcessModal";
import RejectCancelModal from "./RejectCancelModal";
import RescheduleModal from "./RescheduleModal";
import DocumentsSection from "../DocumentsSection";
import ApproveConfirmationModal from "./ApproveConfirmationModal.jsx";
import { fetchRequirementsProgress } from "../../../utils/requirementsUtils.js";

/* ---------- Label + Value helpers ---------- */
function formatLabel(key) {
  const map = {
    childFullName: "Buong Pangalan ng Bibinyagan",
    childDob: "Araw ng Kapanganakan",
    childBirthplace: "Lugar ng Kapanganakan",
    fatherName: "Pangalan ng Ama",
    motherMaidenName: "Pangalan ng Ina (Bago Ikasal)",
    parentsMarriageType: "Uri ng Kasal ng mga Magulang",
    confirmandName: "Buong Pangalan ng Kukumpilan",
    confirmandDob: "Araw ng Kapanganakan",
    confirmandBirthplace: "Lugar ng Kapanganakan",
    parishOrigin: "Parokyang Pinanggalingan",
    baptizedAt: "Bininyagan sa Parokya ng",
    baptizedOn: "Araw ng Binyag",
  };
  return map[key] || key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
}

function formatFieldValue(key, val) {
  if (!val) return "—";
  if (["childDob", "confirmandDob", "baptizedOn"].includes(key)) return formatDate(val);
  if (key === "parentsMarriageType") {
    const map = {
      church: "Church Marriage",
      civil: "Civil Marriage",
      unmarried: "Unmarried / Not Married",
    };
    return map[val] || val;
  }
  return val;
}

/* ---------- MAIN MODAL ---------- */
export default function ViewAppointmentModal({ isOpen, onClose, appointmentId, onUpdate }) {
  const [local, setLocal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [reqProgress, setReqProgress] = useState({ done: 0, total: 0 });
  const [showProcess, setShowProcess] = useState(false);
  const [hidePanel, setHidePanel] = useState(false);

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false); // ✅ NEW
  const [documents, setDocuments] = useState([]);

  // Update the fetch details useEffect to include documents
  useEffect(() => {
    if (!isOpen || !appointmentId) return;
    const fetchDetails = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/admin/appointments/${appointmentId}`);
        const appt = res.data?.appointment || {};
        setLocal({
          id: appt.id,
          name: appt.name,
          email: appt.email,
          contactNumber: appt.contactNumber,
          address: appt.address,
          service_id: appt.service_id,
          serviceName: appt.serviceName,
          date: appt.date,
          time: appt.time,
          status: appt.status,
          notes: appt.notes,
          details: res.data?.details || null,
          sponsors: res.data?.sponsors || [],
        });

        // ✅ Fetch documents
        setDocuments(res.data?.documents || []);

        // ✅ Fetch requirements using utility function
        const progress = await fetchRequirementsProgress(appointmentId);
        setReqProgress(progress);
      } catch (err) {
        console.error("❌ Failed to fetch appointment details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [isOpen, appointmentId]);

  /* 🔹 Handle approve click - show confirmation modal */
  const handleApproveClick = () => {
    setShowApproveConfirm(true);
  };

  /* 🔹 Handle status update */
  const handleStatusChange = async (newStatus) => {
    if (!appointmentId) return;
    const toastId = toast.loading("Updating appointment...");
    try {
      // ✅ Only send date/time and other fields if not approving
      const payload =
        newStatus === "approved"
          ? { status: newStatus } // simple payload avoids reschedule check
          : {
            status: newStatus,
            service_id: local?.service_id,
            date: local?.date,
            time: local?.time,
            name: local?.name,
            email: local?.email,
            contactNumber: local?.contactNumber,
            address: local?.address,
            notes: local?.notes || "",
          };

      await api.patch(`/admin/appointments/${appointmentId}`, payload);

      const updated = { ...local, status: newStatus };
      setLocal(updated);
      toast.success("Appointment updated successfully!", { id: toastId });
      onUpdate?.(updated); // 🔄 Trigger TodaySchedule refresh immediately
    } catch (err) {
      console.error("❌ update failed:", err);
      toast.error("Failed to update appointment", { id: toastId });
    }
  };

  /* 🔹 Trigger modal with panel hide */
  const triggerWithHide = (modalSetter) => {
    setHidePanel(true);
    modalSetter(true);
  };

  const initials = useMemo(() => {
    const n = String(local?.name || "").trim();
    return n
      ? n
        .split(/\s+/)
        .slice(0, 2)
        .map((s) => s[0])
        .join("")
        .toUpperCase()
      : "??";
  }, [local?.name]);

  if (!isOpen && !showProcess) return null;

  if (!local && !loading)
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-[999]">
        <div className="bg-white px-6 py-4 rounded-lg shadow">
          <p className="text-sm text-gray-700">No appointment selected</p>
        </div>
      </div>
    );

  const status = local?.status?.toLowerCase();
  const isAdminCreated = local?.createdBy === "admin" || local?.role === "admin";
  console.log("🕒 Appointment:", local?.date, local?.time);

  /* ---------- RENDER ---------- */
  return (
    <>
      {!hidePanel && isOpen && (
        <div className="fixed inset-0 bg-black/40 z-[999]" onClick={onClose} />
      )}

      {!hidePanel && isOpen && (
        <aside className="fixed right-0 top-0 z-[1000] w-full max-w-2xl h-screen bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
          {/* HEADER */}
          <header className="flex items-center justify-between px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Transaction ID
              </p>
              <h2 className="text-lg font-bold text-gray-900 mt-0.5">
                #{local?.id || "—"}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {isAdminCreated && (
                <button
                  onClick={() => setIsEditing((v) => !v)}
                  className="p-2.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* CONTENT */}
          <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6 space-y-6 bg-gray-50/50">
            {loading ? (
              <div className="flex items-center justify-center h-64 text-gray-500 text-sm">
                Loading appointment details…
              </div>
            ) : (
              <>
                {/* CLIENT INFO */}
                <section className="bg-white rounded-xl border p-5">
                  <div className="flex items-start gap-4">
                    <div className="h-14 w-14 rounded-full bg-blue-600 flex items-center justify-center text-white text-base font-semibold shadow-sm">
                      {initials}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 uppercase mb-1">Client</p>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {local?.name || "—"}
                      </h3>
                    </div>
                  </div>
                </section>

                {/* APPOINTMENT DETAILS */}
                <section className="bg-white rounded-xl border p-5">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-4 flex items-center gap-2">
                    <div className="w-1 h-4 bg-blue-500 rounded-full" />
                    Appointment Details
                  </h4>
                  <div className="grid md:grid-cols-3 gap-4">
                    <Detail
                      icon={CalendarClock}
                      label="Date & Time"
                      value={
                        local?.date
                          ? `${formatDate(local.date)} · ${to12h(local?.time)}`
                          : "—"
                      }
                    />
                    <Detail icon={Tag} label="Service" value={local?.serviceName} />
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-gray-50 rounded-lg">
                        <Clock className="w-4 h-4 text-gray-500" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Status</p>
                        <span className={statusClass(local?.status)}>
                          {local?.status?.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* ADDITIONAL DETAILS */}
                {local?.details && (
                  <section className="bg-white rounded-xl border p-5">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-4 flex items-center gap-2">
                      <div className="w-1 h-4 bg-purple-500 rounded-full" />
                      Additional Information
                    </h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      {Object.entries(local.details).map(([key, value]) => (
                        <Detail
                          key={key}
                          icon={ClipboardList}
                          label={formatLabel(key)}
                          value={formatFieldValue(key, value)}
                        />
                      ))}
                    </div>

                    {local.sponsors?.length > 0 && (
                      <div className="mt-6">
                        <h5 className="text-xs font-semibold text-gray-500 uppercase mb-3">
                          Sponsors
                        </h5>
                        <ul className="divide-y divide-gray-200 border rounded-lg bg-gray-50">
                          {local.sponsors.map((s, idx) => (
                            <li
                              key={idx}
                              className="p-3 text-sm text-gray-800 flex justify-between"
                            >
                              <span>{s.name}</span>
                              <span className="text-gray-500">{s.role}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </section>
                )}

                {/* REQUIREMENTS */}
                <section className="bg-white rounded-xl border p-5">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-4 flex items-center gap-2">
                    <div className="w-1 h-4 bg-indigo-500 rounded-full" />
                    Requirements
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-700">
                        {reqProgress.total === 0
                          ? "No requirements yet"
                          : `${reqProgress.done}/${reqProgress.total} completed`}
                      </p>
                      <button
                        onClick={() => {
                          setShowProcess(true);
                          setHidePanel(true);
                        }}
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <ClipboardList className="w-3.5 h-3.5" />
                        View All
                      </button>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width:
                            reqProgress.total > 0
                              ? `${(reqProgress.done / reqProgress.total) * 100}%`
                              : "0%",
                          backgroundColor:
                            reqProgress.done === reqProgress.total
                              ? "#22c55e"
                              : "#3b82f6",
                        }}
                        transition={{ duration: 0.5 }}
                        className="h-2 rounded-full"
                      />
                    </div>
                  </div>
                </section>

                <DocumentsSection documents={documents} />

                {/* CONTACT INFO */}
                <section className="bg-white rounded-xl border p-5">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-4 flex items-center gap-2">
                    <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                    Contact Information
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <Detail icon={Mail} label="Email" value={local?.email} />
                    <Detail icon={Phone} label="Phone" value={local?.contactNumber} />
                    <Detail icon={MapPin} label="Address" value={local?.address} />
                  </div>
                </section>

                {/* NOTES */}
                <section className="bg-white rounded-xl border p-5">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-4 flex items-center gap-2">
                    <div className="w-1 h-4 bg-rose-500 rounded-full" />
                    Notes
                  </h4>
                  <div className="border rounded-lg p-3 bg-gray-50">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {local?.notes?.trim() || "—"}
                    </p>
                  </div>
                </section>
              </>
            )}
          </div>

          {/* FOOTER: Render only if buttons exist */}
          {window.location.href !== "https://lodlod.olpgvp.com/admin/appointments?status=requests" &&
            ((status === "pending") ||
              (status === "approved") ||
              (status === "completed" && local?.status) ||
              (local?.status?.toLowerCase() === "approved" && local?.date && local?.time)) && (
              <footer className="border-t border-gray-200 px-6 py-4 bg-white flex justify-between items-center shadow-lg">
                {/* Left Side: Mark Completed */}
                <div>
                  {local?.status?.toLowerCase() === "approved" &&
                    local?.date &&
                    local?.time &&
                    (() => {
                      const now = new Date();
                      const datePart = local.date.split("T")[0];
                      let apptDateTime = new Date(`${datePart}T${local.time}`);
                      if (isNaN(apptDateTime))
                        apptDateTime = new Date(`${datePart} ${local.time}`);
                      const isPast = now > apptDateTime;

                      if (isPast) {
                        return (
                          <button
                            onClick={() => handleStatusChange("completed")}
                            className="px-3 py-2 text-sm rounded-md border border-green-600 text-green-700 hover:bg-green-50 flex items-center gap-1"
                          >
                            <Check className="w-4 h-4" /> Mark Completed
                          </button>
                        );
                      }
                      return null;
                    })()}
                </div>

                {/* Right Side: Other Actions */}
                <div className="flex gap-2">
                  {status === "pending" && (
                    <>
                      <button
                        onClick={handleApproveClick} // ✅ Changed to show confirmation
                        className="px-3 py-2 text-sm rounded-md border border-green-500 text-green-600 hover:bg-green-50 flex items-center gap-1"
                      >
                        <Check className="w-4 h-4" /> Approve
                      </button>
                      <button
                        onClick={() => triggerWithHide(setShowRejectModal)}
                        className="px-3 py-2 text-sm rounded-md border border-red-500 text-red-600 hover:bg-red-50 flex items-center gap-1"
                      >
                        <X className="w-4 h-4" /> Reject
                      </button>
                    </>
                  )}

                  {status === "approved" && (
                    <>
                      <button
                        onClick={() => triggerWithHide(setShowRescheduleModal)}
                        className="px-3 py-2 text-sm rounded-md border border-blue-500 text-blue-600 hover:bg-blue-50 flex items-center gap-1"
                      >
                        <CalendarClock className="w-4 h-4" /> Reschedule
                      </button>
                      <button
                        onClick={() => triggerWithHide(setShowCancelModal)}
                        className="px-3 py-2 text-sm rounded-md border border-red-500 text-red-600 hover:bg-red-50 flex items-center gap-1"
                      >
                        <X className="w-4 h-4" /> Cancel
                      </button>
                    </>
                  )}

                  {status === "completed" && (
                    <button
                      onClick={() => handleStatusChange("archived")}
                      className="px-3 py-2 text-sm rounded-md border border-gray-400 text-gray-700 hover:bg-gray-50 flex items-center gap-1"
                    >
                      <Archive className="w-4 h-4" /> Archive
                    </button>
                  )}
                </div>
              </footer>
            )}
        </aside>
      )}

      {/* ✅ NEW: Approve Confirmation Modal */}
      <ApproveConfirmationModal
        open={showApproveConfirm}
        onClose={() => setShowApproveConfirm(false)}
        onConfirm={() => {
          setShowApproveConfirm(false);
          handleStatusChange("approved");
        }}
        requirementsProgress={reqProgress}
      />

      {/* 🔹 MODALS */}
      <RescheduleModal
        open={showRescheduleModal}
        onClose={() => {
          setShowRescheduleModal(false);
          setHidePanel(false);
        }}
        appointment={local}
        onSuccess={(updated) => {
          setShowRescheduleModal(false);
          setHidePanel(false);
          const newData = { ...local, ...updated, was_rescheduled: true };
          setLocal(newData);
          onUpdate?.(newData);
        }}
      />

      <RejectCancelModal
        open={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setHidePanel(false);
        }}
        type="reject"
        appointment={local}
        onSuccess={() => {
          const updated = { ...local, status: "rejected" };
          setShowRejectModal(false);
          setHidePanel(false);
          setLocal(updated);
          onUpdate?.(updated);
        }}
      />

      <RejectCancelModal
        open={showCancelModal}
        onClose={() => {
          setShowCancelModal(false);
          setHidePanel(false);
        }}
        type="cancel"
        appointment={local}
        onSuccess={() => {
          const updated = { ...local, status: "cancelled" };
          setShowCancelModal(false);
          setHidePanel(false);
          setLocal(updated);
          onUpdate?.(updated);
        }}
      />

      {showProcess && (
        <ProcessModal
          appointment={local}
          onClose={async () => {
            try {
              // ✅ Refresh requirements progress using utility function
              const progress = await fetchRequirementsProgress(appointmentId);
              setReqProgress(progress);
            } catch (err) {
              console.error("Failed to refresh requirements:", err);
            }
            setShowProcess(false);
            setHidePanel(false);
          }}
          onSave={async () => {
            // ✅ Refresh requirements progress using utility function
            const progress = await fetchRequirementsProgress(appointmentId);
            setReqProgress(progress);
          }}
          onComplete={() => {
            setShowProcess(false);
            setHidePanel(false);
            onUpdate?.(local);
          }}
        />
      )}
    </>
  );
}

/* ---------- Detail Helper ---------- */
function Detail({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="p-2 rounded-lg bg-gray-50 shrink-0">
        <Icon className="w-4 h-4 text-gray-500" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
        <p className="text-sm font-medium text-gray-900 break-words">
          {value || "—"}
        </p>
      </div>
    </div>
  );
}