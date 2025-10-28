"use client";

import React, { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import api from "@/api/api";
import Modal from "@/components/ui/Modal";

export default function EventNewsModal({ isOpen, onClose, onSaved, editItem }) {
    const emptyForm = {
        title: "",
        description: "",
        date: "",
        time: "",
        end_time: "", // ✅ new field for backend validation
        type: "event",
        status: "Active",
        image: null,
    };

    const [form, setForm] = useState(emptyForm);
    const [errors, setErrors] = useState({});
    const [preview, setPreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset form when opened or edit changes
    useEffect(() => {
        if (editItem) {
            setForm({
                title: editItem.title || "",
                description: editItem.description || "",
                date: editItem.date || "",
                time: editItem.time || "",
                end_time: editItem.end_time || "", // include end_time
                type: editItem.type || "event",
                status: editItem.status || "Active",
                image: null,
            });
            setPreview(editItem.image_url || null);
        } else {
            setForm(emptyForm);
            setPreview(null);
        }
        setErrors({});
    }, [editItem, isOpen]);

    // Dropzone
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: {
            "image/png": [],
            "image/jpeg": [],
            "image/webp": [],
            "image/svg+xml": [],
        },
        onDrop: (acceptedFiles) => {
            const file = acceptedFiles[0];
            setForm((prev) => ({ ...prev, image: file || null }));
            setPreview(file ? URL.createObjectURL(file) : editItem?.image_url || null);
        },
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((f) => ({ ...f, [name]: value }));
    };

    const handleClose = () => {
        setForm(emptyForm);
        setErrors({});
        setPreview(null);
        onClose?.();
    };

    // Submit handler
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const loadingToast = toast.loading(editItem ? "Updating..." : "Uploading...");

        const data = new FormData();
        Object.entries(form).forEach(([key, value]) => {
            if (value !== null) data.append(key, value);
        });

        try {
            if (editItem) {
                await api.put(`/admin/events/${editItem.id}`, data, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                toast.success("Event updated successfully", { id: loadingToast });
            } else {
                await api.post("/admin/events", data, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                toast.success("Event created successfully", { id: loadingToast });
            }

            onSaved?.();
            handleClose();
        } catch (err) {
            toast.error("Something went wrong", { id: loadingToast });
            if (err.response?.data?.errors) setErrors(err.response.data.errors);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            open={isOpen}
            onClose={handleClose}
            title={editItem ? "Edit Event/News" : "Create Event/News"}
            className="max-w-3xl"
        >
            <form onSubmit={handleSubmit} className="space-y-6 max-h-[75vh] overflow-y-auto p-2">
                {/* Title */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Title</label>
                    <input
                        name="title"
                        value={form.title}
                        onChange={handleChange}
                        className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm"
                    />
                    {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title}</p>}
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        rows={5}
                        placeholder="Enter description..."
                        className={`mt-1 w-full rounded-md border p-2 text-sm focus:outline-none ${errors.description ? "border-red-500" : "border-gray-300 focus:border-gray-400"
                            }`}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Include event or news details, description, and notes.
                    </p>
                </div>

                {/* Dropzone */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Upload Image</label>
                    <div
                        {...getRootProps()}
                        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition ${isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
                            }`}
                    >
                        <input {...getInputProps()} />
                        {preview ? (
                            <div className="flex flex-col items-center gap-3">
                                <img
                                    src={preview}
                                    alt="Preview"
                                    className="h-40 w-auto object-contain rounded-md"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        setPreview(null);
                                        setForm((prev) => ({ ...prev, image: null }));
                                    }}
                                    className="text-xs text-red-500 hover:underline"
                                >
                                    Remove image
                                </button>
                            </div>
                        ) : (
                            <div>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="mx-auto h-10 w-10 text-gray-400 mb-2"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6h.1a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                    />
                                </svg>
                                <p className="text-sm text-gray-600">
                                    Drag & drop image here, or click to browse
                                </p>
                                <p className="text-xs text-gray-400">PNG, JPG, WEBP, or SVG</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Date</label>
                        <input
                            type="date"
                            name="date"
                            value={form.date}
                            onChange={handleChange}
                            className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm"
                        />
                        {errors.date && <p className="text-xs text-red-600 mt-1">{errors.date}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Time</label>
                        <input
                            type="time"
                            name="time"
                            value={form.time}
                            onChange={handleChange}
                            className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm"
                        />
                        {errors.time && <p className="text-xs text-red-600 mt-1">{errors.time}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">End Time</label>
                        <input
                            type="time"
                            name="end_time"
                            value={form.end_time}
                            onChange={handleChange}
                            className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm"
                        />
                        {errors.end_time && <p className="text-xs text-red-600 mt-1">{errors.end_time}</p>}
                    </div>
                </div>

                {/* Type & Status */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Type</label>
                        <select
                            name="type"
                            value={form.type}
                            onChange={handleChange}
                            className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm"
                        >
                            <option value="event">Event</option>
                            <option value="news">News</option>
                        </select>
                        {errors.type && <p className="text-xs text-red-600 mt-1">{errors.type}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Status</label>
                        <select
                            name="status"
                            value={form.status}
                            onChange={handleChange}
                            className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm"
                        >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>
                </div>

                {/* Submit */}
                <div className="pb-2">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`w-full rounded-md text-white py-2 text-sm font-medium transition ${isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-gray-900 hover:bg-gray-800"
                            }`}
                    >
                        {isSubmitting ? "Saving..." : editItem ? "Update" : "Create"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
