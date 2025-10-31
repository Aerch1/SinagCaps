"use client";

import { useState } from "react";
import { Image, FileText, File, Eye, Download } from "lucide-react";
import ImageViewerModal from "./modal/ImageViewerModal";

export default function DocumentsSection({ documents }) {
    const [showViewer, setShowViewer] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [hoveredImage, setHoveredImage] = useState(null);

    const getFileIcon = (url) => {
        if (!url) return <File className="w-4 h-4 text-gray-500" />;
        if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
            return <Image className="w-4 h-4 text-blue-500" />;
        } else if (url.match(/\.pdf$/i)) {
            return <FileText className="w-4 h-4 text-red-500" />;
        } else {
            return <File className="w-4 h-4 text-gray-500" />;
        }
    };

    const isImageFile = (url) => {
        return url && url.match(/\.(jpg|jpeg|png|gif|webp)$/i);
    };

    const getFileName = (url) => {
        if (!url) return "Unknown file";
        const parts = url.split("/");
        return decodeURIComponent(parts[parts.length - 1]);
    };

    const handleView = (index) => {
        setSelectedIndex(index);
        setShowViewer(true);
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
            <section className="bg-white rounded-xl border p-5 relative">
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-4 flex items-center gap-2">
                    <div className="w-1 h-4 bg-orange-500 rounded-full" />
                    Uploaded Documents
                </h4>

                {(!documents || documents.length === 0) ? (
                    <p className="text-sm text-gray-500 italic">No documents uploaded.</p>
                ) : (
                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent relative">
                        {documents.map((doc, idx) => (
                            <div
                                key={idx}
                                className="relative flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors group"
                                onMouseEnter={() => isImageFile(doc.url) && setHoveredImage(doc.url)}
                                onMouseLeave={() => setHoveredImage(null)}
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
                                        onClick={() => handleView(idx)}
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

                                {/* Hover Image Preview */}
                                {hoveredImage === doc.url && (
                                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 z-[9999] pointer-events-none animate-fadeIn">
                                        <div className="bg-white rounded-lg shadow-2xl border-2 border-gray-200 p-2">
                                            <img
                                                src={doc.url}
                                                alt="Preview"
                                                className="w-64 h-64 object-contain rounded"
                                                onError={(e) => { e.target.style.display = "none"; }}
                                            />
                                            <div className="absolute -left-2 top-1/2 w-4 h-4 bg-white border-l-2 border-t-2 border-gray-200 transform -translate-y-1/2 rotate-45" />
                                        </div>
                                    </div>
                                )}
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
                    documents={documents}
                    initialIndex={selectedIndex}
                />
            )}

            {/* Fade Animation */}
            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(4px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.15s ease-out forwards;
                }
            `}</style>
        </>
    );
}
