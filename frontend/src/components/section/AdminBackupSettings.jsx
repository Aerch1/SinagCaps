"use client";

import { useState, useEffect } from "react";
import { Download, Upload, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/api/api";
import ConfirmDialog from "../ui/ConfirmDialog"; // ✅ existing dialog

export default function AdminBackupSettings() {
    const [importFile, setImportFile] = useState(null);
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [recent, setRecent] = useState([]);

    /* 🧾 Load recent backups from localStorage */
    useEffect(() => {
        const saved = localStorage.getItem("recentBackups");
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                const restored = parsed.map((b) => {
                    if (b.blobData) {
                        const byteArray = Uint8Array.from(atob(b.blobData), (c) => c.charCodeAt(0));
                        const blob = new Blob([byteArray], { type: b.mimeType });
                        const url = URL.createObjectURL(blob);
                        return { ...b, url };
                    }
                    return b;
                });
                setRecent(restored);
            } catch {
                localStorage.removeItem("recentBackups");
            }
        }
    }, []);

    /* 💾 Persist updated backups in localStorage */
    useEffect(() => {
        if (recent.length === 0) return;

        const timeout = setTimeout(async () => {
            try {
                const prepared = await Promise.all(
                    recent.map(async (b) => {
                        if (b.url && !b.blobData) {
                            const blob = await fetch(b.url).then((res) => res.blob());
                            const arrayBuffer = await blob.arrayBuffer();
                            const binary = String.fromCharCode(...new Uint8Array(arrayBuffer));
                            const blobData = btoa(binary);
                            return { ...b, blobData, mimeType: blob.type, url: undefined };
                        }
                        const { url, ...rest } = b;
                        return rest;
                    })
                );

                // optional: prevent saving overly large data
                const dataString = JSON.stringify(prepared);
                if (dataString.length > 4_000_000) {
                    console.warn("Backup data too large for localStorage. Skipping save.");
                    return;
                }

                localStorage.setItem("recentBackups", dataString);
            } catch (err) {
                console.error("Error saving backup data:", err);
            }
        }, 500); // small delay to prevent loop

        return () => clearTimeout(timeout);
    }, [recent]);



    // 📦 Export backup
    const handleExport = async () => {
        try {
            setIsExporting(true);
            const res = await api.get("/admin/backup/export", { responseType: "blob" });
            const blob = new Blob([res.data], { type: "application/json" });
            const url = window.URL.createObjectURL(blob);
            const filename = `backup-${new Date().toISOString().slice(0, 19)}.json`;

            // trigger file download
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);

            // convert to base64 for local history
            const arrayBuffer = await blob.arrayBuffer();
            const binary = String.fromCharCode(...new Uint8Array(arrayBuffer));
            const blobData = btoa(binary);

            const newBackup = {
                id: Date.now().toString(),
                title: "Database Backup",
                date: new Date(),
                status: "Exported",
                filename,
                blobData,
                mimeType: blob.type,
                url,
            };

            setRecent((prev) => [newBackup, ...prev].slice(0, 8));
            toast.success("Backup exported successfully");
        } catch (err) {
            console.error("Export error:", err);
        } finally {
            setIsExporting(false);
        }
    };

    // 📥 Trigger confirmation before import
    const handleImportClick = () => {
        if (!importFile) return toast.error("Please select a backup file");
        setShowConfirm(true);
    };

    // 📥 Confirm and proceed import
    const confirmImport = async () => {
        try {
            setIsImporting(true);
            const formData = new FormData();
            formData.append("file", importFile);
            await api.post("/admin/backup/import", formData);
            toast.success("Backup imported successfully!");

            // add to history
            setRecent((prev) => [
                {
                    id: Date.now().toString(),
                    title: "Backup Restore",
                    date: new Date(),
                    status: "Imported",
                    filename: importFile.name,
                },
                ...prev,
            ]);

            setImportFile(null);
            setShowConfirm(false);
        } catch (err) {
            console.error("Import error:", err);
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <>
            <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 md:p-6">
                    <div className="flex items-center justify-between mb-4 md:mb-6">
                        <div>
                            <h3 className="text-sm md:text-base font-semibold text-gray-900">
                                Backup & Restore
                            </h3>
                            <p className="text-xs md:text-sm text-gray-500 mt-0.5">
                                Manage your database backup and restore your data if needed.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-5 md:space-y-6">
                        {/* Export Section */}
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4 border rounded-lg p-4">
                            <div>
                                <h4 className="text-sm font-semibold text-gray-900">Export Backup</h4>
                                <p className="text-xs md:text-sm text-gray-500">
                                    Download a full copy of the database as a JSON file.
                                </p>
                            </div>
                            <button
                                onClick={handleExport}
                                disabled={isExporting}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs md:text-sm font-medium transition-colors disabled:opacity-50"
                            >
                                {isExporting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Exporting...
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-4 h-4" />
                                        Download Backup
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Import Section */}
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4 border rounded-lg p-4">
                            <div>
                                <h4 className="text-sm font-semibold text-gray-900">Import Backup</h4>
                                <p className="text-xs md:text-sm text-gray-500">
                                    Restore your database from a previously saved backup.
                                </p>
                            </div>
                            <div className="flex flex-col md:flex-row gap-2 md:gap-3">
                                <input
                                    type="file"
                                    accept=".json"
                                    onChange={(e) => setImportFile(e.target.files[0])}
                                    className="block text-xs md:text-sm text-gray-600 border border-gray-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 file:mr-3 file:px-2 file:py-1.5 file:rounded-lg file:border-0 file:bg-gray-100 file:text-gray-700 file:text-xs md:file:text-sm"
                                />
                                <button
                                    onClick={handleImportClick}
                                    disabled={isImporting}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs md:text-sm font-medium transition-colors disabled:opacity-50"
                                >
                                    {isImporting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Importing...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-4 h-4" />
                                            Import Backup
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Warning Section */}
                        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-700">
                            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                            <p className="text-xs md:text-sm">
                                <strong>Important:</strong> Importing a backup may overwrite
                                existing data. Make sure you have the correct file before
                                proceeding.
                            </p>
                        </div>

                        {/* 🧾 Recent Backups */}
                        <div className="rounded-lg border border-gray-200 bg-white">
                            <div className="border-b border-gray-100 px-5 py-3 text-sm font-medium text-gray-800">
                                Recent Backups
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                                <ul className="divide-y divide-gray-100">
                                    {recent.length === 0 ? (
                                        <li className="px-5 py-6 text-sm text-gray-500">
                                            No backups yet.
                                        </li>
                                    ) : (
                                        recent.map((b) => (
                                            <li key={b.id} className="px-5 py-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <div className="truncate text-sm font-medium text-gray-900">
                                                            {b.title}
                                                        </div>
                                                        <div className="mt-1 text-xs text-gray-500">
                                                            {new Date(b.date).toLocaleString()}
                                                        </div>
                                                        <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700">
                                                            <CheckCircle2 className="h-3 w-3" /> {b.status}
                                                        </span>
                                                    </div>
                                                    {b.url && (
                                                        <a
                                                            href={b.url}
                                                            download={b.filename}
                                                            className="shrink-0 rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                                                        >
                                                            Download
                                                        </a>
                                                    )}
                                                </div>
                                            </li>
                                        ))
                                    )}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 🧭 Confirm Dialog */}
            <ConfirmDialog
                open={showConfirm}
                title="Confirm Backup Import"
                message="Are you sure you want to import this backup? This will overwrite your current data and cannot be undone."
                onConfirm={confirmImport}
                onCancel={() => setShowConfirm(false)}
                submitting={isImporting}
            />
        </>
    );
}
