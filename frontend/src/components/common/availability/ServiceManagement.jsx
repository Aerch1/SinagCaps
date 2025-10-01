import { useState, useEffect } from "react";
import { Plus, Edit3, Trash2, Search, Check, X, AlertCircle } from "lucide-react";
import Dropdown from "@/components/ui/Dropdown1";
import Modal from "@/components/ui/Modal";
import api from "@/api/api"; // ✅ centralized axios instance

const capitalizeWords = (str = "") =>
    str
        .toLowerCase()
        .split(" ")
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

export default function ServiceManagement({ onServicesUpdated }) {
    const [services, setServices] = useState([]);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    // Add Service form state
    const [newServiceName, setNewServiceName] = useState("");
    const [newServiceStatus, setNewServiceStatus] = useState("active");
    const [newRequirements, setNewRequirements] = useState([]);

    // Edit state
    const [selectedService, setSelectedService] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [editValues, setEditValues] = useState({
        name: "",
        status: "active",
        requirements: [],
    });

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        try {
            const { data } = await api.get("/admin/services");
            if (data.success) {
                setServices(data.services || []);
                onServicesUpdated?.();
            }
        } catch (err) {
            console.error("❌ fetchServices error:", err);
        }
    };

    const showError = (msg) => {
        setErrorMessage(msg);
        setShowErrorModal(true);
    };

    /* ---------------- CREATE ---------------- */
    const addService = async () => {
        if (!newServiceName.trim()) {
            return showError("Service name is required");
        }

        const cleanedReqs = (newRequirements || [])
            .filter((r) => r?.name && r.name.trim())
            .map((r) => ({
                name: capitalizeWords(r.name.trim()),
                is_mandatory: r.is_mandatory !== false,
            }));

        try {
            const { data } = await api.post("/admin/services", {
                name: capitalizeWords(newServiceName.trim()),
                active: newServiceStatus === "active",
                requirements: cleanedReqs,
            });

            if (data.success) {
                fetchServices();
                onServicesUpdated?.();
                setShowModal(false);
                setNewServiceName("");
                setNewServiceStatus("active");
                setNewRequirements([]);
            } else {
                showError(data.message || "Failed to add service");
            }
        } catch (err) {
            console.error("❌ addService error:", err);
            showError("Failed to add service");
        }
    };

    /* ---------------- UPDATE ---------------- */
    const saveEdit = async (id) => {
        if (!editValues.name.trim()) {
            return showError("Service name is required");
        }

        const cleanedReqs = (editValues.requirements || [])
            .filter((r) => r?.name && r.name.trim())
            .map((r) => ({
                name: capitalizeWords(r.name.trim()),
                is_mandatory: r.is_mandatory !== false,
            }));

        try {
            const { data } = await api.patch(`/admin/services/${id}`, {
                name: capitalizeWords(editValues.name.trim()),
                active: editValues.status === "active",
                requirements: cleanedReqs,
            });

            if (data.success) {
                fetchServices();
                onServicesUpdated?.();
                cancelEdit();
            } else {
                showError(data.message || "Failed to update service");
            }
        } catch (err) {
            console.error("❌ saveEdit error:", err);
            showError("Failed to update service");
        }
    };

    /* ---------------- DELETE ---------------- */
    const confirmDeleteService = (svc) => {
        setSelectedService(svc);
        setShowDeleteModal(true);
    };

    const deleteService = async () => {
        try {
            const { data } = await api.delete(`/admin/services/${selectedService.id}`);
            if (data.success) {
                fetchServices();
                onServicesUpdated?.();
                setShowDeleteModal(false);
                setSelectedService(null);
            } else {
                showError(data.message || "Failed to delete service");
            }
        } catch (err) {
            console.error("❌ deleteService error:", err);
            showError("Failed to delete service");
        }
    };

    /* ---------------- EDIT ---------------- */
    const startEdit = (svc) => {
        setEditingId(svc.id);
        setEditValues({
            name: svc.name,
            status: svc.active ? "active" : "inactive",
            requirements: Array.isArray(svc.requirements)
                ? svc.requirements.map((r) => ({
                    id: r.id,
                    name: r.name || "",
                    is_mandatory: r.is_mandatory !== false,
                }))
                : [],
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditValues({ name: "", status: "active", requirements: [] });
    };

    /* ---------------- SEARCH (debounced) ---------------- */
    useEffect(() => {
        const delay = setTimeout(() => {
            setDebouncedSearch(search.toLowerCase());
        }, 300);
        return () => clearTimeout(delay);
    }, [search]);

    const filtered = services.filter((svc) => {
        const query = debouncedSearch;
        if (!query) return true;

        const inName = svc.name?.toLowerCase().includes(query);

        const inRequirements = Array.isArray(svc.requirements)
            ? svc.requirements.some((r) => r.name?.toLowerCase().includes(query))
            : false;

        const inStatus = (svc.active ? "active" : "inactive").includes(query);

        return inName || inRequirements || inStatus;
    });

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
                            onKeyDown={(e) => {
                                if (e.key === "Enter") e.preventDefault();
                            }}
                            className="block w-full sm:w-64 pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:ring-1 focus:ring-blue-500 focus:outline-0"
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
                                Requirements
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
                        {filtered.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={5}
                                    className="px-6 py-10 text-center text-gray-500 text-sm italic"
                                >
                                    No results found
                                </td>
                            </tr>
                        ) : (
                            filtered.map((svc) => (
                                <tr key={svc.id} className="hover:bg-gray-50 align-top">
                                    {/* Service */}
                                    <td className="px-6 py-4">
                                        {editingId === svc.id ? (
                                            <input
                                                type="text"
                                                value={editValues.name}
                                                onChange={(e) =>
                                                    setEditValues((prev) => ({
                                                        ...prev,
                                                        name: e.target.value,
                                                    }))
                                                }
                                                className="w-full max-w-sm border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:outline-0 focus:ring-blue-500"
                                                autoFocus
                                            />
                                        ) : (
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {capitalizeWords(svc.name)}
                                                </div>
                                                <div className="text-xs text-gray-500 font-mono">
                                                    ID: {svc.id}
                                                </div>
                                            </div>
                                        )}
                                    </td>

                                    {/* Requirements */}
                                    <td className="px-6 py-4 text-sm text-gray-700">
                                        {editingId === svc.id ? (
                                            <div className="space-y-2">
                                                {editValues.requirements.map((req, idx) => (
                                                    <div key={idx} className="flex gap-2 items-center">
                                                        <input
                                                            type="text"
                                                            value={req.name}
                                                            placeholder="Requirement"
                                                            onChange={(e) => {
                                                                const updated = [...editValues.requirements];
                                                                updated[idx].name = e.target.value;
                                                                setEditValues((prev) => ({
                                                                    ...prev,
                                                                    requirements: updated,
                                                                }));
                                                            }}
                                                            className="flex-1 border rounded px-2 py-1 text-sm focus:ring-1 focus:outline-0 focus:ring-blue-500"
                                                        />
                                                        <label className="flex items-center gap-1 text-xs text-gray-600">
                                                            <input
                                                                type="checkbox"
                                                                checked={req.is_mandatory}
                                                                onChange={(e) => {
                                                                    const updated = [...editValues.requirements];
                                                                    updated[idx].is_mandatory = e.target.checked;
                                                                    setEditValues((prev) => ({
                                                                        ...prev,
                                                                        requirements: updated,
                                                                    }));
                                                                }}
                                                            />
                                                            Mandatory
                                                        </label>
                                                        <button
                                                            onClick={() =>
                                                                setEditValues((prev) => ({
                                                                    ...prev,
                                                                    requirements: prev.requirements.filter(
                                                                        (_, i) => i !== idx
                                                                    ),
                                                                }))
                                                            }
                                                            className="text-red-500 text-xs"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                ))}
                                                <button
                                                    onClick={() =>
                                                        setEditValues((prev) => ({
                                                            ...prev,
                                                            requirements: [
                                                                ...prev.requirements,
                                                                { name: "", is_mandatory: true },
                                                            ],
                                                        }))
                                                    }
                                                    className="text-blue-600 text-xs"
                                                >
                                                    + Add Requirement
                                                </button>
                                            </div>
                                        ) : svc.requirements && svc.requirements.length > 0 ? (
                                            <ul className="list-disc pl-4 text-xs text-gray-700">
                                                {svc.requirements.map((r) => (
                                                    <li key={r.id || r.name}>
                                                        {capitalizeWords(r.name)}{" "}
                                                        {r.is_mandatory ? "(Mandatory)" : "(Optional)"}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <span className="text-xs text-gray-400 italic">
                                                No requirements
                                            </span>
                                        )}
                                    </td>

                                    {/* Status */}
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

                                    {/* Created */}
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {new Date(svc.created_at).toLocaleDateString("en-US", {
                                            year: "numeric",
                                            month: "short",
                                            day: "numeric",
                                        })}
                                    </td>

                                    {/* Actions */}
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
                            ))
                        )}
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
                                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-0"
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

                        {/* Requirements */}
                        <div>
                            <label className="block text-sm font-medium text-gray-800 mb-1">
                                Requirements
                            </label>
                            <div className="space-y-2">
                                {newRequirements.map((req, idx) => (
                                    <div key={idx} className="flex gap-2 items-center">
                                        <input
                                            type="text"
                                            placeholder="Requirement name"
                                            value={req.name}
                                            onChange={(e) => {
                                                const updated = [...newRequirements];
                                                updated[idx].name = e.target.value;
                                                setNewRequirements(updated);
                                            }}
                                            className="flex-1 border rounded px-2 py-1 text-sm focus:outline-0 focus:ring-1 focus:ring-blue-500"
                                        />
                                        <label className="flex items-center gap-1 text-xs text-gray-600">
                                            <input
                                                type="checkbox"
                                                checked={req.is_mandatory ?? true}
                                                onChange={(e) => {
                                                    const updated = [...newRequirements];
                                                    updated[idx].is_mandatory = e.target.checked;
                                                    setNewRequirements(updated);
                                                }}
                                            />
                                            Mandatory
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setNewRequirements((prev) =>
                                                    prev.filter((_, i) => i !== idx)
                                                )
                                            }
                                            className="text-red-500 text-xs"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <button
                                type="button"
                                onClick={() =>
                                    setNewRequirements([
                                        ...newRequirements,
                                        { name: "", is_mandatory: true },
                                    ])
                                }
                                className="mt-2 text-blue-600 text-sm"
                            >
                                + Add Requirement
                            </button>
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
                        <span className="font-medium">
                            {capitalizeWords(selectedService.name)}
                        </span>
                        ?
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
