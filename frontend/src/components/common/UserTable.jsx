"use client";

import React, { useMemo, useState } from "react";
import { Search, Trash2, UserCheck, UserX } from "lucide-react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

const statusClass = (s) => {
  const v = String(s || "").toLowerCase();
  if (v === "activated")
    return "bg-green-100 text-green-700 border border-green-200";
  if (v === "deactivated")
    return "bg-gray-100 text-gray-700 border border-gray-200";
  return "bg-gray-100 text-gray-700 border border-gray-200";
};

export default function UserTable({ rows = [], onAction }) {
  const [query, setQuery] = useState("");
  const [confirmAction, setConfirmAction] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // 🔍 Filter by search
  const filtered = useMemo(() => {
    if (!query.trim()) return rows;
    const q = query.toLowerCase();
    return rows.filter(
      (r) =>
        r.name?.toLowerCase().includes(q) ||
        r.email?.toLowerCase().includes(q)
    );
  }, [rows, query]);

  // ✅ Confirm dialog handler
  const handleConfirm = async () => {
    if (!confirmAction) return;
    setSubmitting(true);
    try {
      await onAction?.(confirmAction.id, confirmAction.type);
    } finally {
      setSubmitting(false);
      setConfirmAction(null);
    }
  };

  return (
    <div className="space-y-3 md:space-y-4 w-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 md:gap-3">
        <h2 className="text-sm md:text-base font-semibold text-slate-900">
          User List
        </h2>
        <div className="relative w-full sm:w-56 md:w-64">
          <Search className="absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-8 md:pl-9 pr-2 md:pr-3 py-1.5 md:py-2 border border-gray-300 rounded-md text-xs md:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-xs md:text-sm">
          <thead className="bg-gray-50">
            <tr>
              {["Name", "Email", "Role", "Status", "Last Access", "Actions"].map((h) => (
                <th
                  key={h}
                  className="px-2 md:px-3 lg:px-6 py-2 md:py-2.5 lg:py-3 text-left text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="py-6 md:py-8 text-center text-gray-500 text-xs md:text-sm"
                >
                  No users found.
                </td>
              </tr>
            ) : (
              filtered.map((r, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-2 md:px-3 lg:px-6 py-2 md:py-2.5 font-medium text-gray-900 truncate max-w-[150px]">
                    {r.name}
                  </td>
                  <td className="px-2 md:px-3 lg:px-6 py-2 md:py-2.5 text-blue-600 truncate max-w-[200px]">
                    {r.email}
                  </td>
                  <td className="px-2 md:px-3 lg:px-6 py-2 md:py-2.5 text-gray-800 capitalize">
                    {r.role}
                  </td>
                  <td className="px-2 md:px-3 lg:px-6 py-2 md:py-2.5">
                    <span
                      className={`px-1.5 md:px-2.5 py-0.5 inline-flex justify-center items-center text-[10px] md:text-xs font-semibold rounded-full text-center truncate
      min-w-[120px] sm:min-w-[140px] md:min-w-[160px] lg:min-w-[180px]
      max-w-[180px]
      ${statusClass(r.status)}`}
                      title={r.status}
                    >
                      {r.status}
                    </span>
                  </td>

                  <td className="px-2 md:px-3 lg:px-6 py-2 md:py-2.5 text-gray-600 truncate max-w-[150px]">
                    {r.lastAccess}
                  </td>

                  {/* ✅ Conditional Buttons */}
                  <td className="px-2 md:px-3 lg:px-6 py-2 md:py-2.5">
                    <div className="flex justify-end gap-1 md:gap-2 flex-wrap">
                      {/* Activate / Deactivate */}
                      {r.status === "Activated" ? (
                        <button
                          onClick={() =>
                            setConfirmAction({
                              id: r.id,
                              type: "deactivate",
                              title: "Deactivate Account",
                              message: `Are you sure you want to deactivate ${r.name}? They will no longer have access.`,
                            })
                          }
                          className="inline-flex justify-center items-center gap-0.5 md:gap-1 px-2 md:px-2.5 py-1 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 text-[10px] md:text-xs text-center truncate
          min-w-[120px] sm:min-w-[140px] md:min-w-[160px] lg:min-w-[180px]
          max-w-[180px]"
                        >
                          <UserX className="h-3 w-3 md:h-4 md:w-4" />
                          <span className="hidden sm:inline">Deactivate</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => onAction?.(r.id, "activate")}
                          className="inline-flex justify-center items-center gap-0.5 md:gap-1 px-2 md:px-2.5 py-1 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 text-[10px] md:text-xs text-center truncate
          min-w-[120px] sm:min-w-[140px] md:min-w-[160px] lg:min-w-[180px]
          max-w-[180px]"
                        >
                          <UserCheck className="h-3 w-3 md:h-4 md:w-4" />
                          <span className="hidden sm:inline">Activate</span>
                        </button>
                      )}

                      {/* Delete — only for normal users */}
                      {r.role !== "admin" && (
                        <button
                          onClick={() =>
                            setConfirmAction({
                              id: r.id,
                              type: "delete",
                              title: "Delete User",
                              message: `Are you sure you want to permanently delete ${r.name}? This action cannot be undone.`,
                            })
                          }
                          className="inline-flex justify-center items-center gap-0.5 md:gap-1 px-2 md:px-2.5 py-1 border border-red-300 rounded-md text-red-600 hover:bg-red-50 text-[10px] md:text-xs text-center truncate
          min-w-[120px] sm:min-w-[140px] md:min-w-[160px] lg:min-w-[180px]
          max-w-[180px]"
                        >
                          <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={!!confirmAction}
        title={confirmAction?.title}
        message={confirmAction?.message}
        submitting={submitting}
        onCancel={() => setConfirmAction(null)}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
