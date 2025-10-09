"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Edit2, Eye, Trash2, Plus, CalendarDays } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/api/api";
import Modal from "@/components/ui/Modal";
import Dropdown from "@/components/ui/Dropdown1";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useAuthStore } from "../../store/authStore.js";

/* ---------- Default Categories ---------- */
const DEFAULT_CATEGORIES = [
    { value: "Parish Advisory", label: "Parish Advisory" },
    { value: "Community", label: "Community" },
    { value: "Outreach", label: "Outreach" },
    { value: "Music Ministry", label: "Music Ministry" },
    { value: "General", label: "General" },
];

/* ---------- Helper: badge colors ---------- */
const categoryColor = (category) => {
    const map = {
        "Parish Advisory": "bg-blue-100 text-blue-700 border border-blue-200",
        Community: "bg-green-100 text-green-700 border border-green-200",
        Outreach: "bg-orange-100 text-orange-700 border border-orange-200",
        "Music Ministry": "bg-purple-100 text-purple-700 border border-purple-200",
        General: "bg-gray-100 text-gray-700 border border-gray-200",
    };
    return map[category] || "bg-gray-100 text-gray-700 border border-gray-200";
};

/* ---------- Main Component ---------- */
export default function AnnouncementsTable() {
    const [announcements, setAnnouncements] = useState([]);
    const [query, setQuery] = useState("");
    const [openModal, setOpenModal] = useState(false);
    const [viewItem, setViewItem] = useState(null);
    const [editItem, setEditItem] = useState(null);
    const [confirmData, setConfirmData] = useState(null);
    const [loading, setLoading] = useState(false);

    const { user } = useAuthStore();

    // Pagination
    const [page, setPage] = useState(1);
    const pageSize = 6;

    const fetchAnnouncements = async () => {
        try {
            setLoading(true);
            const res = await api.get("/admin/announcements");
            setAnnouncements(res.data.data || []);
        } catch {
            toast.error("Failed to load announcements");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const filtered = useMemo(() => {
        const q = query.toLowerCase().trim();
        let data = announcements;
        if (q) {
            data = data.filter(
                (r) =>
                    (r.title || "").toLowerCase().includes(q) ||
                    (r.category || "").toLowerCase().includes(q)
            );
        }
        return [...data].sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [announcements, query]);

    const totalPages = Math.ceil(filtered.length / pageSize);
    const paginatedData = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, page, pageSize]);

    const handleSave = async (formData) => {
        try {
            const payload = { ...formData, author: user?.name || "Admin User" };
            const toastId = toast.loading(editItem ? "Updating..." : "Creating...");
            if (editItem) {
                await api.put(`/admin/announcements/${editItem.id}`, payload);
                toast.success("Announcement updated", { id: toastId });
            } else {
                await api.post("/admin/announcements", payload);
                toast.success("Announcement created", { id: toastId });
            }
            fetchAnnouncements();
            setOpenModal(false);
            setEditItem(null);
        } catch {
            toast.error("Save failed");
        }
    };

    const confirmDelete = (item) => {
        setConfirmData({
            title: "Delete Announcement",
            message: `Are you sure you want to permanently delete "${item.title}"?`,
            onConfirm: async () => {
                try {
                    await api.delete(`/admin/announcements/${item.id}`);
                    toast.success("Deleted successfully");
                    fetchAnnouncements();
                    setViewItem(null);
                    setConfirmData(null);
                } catch {
                    toast.error("Delete failed");
                }
            },
        });
    };

    return (
        <div className="p-3 md:p-6 space-y-4 md:space-y-6 w-full overflow-hidden">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 md:gap-3">
                <div>
                    <h2 className="text-base md:text-lg font-semibold text-gray-900">
                        Announcements Management
                    </h2>
                    <p className="text-xs md:text-sm text-gray-500">
                        Manage parish announcements and bulletins.
                    </p>
                </div>
                <button
                    onClick={() => {
                        setEditItem(null);
                        setOpenModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 md:gap-2 bg-gray-900 hover:bg-gray-800 text-white px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm whitespace-nowrap"
                >
                    <Plus className="h-3.5 w-3.5 md:h-4 md:w-4" /> New Announcement
                </button>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-64 md:w-72">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setPage(1);
                    }}
                    placeholder="Search announcements..."
                    className="w-full rounded-lg border border-gray-300 bg-white py-1.5 md:py-2 pl-2.5 md:pl-3 pr-2.5 md:pr-3 text-xs md:text-sm text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-gray-200 focus:outline-none"
                />
            </div>

            {/* Table */}
            <div className="overflow-hidden border border-gray-200 rounded-lg md:rounded-xl bg-white">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-xs md:text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                {["Title", "Category", "Author", "Date", "Actions"].map((h) => (
                                    <th
                                        key={h}
                                        className="px-3 md:px-6 py-2 md:py-3 text-left text-[10px] md:text-xs font-medium uppercase text-gray-500 tracking-wider whitespace-nowrap"
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-8 md:py-10 text-gray-500 text-xs md:text-sm">
                                        Loading…
                                    </td>
                                </tr>
                            ) : paginatedData.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-8 md:py-10 text-gray-500 text-xs md:text-sm">
                                        No announcements found.
                                    </td>
                                </tr>
                            ) : (
                                paginatedData.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-3 md:px-6 py-3 md:py-4 font-medium text-gray-900 max-w-[200px] truncate">
                                            {item.title}
                                        </td>
                                        <td className="px-3 md:px-6 py-3 md:py-4">
                                            <span
                                                className={`text-[10px] md:text-xs font-medium px-1.5 md:px-2 py-0.5 md:py-1 rounded-full whitespace-nowrap ${categoryColor(
                                                    item.category
                                                )}`}
                                            >
                                                {item.category}
                                            </span>
                                        </td>
                                        <td className="px-3 md:px-6 py-3 md:py-4 text-gray-700 max-w-[150px] truncate">
                                            {item.author}
                                        </td>
                                        <td className="px-3 md:px-6 py-3 md:py-4 text-gray-700 whitespace-nowrap">
                                            {new Date(item.date).toLocaleDateString("en-US", {
                                                year: "numeric",
                                                month: "short",
                                                day: "numeric",
                                            })}
                                        </td>
                                        <td className="px-3 md:px-6 py-3 md:py-4">
                                            <div className="flex justify-end gap-1 md:gap-2 flex-wrap">
                                                <button
                                                    onClick={() => setViewItem(item)}
                                                    className="inline-flex items-center gap-0.5 md:gap-1 px-2 md:px-3 py-1 md:py-1.5 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 text-[10px] md:text-xs whitespace-nowrap"
                                                >
                                                    <Eye className="h-3 w-3 md:h-4 md:w-4" /> View
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setEditItem(item);
                                                        setOpenModal(true);
                                                    }}
                                                    className="inline-flex items-center gap-0.5 md:gap-1 px-2 md:px-3 py-1 md:py-1.5 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 text-[10px] md:text-xs whitespace-nowrap"
                                                >
                                                    <Edit2 className="h-3 w-3 md:h-4 md:w-4" /> Edit
                                                </button>
                                                <button
                                                    onClick={() => confirmDelete(item)}
                                                    className="inline-flex items-center gap-0.5 md:gap-1 px-2 md:px-3 py-1 md:py-1.5 border border-red-300 rounded-md text-red-600 hover:bg-red-50 text-[10px] md:text-xs whitespace-nowrap"
                                                >
                                                    <Trash2 className="h-3 w-3 md:h-4 md:w-4" /> Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row justify-between items-center border-t border-gray-200 pt-3 md:pt-4 gap-3">
                    <div className="text-xs md:text-sm text-gray-600">
                        Showing {(page - 1) * pageSize + 1} to{" "}
                        {Math.min(page * pageSize, filtered.length)} of {filtered.length}
                    </div>
                    <div className="flex items-center gap-1 md:gap-2">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="h-8 w-8 md:h-9 md:w-9 rounded-md border bg-white text-xs md:text-sm hover:bg-gray-50 disabled:opacity-50"
                        >
                            ‹
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => (
                            <button
                                key={i}
                                onClick={() => setPage(i + 1)}
                                className={`h-8 w-8 md:h-9 md:w-9 rounded-md border text-xs md:text-sm ${page === i + 1
                                        ? "bg-blue-600 text-white"
                                        : "bg-white hover:bg-gray-50"
                                    }`}
                            >
                                {i + 1}
                            </button>
                        ))}
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="h-8 w-8 md:h-9 md:w-9 rounded-md border bg-white text-xs md:text-sm hover:bg-gray-50 disabled:opacity-50"
                        >
                            ›
                        </button>
                    </div>
                </div>
            )}

            {/* Create/Edit Modal */}
            <Modal
                open={openModal}
                onClose={() => {
                    setOpenModal(false);
                    setEditItem(null);
                }}
                title={editItem ? "Edit Announcement" : "New Announcement"}
                className="max-w-3xl"
            >
                <AnnouncementForm
                    editItem={editItem}
                    onSave={handleSave}
                    onCancel={() => setOpenModal(false)}
                />
            </Modal>

            {/* View Modal */}
            <Modal
                open={!!viewItem}
                onClose={() => setViewItem(null)}
                title="View Announcement"
                className="max-w-2xl"
            >
                {viewItem && (
                    <div className="space-y-4 md:space-y-5 text-gray-800 text-xs md:text-sm max-h-[70vh] overflow-y-auto p-1 md:p-2">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <span
                                className={`px-2 md:px-3 py-0.5 md:py-1 text-[10px] md:text-xs font-medium rounded-full ${categoryColor(
                                    viewItem.category
                                )}`}
                            >
                                {viewItem.category}
                            </span>
                            <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs text-gray-500">
                                <CalendarDays className="w-3 h-3 md:w-4 md:h-4" />
                                {new Date(viewItem.date).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                })}
                            </div>
                        </div>

                        <h3 className="text-lg md:text-xl font-semibold leading-snug text-gray-900">
                            {viewItem.title}
                        </h3>
                        <p className="text-xs md:text-sm text-gray-500 mb-1 md:mb-2">
                            By {viewItem.author}
                        </p>

                        <div className="border-t border-gray-200 pt-2 md:pt-3 text-gray-700 whitespace-pre-line leading-relaxed">
                            {viewItem.text}
                        </div>

                        <div className="flex justify-end pt-3 md:pt-4">
                            <button
                                onClick={() => confirmDelete(viewItem)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 md:py-2 bg-red-600 hover:bg-red-700 text-white text-xs md:text-sm font-medium rounded-md"
                            >
                                <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4" /> Delete
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Confirm Delete Dialog */}
            <ConfirmDialog
                open={!!confirmData}
                title={confirmData?.title}
                message={confirmData?.message}
                onCancel={() => setConfirmData(null)}
                onConfirm={confirmData?.onConfirm}
            />
        </div>
    );
}

/* ---------- Form with Add Category ---------- */
function AnnouncementForm({ editItem, onSave, onCancel }) {
    const [form, setForm] = useState({
        title: "",
        category: "Parish Advisory",
        date: "",
        text: "",
    });
    const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
    const [showNewCategory, setShowNewCategory] = useState(false);
    const [newCategory, setNewCategory] = useState("");

    useEffect(() => {
        if (editItem) {
            setForm({
                ...editItem,
                date: new Date(editItem.date).toISOString().split("T")[0], // ✅ Proper date format for <input type="date">
            });
        }
    }, [editItem]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((f) => ({ ...f, [name]: value }));
    };

    const handleAddCategory = () => {
        if (!newCategory.trim()) {
            toast.error("Enter a category name");
            return;
        }
        const exists = categories.find(
            (c) => c.label.toLowerCase() === newCategory.toLowerCase()
        );
        if (exists) {
            toast.error("Category already exists");
            return;
        }

        const newCat = { value: newCategory, label: newCategory };
        setCategories((prev) => [...prev, newCat]);
        setForm((f) => ({ ...f, category: newCategory }));
        setNewCategory("");
        setShowNewCategory(false);
        toast.success("Category added");
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.title.trim() || !form.text.trim()) {
            toast.error("Title and content are required");
            return;
        }
        if (!form.date) {
            toast.error("Date is required");
            return;
        }
        onSave(form);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4 mt-1 md:mt-2">
            <div>
                <label className="text-xs md:text-sm font-medium text-gray-700">Title</label>
                <input
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-md border border-gray-300 p-1.5 md:p-2 text-xs md:text-sm"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div>
                    <label className="text-xs md:text-sm font-medium text-gray-700">Category</label>
                    <Dropdown
                        value={form.category}
                        onChange={(v) => setForm((f) => ({ ...f, category: v }))}
                        options={categories}
                        width="w-full"
                    />

                    <button
                        type="button"
                        onClick={() => setShowNewCategory(true)}
                        className="mt-1.5 md:mt-2 text-[10px] md:text-xs text-gray-600 hover:text-gray-900 inline-flex items-center gap-0.5 md:gap-1"
                    >
                        <Plus className="w-3 h-3" /> Add Category
                    </button>

                    {showNewCategory && (
                        <div className="mt-1.5 md:mt-2 flex items-center gap-1.5 md:gap-2">
                            <input
                                type="text"
                                value={newCategory}
                                onChange={(e) => setNewCategory(e.target.value)}
                                placeholder="New category name"
                                className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs md:text-sm"
                            />
                            <button
                                type="button"
                                onClick={handleAddCategory}
                                className="px-2 md:px-3 py-1 text-xs md:text-sm bg-gray-900 text-white rounded-md hover:bg-gray-800 whitespace-nowrap"
                            >
                                Add
                            </button>
                        </div>
                    )}
                </div>

                <div>
                    <label className="text-xs md:text-sm font-medium text-gray-700">Date</label>
                    <input
                        type="date"
                        name="date"
                        value={form.date}
                        onChange={handleChange}
                        className="mt-1 w-full rounded-md border border-gray-300 p-1.5 md:p-2 text-xs md:text-sm"
                    />
                </div>
            </div>

            <div>
                <label className="text-xs md:text-sm font-medium text-gray-700">Content</label>
                <textarea
                    name="text"
                    rows={4}
                    value={form.text}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-md border border-gray-300 p-1.5 md:p-2 text-xs md:text-sm"
                />
            </div>

            <div className="flex justify-end gap-1.5 md:gap-2 pt-1 md:pt-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm bg-gray-900 text-white rounded-md hover:bg-gray-800"
                >
                    Save
                </button>
            </div>
        </form>
    );
}
