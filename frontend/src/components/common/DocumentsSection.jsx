"use client";

import { useState } from "react";
import { Image, FileText, File, Eye, Download, ExternalLink } from "lucide-react";
import ImageViewerModal from "./modal/ImageViewerModal";

export default function DocumentsSection({ documents }) {
    const [showViewer, setShowViewer] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [downloading, setDownloading] = useState(null);

    const getFileIcon = (url) => {
        if (!url) return <File className="w-4 h-4 text-gray-500" />;
        if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
            return <Image className="w-4 h-4 text-blue-500" />;
        } else if (url.match(/\.pdf$/i)) {
            return <FileText className="w-4 h-4 text-red-500" />;
        } else if (url.match(/\.(doc|docx)$/i)) {
            return <FileText className="w-4 h-4 text-blue-600" />;
        } else {
            return <File className="w-4 h-4 text-gray-500" />;
        }
    };

    const getFileName = (url) => {
        if (!url) return "Unknown file";
        const parts = url.split("/");
        const fileName = parts[parts.length - 1];
        // Remove Cloudinary version and transformation parameters
        return decodeURIComponent(fileName.split('?')[0]);
    };

    const getFileExtension = (url) => {
        if (!url) return "";
        const fileName = getFileName(url);
        const parts = fileName.split(".");
        return parts.length > 1 ? parts.pop().toLowerCase() : "";
    };

    const handleView = (index) => {
        setSelectedIndex(index);
        setShowViewer(true);
    };

    const handleDownload = async (doc, idx) => {
        setDownloading(idx);

        try {
            const fileName = getFileName(doc.url);
            const fileExtension = getFileExtension(doc.url);

            // For PDFs and other documents, use fetch to download the file
            const response = await fetch(doc.url);

            if (!response.ok) {
                throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
            }

            const blob = await response.blob();

            // Create download link
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;

            // Append to body, click, and remove
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Clean up the URL object
            window.URL.revokeObjectURL(url);

        } catch (error) {
            console.error('Download failed:', error);

            // Fallback: Try to open in new tab
            window.open(doc.url, '_blank');
        } finally {
            setDownloading(null);
        }
    };

    const handlePreview = (url) => {
        // For PDFs, open in new tab
        // For images, use the modal (handled separately)
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    // Check if document is viewable in modal (images only)
    const isViewableInModal = (url) => {
        if (!url) return false;
        return url.match(/\.(jpg|jpeg|png|gif|webp)$/i);
    };

    // Check if document can be previewed in browser (PDFs, etc.)
    const isPreviewable = (url) => {
        if (!url) return false;
        const ext = getFileExtension(url);
        return ['pdf', 'doc', 'docx', 'txt'].includes(ext);
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
                                            {getFileExtension(doc.url).toUpperCase()} • Document #{idx + 1}
                                        </p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 ml-3">
                                    {isViewableInModal(doc.url) ? (
                                        <button
                                            onClick={() => handleView(idx)}
                                            className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors flex items-center gap-1"
                                        >
                                            <Eye className="w-3.5 h-3.5" />
                                            View
                                        </button>
                                    ) : isPreviewable(doc.url) ? (
                                        <button
                                            onClick={() => handlePreview(doc.url)}
                                            className="px-3 py-1.5 text-xs font-medium text-green-600 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 transition-colors flex items-center gap-1"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                            Open
                                        </button>
                                    ) : null}

                                    <button
                                        onClick={() => handleDownload(doc, idx)}
                                        disabled={downloading === idx}
                                        className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {downloading === idx ? (
                                            <>
                                                <div className="w-3.5 h-3.5 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                                                Downloading...
                                            </>
                                        ) : (
                                            <>
                                                <Download className="w-3.5 h-3.5" />
                                                Download
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Image Viewer Modal - Only for images */}
            {documents?.length > 0 && (
                <ImageViewerModal
                    isOpen={showViewer}
                    onClose={() => setShowViewer(false)}
                    documents={documents.filter(doc => isViewableInModal(doc.url))}
                    initialIndex={selectedIndex}
                />
            )}
        </>
    );
}