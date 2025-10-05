"use client";

import React, { useMemo, useState } from "react";
import { CalendarDays, Clock, Edit2, Trash2, X, Plus } from "lucide-react";
import { formatDate, to12h } from "@/utils/availabilityUtils";

/* ---------- Status Badge ---------- */
const StatusChip = ({ status }) => {
  const color =
    status === "Active"
      ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
      : "bg-slate-50 text-slate-600 ring-1 ring-slate-500/20";
  return (
    <span
      className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold ${color}`}
    >
      {status}
    </span>
  );
};

/* ---------- Card Component ---------- */
function EventCard({ item, onEdit, onDelete, onPreview }) {
  const optimizedImg = item.image_url?.includes("/upload/")
    ? item.image_url.replace("/upload/", "/upload/f_auto,q_auto,w_800/")
    : item.image_url;

  return (
    <div
      onClick={() => onPreview(item)}
      className="flex flex-col h-full cursor-pointer rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-lg hover:border-slate-300 transition-all duration-300 group overflow-hidden"
    >
      {/* Image */}
      {optimizedImg ? (
        <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50">
          <img
            src={optimizedImg}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      ) : (
        <div className="h-2" />
      )}

      {/* Content */}
      <div className="flex flex-col justify-between flex-1 p-6">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-semibold text-slate-900 leading-tight line-clamp-2 flex-1 group-hover:text-slate-700 transition-colors">
              {item.title}
            </h3>
            <StatusChip status={item.status} />
          </div>

          {item.description && (
            <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
              {item.description}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-slate-400" />
              <span className="font-medium">{formatDate(item.date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-400" />
              <span className="font-medium">{to12h(item.time)}</span>
            </div>
          </div>

          {item.created_at && (
            <p className="text-xs text-slate-400">
              Created: {formatDate(item.created_at)}
            </p>
          )}

          <div
            className="flex items-center gap-3 pt-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => onEdit?.(item)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <Edit2 className="h-3.5 w-3.5" />
              <span>Edit</span>
            </button>
            <button
              onClick={() => onDelete?.(item)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Preview Modal ---------- */
function EventPreviewModal({ item, onClose }) {
  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-[99] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 text-slate-400 hover:text-slate-700 bg-white rounded-full shadow-md hover:shadow-lg transition-all"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="max-h-[90vh] overflow-y-auto">
          {item.image_url && (
            <div className="relative h-80 w-full bg-slate-100 flex items-center justify-center">
              <img
                src={item.image_url}
                alt={item.title}
                className="max-h-full w-auto object-contain"
              />
            </div>
          )}

          <div className="p-8 space-y-6">
            <div className="flex justify-between items-start gap-4">
              <h2 className="text-3xl font-bold text-slate-900 leading-tight">
                {item.title}
              </h2>
              <StatusChip status={item.status} />
            </div>

            <div className="flex items-center gap-6 pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2.5 text-slate-700">
                <CalendarDays className="h-4 w-4 text-slate-500" />
                <span className="font-medium">{formatDate(item.date)}</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-700">
                <Clock className="h-4 w-4 text-slate-500" />
                <span className="font-medium">{to12h(item.time)}</span>
              </div>
            </div>

            {item.created_at && (
              <p className="text-xs text-slate-500">
                Created on {formatDate(item.created_at)}
              </p>
            )}

            {item.description && (
              <p className="text-slate-700 leading-relaxed whitespace-pre-line text-base">
                {item.description}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Main Grid ---------- */
export default function EventsGrid({ events = [], onEdit, onDelete, onCreate }) {
  const [previewItem, setPreviewItem] = useState(null);

  return (
    <div className="p-6 space-y-8">
      {/* ✅ Header and Button same line */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Event & News Management</h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage church events and news displayed on the public homepage.
          </p>
        </div>

        <button
          onClick={() => onCreate?.()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-slate-800 transition-all w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          New Event / News
        </button>
      </div>

      {/* Grid */}
      {events.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {events.map((item) => (
            <EventCard
              key={item.id}
              item={item}
              onEdit={onEdit}
              onDelete={onDelete}
              onPreview={(i) => setPreviewItem(i)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-16 text-center">
          <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
            <Plus className="h-7 w-7 text-slate-400" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 mb-1">
            No events found
          </h3>
          <p className="text-sm text-slate-600">
            You can add a new event or news item above.
          </p>
        </div>
      )}

      {/* Preview Modal */}
      <EventPreviewModal item={previewItem} onClose={() => setPreviewItem(null)} />
    </div>
  );
}
