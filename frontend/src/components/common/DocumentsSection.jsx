"use client";

import { useState } from "react";
import { Image, FileText, File, Eye, Download } from "lucide-react";
import ImageViewerModal from "./modal/ImageViewerModal";

export default function DocumentsSection({ documents }) {
    const [showViewer, setShowViewer] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);

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

    const getFileName = (url) => {
        if (!url) return "Unknown file";
        const parts = url.split("/");
        return decodeURIComponent(parts[parts.length - 1]);
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

    const getDownloadUrl = (url) => {
        if (!url) return "";

        const fileExtension = getFileExtension(url);
        const fileName = getFileName(url);

        // For Cloudinary URLs, add fl_attachment flag to force download
        if (url.includes('cloudinary.com')) {
            const parts = url.split("/upload/");
            if (parts.length === 2) {
                // For PDFs and other documents, use fl_attachment with filename
                if (fileExtension === 'pdf' || fileExtension === 'doc' || fileExtension === 'docx') {
                    return `${parts[0]}/upload/fl_attachment:${encodeURIComponent(fileName)}/${parts[1]}`;
                }
                // For images, keep original behavior
                return `${parts[0]}/upload/fl_attachment/${parts[1]}`;
            }
        }

        return url;
    };

    const handleDownload = async (doc, idx) => {
        const downloadUrl = getDownloadUrl(doc.url);
        const fileName = getFileName(doc.url);

        try {
            // Method 1: Direct download (works for most files)
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = fileName;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Download failed:', error);

            // Method 2: Fallback - open in new tab
            window.open(downloadUrl, '_blank');
        }
    };

    // Check if document is viewable in modal (images only)
    const isViewable = (url) => {
        if (!url) return false;
        return url.match(/\.(jpg|jpeg|png|gif|webp)$/i);
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
                                    {isViewable(doc.url) ? (
                                        <button
                                            onClick={() => handleView(idx)}
                                            className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors flex items-center gap-1"
                                        >
                                            <Eye className="w-3.5 h-3.5" />
                                            View
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => window.open(doc.url, '_blank')}
                                            className="px-3 py-1.5 text-xs font-medium text-green-600 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 transition-colors flex items-center gap-1"
                                        >
                                            <Eye className="w-3.5 h-3.5" />
                                            Preview
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDownload(doc, idx)}
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

            {/* Image Viewer Modal - Only for images */}
            {documents?.length > 0 && (
                <ImageViewerModal
                    isOpen={showViewer}
                    onClose={() => setShowViewer(false)}
                    documents={documents.filter(doc => isViewable(doc.url))}
                    initialIndex={selectedIndex}
                />
            )}
        </>
    );
}