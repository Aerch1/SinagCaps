"use client";

import { useState, useEffect } from "react";
import { Plus, Edit3, Trash2, Search, Check, X, AlertCircle } from "lucide-react";
import Dropdown from "@/components/ui/Dropdown1";
import Modal from "@/components/ui/Modal";

export default function ServiceManagement() {
    const [services, setServices] = useState([]);
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [newServiceName, setNewServiceName] = useState("");
    const [newServiceStatus, setNewServiceStatus] = useState("active");
    const [selectedService, setSelectedService] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [editValues, setEditValues] = useState({ name: "", status: "active" });

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        try {
            const res = await fetch("/api/admin/services");
            const data = await res.json();
            if (data.success) setServices(data.services);
        } catch (err) {
            console.error("❌ fetchServices error:", err);
        }
    };

    const showError = (msg) => {
        setErrorMessage(msg);
        setShowErrorModal(true);
    };

    const addService = async () => {
        if (!newServiceName.trim()) {
            return showError("Service name is required");
        }

        const exists = services.some(
            (s) => s.name.toLowerCase() === newServiceName.trim().toLowerCase()
        );
        if (exists) {
            return showError("Service already exists");
        }

        try {
            const res = await fetch("/api/admin/services", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newServiceName.trim(),
                    active: newServiceStatus === "active",
                }),
            });
            const data = await res.json();
            if (data.success) {
                fetchServices();
                setShowModal(false);
                setNewServiceName("");
                setNewServiceStatus("active");
            } else {
                showError(data.message || "Failed to add service");
            }
        } catch (err) {
            console.error("❌ addService error:", err);
        }
    };

    const saveEdit = async (id) => {
        if (!editValues.name.trim()) {
            return showError("Service name is required");
        }

        try {
            const res = await fetch(`/api/admin/services/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: editValues.name.trim(),
                    active: editValues.status === "active",
                }),
            });
            const data = await res.json();
            if (data.success) {
                fetchServices();
                cancelEdit();
            } else {
                showError(data.message || "Failed to update service");
            }
        } catch (err) {
            console.error("❌ saveEdit error:", err);
        }
    };

    const confirmDeleteService = (svc) => {
        setSelectedService(svc);
        setShowDeleteModal(true);
    };

    const deleteService = async () => {
        try {
            const res = await fetch(`/api/admin/services/${selectedService.id}`, {
                method: "DELETE",
            });
            const data = await res.json();
            if (data.success) {
                fetchServices();
                setShowDeleteModal(false);
                setSelectedService(null);
            } else {
                showError(data.message || "Failed to delete service");
            }
        } catch (err) {
            console.error("❌ deleteService error:", err);
        }
    };

    const startEdit = (svc) => {
        setEditingId(svc.id);
        setEditValues({
            name: svc.name,
            status: svc.active ? "active" : "inactive",
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditValues({ name: "", status: "active" });
    };

    const filtered = services.filter((svc) =>
        svc.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Toolbar */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search services..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="block w-full sm:w-64 pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm"
                    >
                        <Plus className="h-4 w-4" />
                        Add Service
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                                Service Details
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                                Created
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filtered.map((svc) => (
                            <tr key={svc.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    {editingId === svc.id ? (
                                        <input
                                            type="text"
                                            value={editValues.name}
                                            onChange={(e) =>
                                                setEditValues((prev) => ({ ...prev, name: e.target.value }))
                                            }
                                            className="w-full max-w-sm border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                                            autoFocus
                                        />
                                    ) : (
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">{svc.name}</div>
                                            <div className="text-xs text-gray-500 font-mono">ID: {svc.id}</div>
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    {editingId === svc.id ? (
                                        <Dropdown
                                            value={editValues.status}
                                            onChange={(val) =>
                                                setEditValues((prev) => ({ ...prev, status: val }))
                                            }
                                            options={[
                                                { value: "active", label: "Active" },
                                                { value: "inactive", label: "Inactive" },
                                            ]}
                                            width="w-full"
                                        />
                                    ) : (
                                        <span
                                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${svc.active
                                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                    : "bg-gray-100 text-gray-600 border border-gray-200"
                                                }`}
                                        >
                                            <div
                                                className={`h-1.5 w-1.5 rounded-full ${svc.active ? "bg-emerald-500" : "bg-gray-400"
                                                    }`}
                                            />
                                            {svc.active ? "Active" : "Inactive"}
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                    {new Date(svc.created_at).toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "short",
                                        day: "numeric",
                                    })}
                                </td>
                                <td className="px-6 py-4 text-right space-x-2">
                                    {editingId === svc.id ? (
                                        <>
                                            <button
                                                onClick={() => saveEdit(svc.id)}
                                                className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 text-sm"
                                            >
                                                <Check className="h-4 w-4" /> Save
                                            </button>
                                            <button
                                                onClick={cancelEdit}
                                                className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-700 text-sm"
                                            >
                                                <X className="h-4 w-4" /> Cancel
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => startEdit(svc)}
                                                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm"
                                            >
                                                <Edit3 className="h-4 w-4" /> Edit
                                            </button>
                                            <button
                                                onClick={() => confirmDeleteService(svc)}
                                                className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 text-sm"
                                            >
                                                <Trash2 className="h-4 w-4" /> Delete
                                            </button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Add Service Modal */}
            {showModal && (
                <Modal open={true} onClose={() => setShowModal(false)} title="Add New Service">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-800 mb-1">
                                Service Name
                            </label>
                            <input
                                type="text"
                                value={newServiceName}
                                onChange={(e) => setNewServiceName(e.target.value)}
                                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-800 mb-1">
                                Status
                            </label>
                            <Dropdown
                                value={newServiceStatus}
                                onChange={setNewServiceStatus}
                                options={[
                                    { value: "active", label: "Active" },
                                    { value: "inactive", label: "Inactive" },
                                ]}
                                width="w-full"
                            />
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={addService}
                                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Delete Confirmation */}
            {showDeleteModal && selectedService && (
                <Modal
                    open={true}
                    onClose={() => setShowDeleteModal(false)}
                    title="Delete Service"
                >
                    <p>
                        Are you sure you want to delete{" "}
                        <span className="font-medium">{selectedService.name}</span>?
                    </p>
                    <div className="flex justify-end gap-3 mt-4">
                        <button
                            onClick={() => setShowDeleteModal(false)}
                            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={deleteService}
                            className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                        >
                            Delete
                        </button>
                    </div>
                </Modal>
            )}

            {/* Error Modal */}
            {showErrorModal && (
                <Modal
                    open={true}
                    onClose={() => setShowErrorModal(false)}
                    title="Validation Error"
                >
                    <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                        <p className="text-sm text-gray-700">{errorMessage}</p>
                    </div>
                    <div className="flex justify-end gap-3 mt-4">
                        <button
                            onClick={() => setShowErrorModal(false)}
                            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            OK
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
}
