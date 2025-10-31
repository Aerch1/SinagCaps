"use client";

import { useState } from "react";
import { Image, FileText, File, Eye, Download } from "lucide-react";
import ImageViewerModal from "./modal/ImageViewerModal";

export default function DocumentsSection({ documents }) {
    const [showViewer, setShowViewer] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);

    const isImage = (url) => /\.(jpg|jpeg|png|gif|webp)$/i.test(url || "");
    const isPDF = (url) => /\.pdf$/i.test(url || "");
    const isDoc = (url) => /\.(doc|docx)$/i.test(url || "");

    const getFileIcon = (url) => {
        if (!url) return <File className="w-4 h-4 text-gray-500" />;
        if (isImage(url)) return <Image className="w-4 h-4 text-blue-500" />;
        if (isPDF(url)) return <FileText className="w-4 h-4 text-red-500" />;
        if (isDoc(url)) return <FileText className="w-4 h-4 text-indigo-500" />;
        return <File className="w-4 h-4 text-gray-500" />;
    };

    const getFileName = (url) => {
        if (!url) return "Unknown file";
        const parts = url.split("/");
        return decodeURIComponent(parts[parts.length - 1]);
    };

    const handleView = (index, url) => {
        if (isImage(url)) {
            setSelectedIndex(index);
            setShowViewer(true);
        } else {
            // For non-image files, just download directly
            handleDownload({ url });
        }
    };

    const getDownloadUrl = (url) => {
        if (!url) return "";
        if (url.includes("cloudinary.com")) {
            const parts = url.split("/upload/");
            if (parts.length === 2) {
                return `${parts[0]}/upload/fl_attachment/${parts[1]}`;
            }
        }
        return url;
    };

    const handleDownload = (doc) => {
        const downloadUrl = getDownloadUrl(doc.url);
        const fileName = getFileName(doc.url);

        // Create a temporary link for reliable download
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = fileName;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <>
            <section className="bg-white rounded-xl border p-5">
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-4 flex items-center gap-2">
                    <div className="w-1 h-4 bg-orange-500 rounded-full" />
                    Uploaded Documents
                </h4>

                {(!documents || documents.length === 0) ? (
                    <p className="text-sm text-gray-500 italic">No documents uploaded.</p>
                ) : (
                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                        {documents.map((doc, idx) => (
                            <div
                                key={idx}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors group"
                            >
                                {/* File Info */}
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="flex-shrink-0">{getFileIcon(doc.url)}</div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {getFileName(doc.url)}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Document #{idx + 1}
                                        </p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 ml-3">
                                    <button
                                        onClick={() => handleView(idx, doc.url)}
                                        className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors flex items-center gap-1"
                                    >
                                        <Eye className="w-3.5 h-3.5" />
                                        View
                                    </button>
                                    <button
                                        onClick={() => handleDownload(doc)}
                                        className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-1"
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                        Download
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Image Viewer Modal */}
            {documents?.length > 0 && (
                <ImageViewerModal
                    isOpen={showViewer}
                    onClose={() => setShowViewer(false)}
                    documents={documents.filter((d) => isImage(d.url))}
                    initialIndex={selectedIndex}
                />
            )}
        </>
    );
}
