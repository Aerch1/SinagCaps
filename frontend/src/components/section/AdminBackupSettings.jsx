"use client";

import { useState } from "react";
import { Download, Upload, Loader2, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/api/api";
import ConfirmDialog from "../ui/ConfirmDialog"; // ✅ import your existing dialog

export default function AdminBackupSettings() {
    const [importFile, setImportFile] = useState(null);
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    // 📦 Download backup
    const handleExport = async () => {
        try {
            setIsExporting(true);
            const res = await api.get("/admin/backup/export", { responseType: "blob" });

            const blob = new Blob([res.data], { type: "application/json" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `backup-${new Date().toISOString().slice(0, 19)}.json`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);

            toast.success("Backup exported successfully");
        } catch (err) {
            console.error("Export error:", err);
            toast.error(err.response?.data?.message || "Failed to export backup");
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
            setImportFile(null);
            setShowConfirm(false);
        } catch (err) {
            console.error("Import error:", err);
            toast.error(err.response?.data?.message || "Failed to import backup");
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
