"use client";

import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Download, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ImageViewerModal({ isOpen, onClose, documents, initialIndex = 0 }) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    useEffect(() => {
        setCurrentIndex(initialIndex);
    }, [initialIndex]);

    // ✅ Lock body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isOpen) return;
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowLeft") handlePrevious();
            if (e.key === "ArrowRight") handleNext();
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, currentIndex]);

    if (!isOpen || !documents || documents.length === 0) return null;

    const currentDoc = documents[currentIndex];
    const isImage = currentDoc?.url?.match(/\.(jpg|jpeg|png|gif|webp)$/i);

    const handlePrevious = () => {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : documents.length - 1));
    };

    const handleNext = () => {
        setCurrentIndex((prev) => (prev < documents.length - 1 ? prev + 1 : 0));
    };

    const getFileName = (url) => {
        if (!url) return "Document";
        const parts = url.split("/");
        const filename = parts[parts.length - 1];
        return decodeURIComponent(filename);
    };


    // ✅ Cloudinary-safe download URL
    const getDownloadUrl = (url) => {
        if (!url) return "";
        const parts = url.split("/upload/");
        if (parts.length !== 2) return url;
        return `${parts[0]}/upload/fl_attachment/${parts[1]}`;
    };


    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95"
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                overscrollBehavior: "contain",
            }}
        >
            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
                <X className="w-6 h-6" />
            </button>
                  {/* Download Button */}
            <a
                href={getDownloadUrl(currentDoc.url)} // ✅ uses Cloudinary download format
                download
                className="absolute top-4 right-20 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
                <Download className="w-6 h-6" />
            </a>

            {/* Navigation Arrows */}
            {documents.length > 1 && (
                <>
                    <button
                        onClick={handlePrevious}
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                    >
                        <ChevronLeft className="w-8 h-8" />
                    </button>
                    <button
                        onClick={handleNext}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                    >
                        <ChevronRight className="w-8 h-8" />
                    </button>
                </>
            )}

            {/* Document Counter */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-white/10 text-white text-sm font-medium">
                {currentIndex + 1} / {documents.length}
            </div>

            {/* Content Area */}
            <div className="w-full h-full flex items-center justify-center p-4">
                <AnimatePresence mode="wait">
                    {isImage ? (
                        <motion.img
                            key={currentDoc.url}
                            src={currentDoc.url}
                            alt={getFileName(currentDoc.url)}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.3 }}
                            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl select-none"
                        />
                    ) : (
                        <motion.div
                            key={currentDoc.url}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="bg-white rounded-xl p-8 max-w-md text-center"
                        >
                            <div className="flex justify-center mb-4">
                                <div className="p-4 rounded-full bg-gray-100">
                                    <FileText className="w-12 h-12 text-gray-600" />
                                </div>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                {getFileName(currentDoc.url)}
                            </h3>
                            <p className="text-sm text-gray-600 mb-6">
                                This file type cannot be previewed.
                            </p>

                            <a
                                href={currentDoc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <Download className="w-4 h-4" />
                                Download File
                            </a>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Bottom Controls: Filename + Thumbnails */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 max-w-full px-4">
                <div className="max-w-xl px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm font-medium text-center truncate">
                    {getFileName(currentDoc.url)}
                </div>

                {documents.length > 1 && (
                    <div className="flex gap-2 max-w-screen-lg overflow-x-auto p-2 bg-white/5 backdrop-blur-sm rounded-lg">
                        {documents.map((doc, idx) => {
                            const isThumbImage = doc.url?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                            return (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentIndex(idx)}
                                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${idx === currentIndex
                                            ? "border-white scale-110"
                                            : "border-white/30 opacity-60 hover:opacity-100"
                                        }`}
                                >
                                    {isThumbImage ? (
                                        <img
                                            src={doc.url}
                                            alt={`Thumbnail ${idx + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                                            <FileText className="w-6 h-6 text-gray-400" />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
