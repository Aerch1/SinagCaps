"use client";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

export default function Modal({ open, onClose, title, children, className = "" }) {
  if (typeof window === "undefined") return null;

  const modalContent = (
    <AnimatePresence>
      {open && (
        <motion.div
          key="backdrop"
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose?.();
          }}
        >
          <motion.div
            key="modal"
            className={`relative w-full max-w-2xl rounded-xl bg-white p-5 shadow-xl ${className}`}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {title && (
              <h3 className="mb-3 text-base font-semibold text-gray-900">{title}</h3>
            )}
            {children}
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute right-3 top-3 rounded-md px-2 py-1 text-gray-500 hover:bg-gray-100 transition"
            >
              ×
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // ✅ Render modal to <body>, outside of sidebar stacking context
  return createPortal(modalContent, document.body);
}
