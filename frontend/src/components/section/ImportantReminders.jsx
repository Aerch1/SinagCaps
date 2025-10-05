"use client";

import { useEffect, useMemo, useState } from "react";
import {
    Megaphone,
    Bell,
    MoreHorizontal,
    Pencil,
    PauseCircle,
    PlayCircle,
    Trash2,
    Plus,
    Loader2,
} from "lucide-react";
import api from "@/api/api";
import toast from "react-hot-toast";
import Dropdown from "@/components/ui/Dropdown1";
import Modal from "@/components/ui/Modal"; // ✅ Use your Modal component

export default function ImportantReminders() {
    const [advisories, setAdvisories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [type, setType] = useState("announcement");
    const [openMenu, setOpenMenu] = useState(null);
    const [editModal, setEditModal] = useState(null);
    const [saving, setSaving] = useState(false);

    /* ---------------------- Fetch advisories ---------------------- */
    const fetchAdvisories = async () => {
        try {
            setLoading(true);
            const res = await api.get("/admin/advisories");
            setAdvisories(res.data.data || []);
        } catch {
            toast.error("Failed to fetch advisories");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdvisories();
    }, []);

    /* ---------------------- Create ---------------------- */
    const handleCreate = async () => {
        if (!title.trim() || !message.trim()) {
            toast.error("Please fill all fields");
            return;
        }
        try {
            await api.post("/admin/advisories", { title, message, type });
            toast.success("Advisory created");
            setTitle("");
            setMessage("");
            fetchAdvisories();
        } catch {
            toast.error("Create failed");
        }
    };

    /* ---------------------- Toggle status ---------------------- */
    const handleToggle = async (item) => {
        const activeCount = advisories.filter((a) => a.status === "active").length;
        if (item.status === "active" && activeCount <= 1) {
            toast.error("At least one advisory must remain active.");
            return;
        }

        try {
            const newStatus = item.status === "active" ? "inactive" : "active";
            await api.patch(`/admin/advisories/${item.id}`, {
                ...item,
                status: newStatus,
            });
            toast.success(`Set to ${newStatus}`);
            fetchAdvisories();
        } catch {
            toast.error("Toggle failed");
        }
    };

    /* ---------------------- Delete ---------------------- */
    const handleDelete = async (id) => {
        if (advisories.length <= 1) {
            toast.error("At least one advisory must remain.");
            return;
        }

        try {
            await api.delete(`/admin/advisories/${id}`);
            toast.success("Advisory deleted");
            fetchAdvisories();
        } catch {
            toast.error("Delete failed");
        }
    };

    /* ---------------------- Save Edit ---------------------- */
    const handleSaveEdit = async () => {
        if (!editModal.title.trim() || !editModal.message.trim()) {
            toast.error("Please fill all fields");
            return;
        }

        try {
            setSaving(true);
            await api.patch(`/admin/advisories/${editModal.id}`, editModal);
            toast.success("Advisory updated");
            setEditModal(null);
            fetchAdvisories();
        } catch {
            toast.error("Update failed");
        } finally {
            setSaving(false);
        }
    };

    const filtered = useMemo(
        () =>
            [...advisories].sort(
                (a, b) => new Date(b.created_at) - new Date(a.created_at)
            ),
        [advisories]
    );

    /* ---------------------- Render ---------------------- */
    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h3 className="text-base font-medium text-gray-900">Public Advisories</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Manage announcements and reminders displayed on the public homepage.
                    </p>
                </div>
            </div>

            {/* Create New */}
            <div className="mb-6 grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-3">
                    <label className="text-xs font-medium text-gray-600 block mb-1">
                        Type
                    </label>
                    <Dropdown
                        value={type}
                        onChange={setType}
                        options={[
                            { value: "announcement", label: "Announcement" },
                            { value: "reminder", label: "Reminder" },
                        ]}
                        width="w-full"
                    />
                </div>
                <div className="sm:col-span-4">
                    <label className="text-xs font-medium text-gray-600 block mb-1">
                        Title
                    </label>
                    <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Advisory title"
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                    />
                </div>
                <div className="sm:col-span-4">
                    <label className="text-xs font-medium text-gray-600 block mb-1">
                        Message
                    </label>
                    <input
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Advisory message"
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                    />
                </div>
                <div className="sm:col-span-1 flex items-end">
                    <button
                        onClick={handleCreate}
                        className="bg-gray-900 text-white hover:bg-gray-800 px-4 py-2 rounded-md text-sm w-full flex items-center justify-center gap-1"
                    >
                        <Plus className="h-4 w-4" /> Add
                    </button>
                </div>
            </div>

            {/* Advisory List */}
            <ul className="divide-y divide-gray-200 border border-gray-200 rounded-lg bg-white">
                {loading && <li className="px-6 py-12 text-center text-gray-500">Loading…</li>}
                {!loading && filtered.length === 0 && (
                    <li className="px-6 py-12 text-center text-gray-500">No advisories yet.</li>
                )}

                {!loading &&
                    filtered.map((a) => (
                        <li
                            key={a.id}
                            className="px-6 py-4 flex justify-between items-start hover:bg-gray-50 transition"
                        >
                            <div className="flex items-start gap-3">
                                {a.type === "announcement" ? (
                                    <Megaphone className="h-5 w-5 text-gray-400 mt-0.5" />
                                ) : (
                                    <Bell className="h-5 w-5 text-gray-400 mt-0.5" />
                                )}
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-900">{a.title}</h4>
                                    <p className="text-sm text-gray-600">{a.message}</p>
                                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                                        <span
                                            className={`px-2 py-0.5 rounded-full ${a.status === "active"
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-gray-200 text-gray-700"
                                                }`}
                                        >
                                            {a.status}
                                        </span>
                                        <span
                                            className={`px-2 py-0.5 rounded-full ${a.type === "announcement"
                                                    ? "bg-gray-900 text-white"
                                                    : "bg-amber-100 text-amber-700"
                                                }`}
                                        >
                                            {a.type}
                                        </span>
                                        <span>
                                            Posted {new Date(a.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Dropdown */}
                            <div className="relative">
                                <button
                                    className="p-2 rounded-md hover:bg-gray-100"
                                    onClick={() =>
                                        setOpenMenu((prev) => (prev === a.id ? null : a.id))
                                    }
                                >
                                    <MoreHorizontal className="h-4 w-4 text-gray-500" />
                                </button>

                                {openMenu === a.id && (
                                    <div className="absolute right-0 mt-2 w-40 rounded-md border border-gray-200 bg-white shadow-lg z-50">
                                        <button
                                            onClick={() => {
                                                setEditModal(a);
                                                setOpenMenu(null);
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                        >
                                            <Pencil className="h-4 w-4" /> Edit
                                        </button>

                                        <button
                                            onClick={() => {
                                                handleToggle(a);
                                                setOpenMenu(null);
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                        >
                                            {a.status === "active" ? (
                                                <>
                                                    <PauseCircle className="h-4 w-4" /> Pause
                                                </>
                                            ) : (
                                                <>
                                                    <PlayCircle className="h-4 w-4" /> Activate
                                                </>
                                            )}
                                        </button>

                                        <button
                                            onClick={() => {
                                                handleDelete(a.id);
                                                setOpenMenu(null);
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                        >
                                            <Trash2 className="h-4 w-4" /> Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        </li>
                    ))}
            </ul>

            {/* ✅ Edit Modal using your custom component */}
            <Modal
                open={!!editModal}
                onClose={() => setEditModal(null)}
                title="Edit Advisory"
            >
                {editModal && (
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                            Title
                        </label>
                        <input
                            type="text"
                            value={editModal.title}
                            onChange={(e) =>
                                setEditModal((prev) => ({ ...prev, title: e.target.value }))
                            }
                            className="w-full border border-gray-300 rounded-md px-3 py-2 mb-3 text-sm"
                        />
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                            Message
                        </label>
                        <textarea
                            rows="3"
                            value={editModal.message}
                            onChange={(e) =>
                                setEditModal((prev) => ({ ...prev, message: e.target.value }))
                            }
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mb-4"
                        />

                        <label className="block text-sm font-medium text-gray-600 mb-1">
                            Type
                        </label>
                        <Dropdown
                            value={editModal.type}
                            onChange={(val) =>
                                setEditModal((prev) => ({ ...prev, type: val }))
                            }
                            options={[
                                { value: "announcement", label: "Announcement" },
                                { value: "reminder", label: "Reminder" },
                            ]}
                            width="w-full mb-4"
                        />

                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setEditModal(null)}
                                className="px-4 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                disabled={saving}
                                className="px-4 py-2 text-sm rounded-md bg-gray-900 text-white hover:bg-gray-800 flex items-center gap-2"
                            >
                                {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
