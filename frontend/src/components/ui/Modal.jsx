"use client";
export default function Modal({ open, onClose, title, children, className = "" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 p-4">
      <div
        className={`relative w-full rounded-xl  bg-white p-5  shadow-xl ${className}`}
      >
        {title ? (
          <h3 className="mb-3 text-base font-semibold text-gray-900">{title}</h3>
        ) : null}

        {children}

        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 rounded-md px-2 py-1 text-gray-500 hover:bg-gray-100"
        >
          ×
        </button>
      </div>
    </div>
  );
}
