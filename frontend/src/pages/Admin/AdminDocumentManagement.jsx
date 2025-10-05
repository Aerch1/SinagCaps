"use client";

import React, { useState } from "react";
import {
    Search,
    Filter,
    Eye,
    CheckCircle,
    XCircle,
    FileText,
    Clock,
    Download,
} from "lucide-react";
import Dropdown from "@/components/ui/Dropdown1";

export default function AdminDocumentManagement() {
    const [requests, setRequests] = useState([
        {
            id: "REQ-001",
            fullName: "Maria Santos",
            email: "maria.santos@email.com",
            phone: "+63 912 345 6789",
            address: "123 Main St, Lucena City",
            documentType: "baptism",
            purpose: "For wedding requirements",
            copies: "2",
            sacramentDate: "1995-06-15",
            sacramentPlace: "St. John Parish",
            additionalInfo: "Parents: Juan and Ana Santos",
            status: "pending",
            dateRequested: "2025-10-01",
        },
        {
            id: "REQ-002",
            fullName: "Juan Dela Cruz",
            email: "juan.dc@email.com",
            phone: "+63 923 456 7890",
            address: "456 Church Ave, Lucena City",
            documentType: "confirmation",
            purpose: "For employment abroad",
            copies: "3",
            sacramentDate: "2005-03-20",
            sacramentPlace: "Our Lady of Peace Parish",
            additionalInfo: "",
            status: "pending",
            dateRequested: "2025-10-02",
        },
        {
            id: "REQ-003",
            fullName: "Ana Reyes",
            email: "ana.reyes@email.com",
            phone: "+63 934 567 8901",
            address: "789 Faith Rd, Lucena City",
            documentType: "marriage",
            purpose: "For legal documentation",
            copies: "1",
            sacramentDate: "2010-12-18",
            sacramentPlace: "Sacred Heart Church",
            additionalInfo: "Spouse: Pedro Reyes",
            status: "completed",
            dateRequested: "2025-09-28",
        },
    ]);

    const [filterStatus, setFilterStatus] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showModal, setShowModal] = useState(false);

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

    const updateStatus = (id, newStatus) => {
        setRequests((prev) =>
            prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
        );
        if (selectedRequest?.id === id)
            setSelectedRequest({ ...selectedRequest, status: newStatus });
    };

    const viewDetails = (req) => {
        setSelectedRequest(req);
        setShowModal(true);
    };

    const filteredRequests = requests.filter((req) => {
        const matchesStatus = filterStatus === "all" || req.status === filterStatus;
        const matchesSearch =
            req.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.email.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const stats = {
        total: requests.length,
        pending: requests.filter((r) => r.status === "pending").length,
        processing: requests.filter((r) => r.status === "processing").length,
        completed: requests.filter((r) => r.status === "completed").length,
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <h1 className="text-2xl font-semibold text-gray-900">
                        Document Request Management
                    </h1>
                    <p className="text-sm text-gray-600 mt-1">
                        Parish Office Admin Portal
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <StatCard label="Total Requests" value={stats.total} icon={FileText} />
                    <StatCard label="Pending" value={stats.pending} color="text-yellow-600" icon={Clock} />
                    <StatCard label="Processing" value={stats.processing} color="text-blue-600" icon={Clock} />
                    <StatCard label="Completed" value={stats.completed} color="text-green-600" icon={CheckCircle} />
                </div>

                {/* Search & Filter */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name, ID, or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-800 focus:border-transparent"
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
                            label="Filter by Status"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    {["Request ID", "Name", "Document Type", "Date Requested", "Status", "Actions"].map(
                                        (h) => (
                                            <th
                                                key={h}
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                            >
                                                {h}
                                            </th>
                                        )
                                    )}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredRequests.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan="6"
                                            className="px-6 py-12 text-center text-gray-500"
                                        >
                                            No requests found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRequests.map((r) => (
                                        <tr key={r.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                {r.id}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {r.fullName}
                                                </div>
                                                <div className="text-sm text-gray-500">{r.email}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-700">
                                                {documentTypeLabels[r.documentType]}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-700">
                                                {r.dateRequested}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[r.status]}`}
                                                >
                                                    {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <button
                                                    onClick={() => viewDetails(r)}
                                                    className="text-amber-800 hover:text-amber-900 font-medium"
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showModal && selectedRequest && (
                <Modal
                    request={selectedRequest}
                    statusColors={statusColors}
                    documentTypeLabels={documentTypeLabels}
                    onClose={() => setShowModal(false)}
                    updateStatus={updateStatus}
                />
            )}
        </div>
    );
}

/* ---------- Reusable Components ---------- */
function StatCard({ label, value, icon: Icon, color = "text-gray-800" }) {
    return (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 flex items-center justify-between">
            <div>
                <p className="text-sm text-gray-600">{label}</p>
                <p className={`text-2xl font-semibold mt-1 ${color}`}>{value}</p>
            </div>
            <Icon className={`w-8 h-8 ${color.replace("text-", "text-opacity-40 ")} `} />
        </div>
    );
}

function Modal({ request, statusColors, documentTypeLabels, onClose, updateStatus }) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Request Details - {request.id}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <XCircle className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6">
                    <div className="mb-6">
                        <span
                            className={`px-4 py-2 inline-flex text-sm font-semibold rounded-full ${statusColors[request.status]}`}
                        >
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                    </div>

                    <Section title="Personal Information" data={[
                        ["Full Name", request.fullName],
                        ["Email", request.email],
                        ["Phone", request.phone],
                        ["Address", request.address],
                    ]} />

                    <Section title="Document Information" data={[
                        ["Document Type", documentTypeLabels[request.documentType]],
                        ["Number of Copies", request.copies],
                        ["Purpose", request.purpose],
                    ]} />

                    <Section title="Sacramental Information" data={[
                        ["Date of Sacrament", request.sacramentDate || "Not provided"],
                        ["Place of Sacrament", request.sacramentPlace || "Not provided"],
                        ...(request.additionalInfo
                            ? [["Additional Information", request.additionalInfo]]
                            : []),
                    ]} />

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3 pt-6 border-t border-gray-200">
                        {request.status === "pending" && (
                            <>
                                <button
                                    onClick={() => updateStatus(request.id, "processing")}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
                                >
                                    Mark as Processing
                                </button>
                                <button
                                    onClick={() => updateStatus(request.id, "rejected")}
                                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium"
                                >
                                    Reject Request
                                </button>
                            </>
                        )}
                        {request.status === "processing" && (
                            <button
                                onClick={() => updateStatus(request.id, "completed")}
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium flex items-center gap-2"
                            >
                                <CheckCircle className="w-4 h-4" />
                                Mark as Completed
                            </button>
                        )}
                        <button className="px-4 py-2 bg-amber-800 text-white rounded-md hover:bg-amber-900 font-medium flex items-center gap-2">
                            <Download className="w-4 h-4" />
                            Generate Document
                        </button>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-medium"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Section({ title, data }) {
    return (
        <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">
                {title}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.map(([label, value], idx) => (
                    <div key={idx}>
                        <label className="text-sm font-medium text-gray-500">{label}</label>
                        <p className="text-gray-900">{value}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
