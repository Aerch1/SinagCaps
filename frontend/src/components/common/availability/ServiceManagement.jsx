import { useState, useEffect } from "react";
import { Plus, Edit3, Trash2, Search, Check, X } from "lucide-react";
import Dropdown from "@/components/ui/Dropdown1";
import Modal from "@/components/ui/Modal";
import api from "@/api/api";
import toast from "react-hot-toast";

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
    const [selectedService, setSelectedService] = useState(null);

    // Add Service form state
    const [newServiceName, setNewServiceName] = useState("");
    const [newServiceStatus, setNewServiceStatus] = useState("active");
    const [newRequirements, setNewRequirements] = useState([]);
    const [newServiceCutoff, setNewServiceCutoff] = useState(0);

    // Edit state
    const [editingId, setEditingId] = useState(null);
    const [editValues, setEditValues] = useState({
        name: "",
        status: "active",
        requirements: [],
        cutoff_days: 0,
    });

    useEffect(() => {
        fetchServices();
    }, []);

    const handleError = (err, fallback = "Something went wrong") => {
        const msg = err?.response?.data?.message || err?.message || fallback;
        console.error("❌", msg, err);
        toast.error(msg);
    };

    const fetchServices = async () => {
        try {
            const { data } = await api.get("/admin/services");
            if (data.success) {
                setServices(data.services || []);
                onServicesUpdated?.();
            }
        } catch (err) {
            handleError(err, "Failed to fetch services");
        }
    };

    /* ---------------- CREATE ---------------- */
    const addService = async () => {
        if (!newServiceName.trim()) {
            return toast.error("Service name is required");
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
                cutoff_days: newServiceCutoff, // ✅ send cutoff_days
            });

            if (data.success) {
                fetchServices();
                onServicesUpdated?.();
                setShowModal(false);
                setNewServiceName("");
                setNewServiceStatus("active");
                setNewRequirements([]);
                setNewServiceCutoff(0);
                toast.success("Service added successfully");
            } else {
                toast.error(data.message || "Failed to add service");
            }
        } catch (err) {
            handleError(err, "Failed to add service");
        }
    };

    /* ---------------- UPDATE ---------------- */
    const saveEdit = async (id) => {
        if (!editValues.name.trim()) {
            return toast.error("Service name is required");
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
                cutoff_days: editValues.cutoff_days, // ✅ send updated cutoff_days
            });

            if (data.success) {
                fetchServices();
                onServicesUpdated?.();
                cancelEdit();
                toast.success("Service updated successfully");
            } else {
                toast.error(data.message || "Failed to update service");
            }
        } catch (err) {
            handleError(err, "Failed to update service");
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
                toast.success("Service deleted successfully");
            } else {
                toast.error(data.message || "Failed to delete service");
            }
        } catch (err) {
            handleError(err, "Failed to delete service");
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
            cutoff_days: svc.cutoff_days || 0,
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditValues({ name: "", status: "active", requirements: [], cutoff_days: 0 });
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
        <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-200 overflow-hidden w-full">
            {/* Toolbar */}
            <div className="bg-white border-b border-gray-200 px-3 md:px-6 py-3 md:py-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 md:gap-3">
                    <div className="relative w-full sm:w-auto">
                        <div className="absolute inset-y-0 left-0 pl-2.5 md:pl-3 flex items-center pointer-events-none">
                            <Search className="h-3.5 w-3.5 md:h-4 md:w-4 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search services..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
                            className="block w-full sm:w-56 md:w-64 pl-8 md:pl-9 pr-2 md:pr-3 py-1.5 md:py-2 text-xs md:text-sm border border-gray-300 rounded-lg bg-gray-50 focus:ring-1 focus:ring-blue-500 focus:outline-0"
                        />
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="inline-flex items-center justify-center gap-1.5 md:gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium shadow-sm"
                    >
                        <Plus className="h-3.5 w-3.5 md:h-4 md:w-4" /> Add Service
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-3 md:px-6 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-700 uppercase whitespace-nowrap">
                                Service Details
                            </th>
                            <th className="px-3 md:px-6 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-700 uppercase whitespace-nowrap">
                                Requirements
                            </th>
                            <th className="px-3 md:px-6 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-700 uppercase whitespace-nowrap">
                                Status
                            </th>
                            <th className="px-3 md:px-6 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-700 uppercase whitespace-nowrap">
                                Created
                            </th>
                            <th className="px-3 md:px-6 py-2 md:py-3 text-right text-[10px] md:text-xs font-semibold text-gray-700 uppercase whitespace-nowrap">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-3 md:px-6 py-8 md:py-10 text-center text-gray-500 text-xs md:text-sm italic">
                                    No results found
                                </td>
                            </tr>
                        ) : (
                            filtered.map((svc) => (
                                <tr key={svc.id} className="hover:bg-gray-50 align-top">
                                    {/* Service */}
                                    <td className="px-3 md:px-6 py-3 md:py-4">
                                        {editingId === svc.id ? (
                                            <>
                                                <input
                                                    type="text"
                                                    value={editValues.name}
                                                    onChange={(e) =>
                                                        setEditValues((prev) => ({ ...prev, name: e.target.value }))
                                                    }
                                                    className="w-full max-w-xs md:max-w-sm border border-gray-300 rounded-lg px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm focus:ring-1 focus:outline-0 focus:ring-blue-500"
                                                    autoFocus
                                                />
                                                <input
                                                    type="number"
                                                    min={0}
                                                    value={editValues.cutoff_days}
                                                    onChange={(e) =>
                                                        setEditValues((prev) => ({ ...prev, cutoff_days: Number(e.target.value) }))
                                                    }
                                                    className="mt-1 w-full max-w-[80px] border border-gray-300 rounded px-2 py-1 text-xs md:text-sm focus:ring-1 focus:outline-0 focus:ring-blue-500"
                                                    placeholder="Cutoff days"
                                                />
                                            </>
                                        ) : (
                                            <div className="min-w-0">
                                                <div className="text-xs md:text-sm font-medium text-gray-900 truncate">
                                                    {capitalizeWords(svc.name)}
                                                </div>
                                                <div className="text-[10px] md:text-xs text-gray-500 font-mono">
                                                    ID: {svc.id} | Cutoff: {svc.cutoff_days ?? 0} days
                                                </div>
                                            </div>
                                        )}
                                    </td>

                                    {/* Requirements */}
                                    <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-700">
                                        {editingId === svc.id ? (
                                            <div className="space-y-1.5 md:space-y-2 max-w-md">
                                                {editValues.requirements.map((req, idx) => (
                                                    <div key={idx} className="flex gap-1.5 md:gap-2 items-center flex-wrap">
                                                        <input
                                                            type="text"
                                                            value={req.name}
                                                            placeholder="Requirement"
                                                            onChange={(e) => {
                                                                const updated = [...editValues.requirements];
                                                                updated[idx].name = e.target.value;
                                                                setEditValues((prev) => ({ ...prev, requirements: updated }));
                                                            }}
                                                            className="flex-1 min-w-[120px] border rounded px-2 py-1 text-xs md:text-sm focus:ring-1 focus:outline-0 focus:ring-blue-500"
                                                        />
                                                        <label className="flex items-center gap-1 text-[10px] md:text-xs text-gray-600 whitespace-nowrap">
                                                            <input
                                                                type="checkbox"
                                                                checked={req.is_mandatory}
                                                                onChange={(e) => {
                                                                    const updated = [...editValues.requirements];
                                                                    updated[idx].is_mandatory = e.target.checked;
                                                                    setEditValues((prev) => ({ ...prev, requirements: updated }));
                                                                }}
                                                            />
                                                            Mandatory
                                                        </label>
                                                        <button
                                                            onClick={() =>
                                                                setEditValues((prev) => ({
                                                                    ...prev,
                                                                    requirements: prev.requirements.filter((_, i) => i !== idx),
                                                                }))
                                                            }
                                                            className="text-red-500 text-[10px] md:text-xs whitespace-nowrap"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                ))}
                                                <button
                                                    onClick={() =>
                                                        setEditValues((prev) => ({
                                                            ...prev,
                                                            requirements: [...prev.requirements, { name: "", is_mandatory: true }],
                                                        }))
                                                    }
                                                    className="text-blue-600 text-[10px] md:text-xs whitespace-nowrap"
                                                >
                                                    + Add Requirement
                                                </button>
                                            </div>
                                        ) : svc.requirements && svc.requirements.length > 0 ? (
                                            <ul className="list-disc pl-3 md:pl-4 text-[10px] md:text-xs text-gray-700 space-y-0.5">
                                                {svc.requirements.map((r) => (
                                                    <li key={r.id || r.name} className="break-words">
                                                        {capitalizeWords(r.name)} {r.is_mandatory ? "(Mandatory)" : "(Optional)"}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <span className="text-[10px] md:text-xs text-gray-400 italic">No requirements</span>
                                        )}
                                    </td>

                                    {/* Status */}
                                    <td className="px-3 md:px-6 py-3 md:py-4">
                                        {editingId === svc.id ? (
                                            <div className="max-w-[120px]">
                                                <Dropdown
                                                    value={editValues.status}
                                                    onChange={(val) => setEditValues((prev) => ({ ...prev, status: val }))}
                                                    options={[
                                                        { value: "active", label: "Active" },
                                                        { value: "inactive", label: "Inactive" },
                                                    ]}
                                                    width="w-full"
                                                />
                                            </div>
                                        ) : (
                                            <span
                                                className={`inline-flex items-center gap-1 md:gap-1.5 px-2 md:px-2.5 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-medium ${svc.active
                                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                    : "bg-gray-100 text-gray-600 border border-gray-200"
                                                    }`}
                                            >
                                                <div
                                                    className={`h-1 w-1 md:h-1.5 md:w-1.5 rounded-full ${svc.active ? "bg-emerald-500" : "bg-gray-400"
                                                        }`}
                                                />
                                                {svc.active ? "Active" : "Inactive"}
                                            </span>
                                        )}
                                    </td>

                                    {/* Created */}
                                    <td className="px-3 md:px-6 py-3 md:py-4 text-[10px] md:text-sm text-gray-600 whitespace-nowrap">
                                        {new Date(svc.created_at).toLocaleDateString("en-US", {
                                            year: "numeric",
                                            month: "short",
                                            day: "numeric",
                                        })}
                                    </td>

                                    {/* Actions */}
                                    <td className="px-3 md:px-6 py-3 md:py-4 text-right">
                                        <div className="flex justify-end gap-1.5 md:gap-2 flex-wrap">
                                            {editingId === svc.id ? (
                                                <>
                                                    <button
                                                        onClick={() => saveEdit(svc.id)}
                                                        className="inline-flex items-center gap-0.5 md:gap-1 text-emerald-600 hover:text-emerald-700 text-[10px] md:text-sm whitespace-nowrap"
                                                    >
                                                        <Check className="h-3 w-3 md:h-4 md:w-4" /> Save
                                                    </button>
                                                    <button
                                                        onClick={cancelEdit}
                                                        className="inline-flex items-center gap-0.5 md:gap-1 text-gray-600 hover:text-gray-700 text-[10px] md:text-sm whitespace-nowrap"
                                                    >
                                                        <X className="h-3 w-3 md:h-4 md:w-4" /> Cancel
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => startEdit(svc)}
                                                        className="inline-flex items-center gap-0.5 md:gap-1 text-blue-600 hover:text-blue-700 text-[10px] md:text-sm whitespace-nowrap"
                                                    >
                                                        <Edit3 className="h-3 w-3 md:h-4 md:w-4" /> Edit
                                                    </button>
                                                    <button
                                                        onClick={() => confirmDeleteService(svc)}
                                                        className="inline-flex items-center gap-0.5 md:gap-1 text-red-600 hover:text-red-700 text-[10px] md:text-sm whitespace-nowrap"
                                                    >
                                                        <Trash2 className="h-3 w-3 md:h-4 md:w-4" /> Delete
                                                    </button>
                                                </>
                                            )}
                                        </div>
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
                    <div className="space-y-3 md:space-y-4">
                        <div>
                            <label className="block text-xs md:text-sm font-medium text-gray-800 mb-1">Service Name</label>
                            <input
                                type="text"
                                value={newServiceName}
                                onChange={(e) => setNewServiceName(e.target.value)}
                                className="w-full border rounded-lg px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm focus:ring-1 focus:ring-blue-500 focus:outline-0"
                            />
                        </div>

                        <div>
                            <label className="block text-xs md:text-sm font-medium text-gray-800 mb-1">Status</label>
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

                        <div>
                            <label className="block text-xs md:text-sm font-medium text-gray-800 mb-1">Booking Cutoff Days</label>
                            <input
                                type="number"
                                min={0}
                                value={newServiceCutoff}
                                onChange={(e) => setNewServiceCutoff(Number(e.target.value))}
                                className="w-full border rounded-lg px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm focus:ring-1 focus:outline-0 focus:ring-blue-500"
                            />
                            <p className="text-[10px] md:text-xs text-gray-500 mt-1">
                                Number of days in advance users can book this service.
                            </p>
                        </div>

                        {/* Requirements */}
                        <div>
                            <label className="block text-xs md:text-sm font-medium text-gray-800 mb-1">Requirements</label>
                            <div className="space-y-1.5 md:space-y-2">
                                {newRequirements.map((req, idx) => (
                                    <div key={idx} className="flex gap-1.5 md:gap-2 items-center flex-wrap">
                                        <input
                                            type="text"
                                            placeholder="Requirement name"
                                            value={req.name}
                                            onChange={(e) => {
                                                const updated = [...newRequirements];
                                                updated[idx].name = e.target.value;
                                                setNewRequirements(updated);
                                            }}
                                            className="flex-1 min-w-[120px] border rounded px-2 py-1 text-xs md:text-sm focus:outline-0 focus:ring-1 focus:ring-blue-500"
                                        />
                                        <label className="flex items-center gap-1 text-[10px] md:text-xs text-gray-600 whitespace-nowrap">
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
                                            onClick={() => setNewRequirements((prev) => prev.filter((_, i) => i !== idx))}
                                            className="text-red-500 text-[10px] md:text-xs whitespace-nowrap"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <button
                                type="button"
                                onClick={() => setNewRequirements([...newRequirements, { name: "", is_mandatory: true }])}
                                className="mt-1.5 md:mt-2 text-blue-600 text-xs md:text-sm"
                            >
                                + Add Requirement
                            </button>
                        </div>

                        <div className="flex justify-end gap-2 md:gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm text-gray-600 hover:bg-gray-100 rounded"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={addService}
                                className="px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Delete Confirmation */}
            {showDeleteModal && selectedService && (
                <Modal open={true} onClose={() => setShowDeleteModal(false)} title="Delete Service">
                    <p className="text-xs md:text-sm">
                        Are you sure you want to delete <span className="font-medium">{capitalizeWords(selectedService.name)}</span>?
                    </p>
                    <div className="flex justify-end gap-2 md:gap-3 mt-3 md:mt-4">
                        <button
                            onClick={() => setShowDeleteModal(false)}
                            className="px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm text-gray-600 hover:bg-gray-100 rounded"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={deleteService}
                            className="px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm bg-red-600 text-white rounded hover:bg-red-700"
                        >
                            Delete
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
}
