"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
    Search,
    Filter,
    FileText,
    Clock,
    CheckCircle,
    Trash2,
} from "lucide-react";
import Dropdown from "@/components/ui/Dropdown1";
import Modal from "@/components/ui/Modal";
import api from "@/api/api";
import toast from "react-hot-toast";

export default function AdminDocumentManagement() {
    const [requests, setRequests] = useState([]);
    const [filterStatus, setFilterStatus] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);

    /* =============================
       Fetch all document requests
    ============================== */
    const fetchRequests = async () => {
        try {
            setLoading(true);
            const res = await api.get("/admin/document-requests");
            setRequests(res.data?.data || []);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load document requests");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    /* =============================
       Update Status
    ============================== */
    const updateStatus = async (id, newStatus) => {
        try {
            const toastId = toast.loading("Updating status...");
            await api.patch(`/admin/document-requests/${id}/status`, {
                status: newStatus,
            });
            toast.success(`Marked as ${newStatus}`, { id: toastId });
            fetchRequests();
            if (selectedRequest?.id === id)
                setSelectedRequest({ ...selectedRequest, status: newStatus });
        } catch (err) {
            console.error(err);
            toast.error("Failed to update status");
        }
    };

    /* =============================
       Stats
    ============================== */
    const stats = useMemo(
        () => ({
            total: requests.length,
            pending: requests.filter((r) => r.status === "pending").length,
            processing: requests.filter((r) => r.status === "processing").length,
            completed: requests.filter((r) => r.status === "completed").length,
        }),
        [requests]
    );

    /* =============================
       Filtering + Search
    ============================== */
    const filteredRequests = useMemo(() => {
        const q = searchTerm.toLowerCase().trim();
        return requests.filter((r) => {
            const matchesStatus = filterStatus === "all" || r.status === filterStatus;
            const matchesSearch =
                r.full_name?.toLowerCase().includes(q) ||
                r.email?.toLowerCase().includes(q) ||
                r.document_type?.toLowerCase().includes(q) ||
                r.request_code?.toLowerCase().includes(q) ||
                r.id?.toString().includes(q);
            return matchesStatus && matchesSearch;
        });
    }, [requests, filterStatus, searchTerm]);

    const viewDetails = (req) => {
        setSelectedRequest(req);
        setShowModal(true);
    };

    /* =============================
       UI Mappings
    ============================== */
    const documentTypeLabels = {
        baptism: "Certificate of Baptism",
        confirmation: "Certificate of Confirmation",
        marriage: "Certificate of Marriage",
        "first-communion": "Certificate of First Communion",
        death: "Certificate of Death/Burial",
        membership: "Certificate of Membership",
        other: "Other",
    };

    const statusColors = {
        pending: "bg-yellow-100 text-yellow-800",
        processing: "bg-blue-100 text-blue-800",
        completed: "bg-green-100 text-green-800",
        rejected: "bg-red-100 text-red-800",
    };

    /* =============================
       RENDER
    ============================== */
    return (
        <div className="space-y-4 lg:space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900">
                    Document Requests
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Manage certificate requests submitted by parishioners.
                </p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-5">
                <StatCard label="Total Requests" value={stats.total} icon={FileText} />
                <StatCard
                    label="Pending"
                    value={stats.pending}
                    color="text-yellow-600"
                    icon={Clock}
                />
                <StatCard
                    label="Processing"
                    value={stats.processing}
                    color="text-blue-600"
                    icon={Clock}
                />
                <StatCard
                    label="Completed"
                    value={stats.completed}
                    color="text-green-600"
                    icon={CheckCircle}
                />
            </div>

            {/* Search + Filter */}
            <div className="border rounded-lg bg-white shadow-sm p-3 sm:p-4 lg:p-6 space-y-3">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name, document, or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 sm:pl-10 pr-3 py-1.5 sm:py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-amber-700 focus:border-transparent"
                        />
                    </div>

                    <Dropdown
                        icon={Filter}
                        options={[
                            { label: "All Status", value: "all" },
                            { label: "Pending", value: "pending" },
                            { label: "Processing", value: "processing" },
                            { label: "Completed", value: "completed" },
                            { label: "Rejected", value: "rejected" },
                        ]}
                        value={filterStatus}
                        onChange={setFilterStatus}
                        label="Filter"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="border rounded-lg bg-white shadow-sm p-3 sm:p-4 lg:p-6 overflow-x-auto">
                {loading ? (
                    <p className="text-center text-gray-500 py-8">Loading requests...</p>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                {[
                                    "Request ID",
                                    "Name",
                                    "Document Type",
                                    "Date Requested",
                                    "Status",
                                    "Actions",
                                ].map((h) => (
                                    <th
                                        key={h}
                                        className="px-3 lg:px-6 py-2 lg:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredRequests.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan="6"
                                        className="py-8 text-center text-gray-500 text-sm"
                                    >
                                        No requests found
                                    </td>
                                </tr>
                            ) : (
                                filteredRequests.map((r) => (
                                    <tr key={r.id} className="hover:bg-gray-50">
                                        <td className="px-3 lg:px-6 py-2 font-medium text-gray-900">
                                            {r.request_code || r.id}
                                        </td>
                                        <td className="px-3 lg:px-6 py-2">
                                            <div className="font-medium text-gray-900">
                                                {r.full_name}
                                            </div>
                                            <div className="text-xs text-gray-500 truncate">
                                                {r.email}
                                            </div>
                                        </td>
                                        <td className="px-3 lg:px-6 py-2 text-gray-700">
                                            {documentTypeLabels[r.document_type]}
                                        </td>
                                        <td className="px-3 lg:px-6 py-2 text-gray-700">
                                            {new Date(r.created_at).toLocaleDateString("en-PH")}
                                        </td>
                                        <td className="px-3 lg:px-6 py-2 text-center">
                                            <span
                                                className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[r.status]}`}
                                            >
                                                {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                                            </span>

                                            {r.status === "completed" && (
                                                <p className="text-[10px] text-green-700 mt-0.5 font-medium">
                                                    ✅ Ready for pick-up
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-3 lg:px-6 py-2 text-sm">
                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    onClick={() => viewDetails(r)}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 text-xs"
                                                >
                                                    <FileText className="h-3.5 w-3.5" />
                                                    View
                                                </button>
                                                {r.status === "pending" && (
                                                    <button
                                                        onClick={() => updateStatus(r.id, "rejected")}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1 border border-red-300 rounded-md text-red-600 hover:bg-red-50 text-xs"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                        Reject
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal */}
            <Modal
                open={showModal}
                onClose={() => setShowModal(false)}
                title={
                    selectedRequest
                        ? `Request Details – ${selectedRequest.request_code || selectedRequest.id}`
                        : ""
                }

            >
                {selectedRequest && (
                    <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-1 custom-scrollbar">
                        {/* ✅ Status Indicator */}
                        <div>
                            <span
                                className={`px-4 py-2 inline-flex text-sm font-semibold rounded-full ${statusColors[selectedRequest.status]}`}
                            >
                                {selectedRequest.status.charAt(0).toUpperCase() +
                                    selectedRequest.status.slice(1)}
                            </span>
                            {selectedRequest.status === "completed" && (
                                <span className="ml-3 text-sm text-green-700 font-medium">
                                    ✅ Ready for pick-up by requester
                                </span>
                            )}
                        </div>

                        <Section
                            title="Personal Information"
                            data={[
                                ["Full Name", selectedRequest.full_name],
                                ["Email", selectedRequest.email],
                                ["Phone", selectedRequest.phone],
                                ["Address", selectedRequest.address],
                            ]}
                        />

                        <Section
                            title="Document Information"
                            data={[
                                [
                                    "Document Type",
                                    documentTypeLabels[selectedRequest.document_type],
                                ],
                                ["Number of Copies", selectedRequest.copies],
                                ["Purpose", selectedRequest.purpose],
                                ...(selectedRequest.additional_info
                                    ? [["Additional Information", selectedRequest.additional_info]]
                                    : []),
                            ]}
                        />

                        <div className="pt-6 border-t border-gray-200 flex flex-wrap gap-3">
                            {selectedRequest.status === "pending" && (
                                <>
                                    <button
                                        onClick={() =>
                                            updateStatus(selectedRequest.id, "processing")
                                        }
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
                                    >
                                        Mark as Processing
                                    </button>
                                    <button
                                        onClick={() => updateStatus(selectedRequest.id, "rejected")}
                                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium"
                                    >
                                        Reject Request
                                    </button>
                                </>
                            )}
                            {selectedRequest.status === "processing" && (
                                <button
                                    onClick={() => updateStatus(selectedRequest.id, "completed")}
                                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium flex items-center gap-2"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    Mark as Completed (Ready for Pick-Up)
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}

/* ---------- Components ---------- */
function StatCard({ label, value, icon: Icon, color = "text-gray-800" }) {
    return (
        <div className="border rounded-lg bg-white shadow-sm p-3 sm:p-4 lg:p-6 flex items-center justify-between transition-all">
            <div>
                <p className="text-xs sm:text-sm text-gray-600">{label}</p>
                <p className={`text-lg sm:text-xl font-semibold mt-0.5 ${color}`}>
                    {value}
                </p>
            </div>
            <Icon className={`w-5 sm:w-6 h-5 sm:h-6 opacity-40 ${color}`} />
        </div>
    );
}

function Section({ title, data }) {
    return (
        <div>
            <h3 className="text-base font-medium text-gray-900 mb-3 pb-1 border-b border-gray-200">
                {title}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {data.map(([label, value], idx) => (
                    <div key={idx}>
                        <label className="text-xs sm:text-sm font-medium text-gray-500">
                            {label}
                        </label>
                        <p className="text-sm text-gray-900">{value || "—"}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
