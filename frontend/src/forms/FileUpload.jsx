"use client";

import { useState } from "react";
import { Upload, X, FileText, Image, File, Info } from "lucide-react";

const RequiredIndicator = () => <span className="text-red-500 ml-1">*</span>;
const SectionHeader = ({ title, description }) => (
    <div className="pb-4 border-b border-gray-200">
        <h4 className="text-base font-semibold text-gray-900">{title}</h4>
        {description && <p className="text-sm text-gray-600 mt-1.5">{description}</p>}
    </div>
);

export default function FileUpload({ uploadedFiles, setUploadedFiles }) {
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState("");
    const [showTip, setShowTip] = useState(false);

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const MAX_FILES = 10;
    const ALLOWED_TYPES = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    const validateFile = (file) => {
        if (file.size > MAX_FILE_SIZE) {
            return `${file.name} is too large (max 5MB)`;
        }
        if (!ALLOWED_TYPES.includes(file.type)) {
            return `${file.name} has invalid type (only JPG, PNG, PDF, DOC, DOCX allowed)`;
        }
        return null;
    };

    const handleFiles = (files) => {
        const fileArray = Array.from(files);
        setError("");

        // Check total file count
        if (uploadedFiles.length + fileArray.length > MAX_FILES) {
            setError(`Maximum ${MAX_FILES} files allowed`);
            return;
        }

        // Validate each file
        const errors = [];
        const validFiles = [];

        fileArray.forEach((file) => {
            const err = validateFile(file);
            if (err) {
                errors.push(err);
            } else {
                validFiles.push(file);
            }
        });

        if (errors.length > 0) {
            setError(errors.join(", "));
        }

        if (validFiles.length > 0) {
            setUploadedFiles([...uploadedFiles, ...validFiles]);
        }
    };

    const handleFileInput = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFiles(e.target.files);
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    };

    const removeFile = (index) => {
        setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
        setError("");
    };

    const getFileIcon = (file) => {
        if (file.type.startsWith("image/")) {
            return <Image className="w-5 h-5 text-blue-500" />;
        } else if (file.type === "application/pdf") {
            return <FileText className="w-5 h-5 text-red-500" />;
        } else {
            return <File className="w-5 h-5 text-gray-500" />;
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
    };

    return (
        <section className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 lg:p-8 shadow-sm">
            {/* Header with Info Tooltip */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-base font-semibold text-gray-900">
                            Upload Documents{" "}
                            <span className="text-gray-400 text-sm font-normal">(Optional)</span>
                        </h4>
                        <div
                            className="relative"
                            onMouseEnter={() => setShowTip(true)}
                            onMouseLeave={() => setShowTip(false)}
                        >
                            <button
                                type="button"
                                onClick={() => setShowTip((s) => !s)}
                                className="p-1.5 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                            >
                                <Info className="h-4 w-4" />
                            </button>
                            {showTip && (
                                <div className="absolute z-50 left-0 sm:left-full sm:ml-2 top-full sm:top-0 mt-2 sm:mt-0 w-72 sm:w-80 rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-700 shadow-xl">
                                    <p className="font-semibold text-gray-900 mb-2">
                                        File Upload Requirements:
                                    </p>
                                    <ul className="list-disc list-inside space-y-1.5 text-gray-600">
                                        <li>Accepted formats: JPG, PNG, PDF, DOC, DOCX</li>
                                        <li>Maximum file size: 5MB per file</li>
                                        <li>Up to 10 files allowed</li>
                                        <li>Supporting documents help speed up processing</li>
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                    <p className="text-sm text-gray-600">
                        Mag-upload ng mga karagdagang dokumento (Birth Certificate, Valid ID, atbp.)
                    </p>
                </div>
            </div>

            {/* Drop Zone */}
            <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-xl p-8 sm:p-10 text-center transition-all ${dragActive
                    ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                    : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50"
                    }`}
            >
                <input
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                    onChange={handleFileInput}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    id="file-upload-input"
                />

                <div className="flex flex-col items-center gap-4">
                    <div className="p-4 rounded-full bg-blue-100">
                        <Upload className="w-8 h-8 text-blue-600" />
                    </div>
                    <div>
                        <label
                            htmlFor="file-upload-input"
                            className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer text-base"
                        >
                            Click to upload
                        </label>
                        <span className="text-gray-600 text-base"> or drag and drop</span>
                    </div>
                    <p className="text-sm text-gray-500">
                        JPG, PNG, PDF, DOC, DOCX up to 5MB
                    </p>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-sm text-red-600 font-medium">{error}</p>
                </div>
            )}

            {/* File List */}
            {uploadedFiles.length > 0 && (
                <div className="mt-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-900">
                            Uploaded Files ({uploadedFiles.length}/{MAX_FILES})
                        </p>
                    </div>
                    <div className="space-y-3">
                        {uploadedFiles.map((file, index) => (
                            <div
                                key={index}
                                className="relative flex items-center justify-between p-4 sm:p-5 bg-gray-50 border border-gray-200 rounded-xl hover:border-gray-300 transition-all"
                            >
                                <div className="flex items-center gap-4 flex-1 min-w-0 pr-4">
                                    <div className="flex-shrink-0">{getFileIcon(file)}</div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {file.name}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {formatFileSize(file.size)}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeFile(index)}
                                    className="flex-shrink-0 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                    aria-label="Remove file"
                                    title="Remove file"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
}