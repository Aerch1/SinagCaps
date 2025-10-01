"use client";
import { useEffect, useState } from "react";
import api from "@/api/api";
import Dropdown from "../components/ui/Dropdown1.jsx";
import DatePopover from "../components/ui/DatePopover.jsx";
import SlotSelector from "../components/ui/SlotSelector.jsx";
import { formatStatusLabel } from "../lib/utils.js";

/* ---------------- Status Options ---------------- */
const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function CreateAppointmentForm({
  defaultDate = "",
  onSubmit,
  onCancel,
  serverErrors = {},
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    contactNumber: "",
    service_id: "",
    status: "pending",
    date: defaultDate,
    time: "",
    notes: "",
  });

  const [services, setServices] = useState([]);

  /* -------- Fetch services -------- */
  useEffect(() => {
    let active = true;
    api
      .get("/admin/services")
      .then((res) => {
        if (active && res.data.success) {
          setServices(res.data.services || []);
        }
      })
      .catch((err) => console.error("❌ fetch services failed:", err));
    return () => {
      active = false;
    };
  }, []);

  /* -------- Sync backend validation errors -------- */
  useEffect(() => {
    if (serverErrors && Object.keys(serverErrors).length > 0) {
      // Already mapped in CreateAppointmentModal
      // No need to do anything special, just re-render
    }
  }, [serverErrors]);

  /* -------- Handle change -------- */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleServiceChange = (val) => {
    setForm((prev) => ({ ...prev, service_id: val }));
  };

  const handleStatusChange = (val) => {
    setForm((prev) => ({ ...prev, status: val }));
  };

  const handleDateChange = (val) => {
    setForm((prev) => ({ ...prev, date: val, time: "" }));
  };

  const handleTimeChange = (val) => {
    setForm((prev) => ({ ...prev, time: val }));
  };

  /* -------- Submit -------- */
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Personal Information */}
      <section>
        <h3 className="mb-4 text-sm font-semibold text-slate-900">
          Personal Information
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium">Client Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter full name"
              className={`w-full rounded-lg border px-3 py-2 ${serverErrors.name ? "border-red-500" : "border-gray-200"
                }`}
            />
            {serverErrors.name && (
              <p className="mt-1 text-sm text-red-500">{serverErrors.name}</p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="client@example.com"
              className={`w-full rounded-lg border px-3 py-2 ${serverErrors.email ? "border-red-500" : "border-gray-300"
                }`}
            />
            {serverErrors.email && (
              <p className="mt-1 text-sm text-red-500">{serverErrors.email}</p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Contact Number
            </label>
            <input
              type="tel"
              name="contactNumber"
              value={form.contactNumber}
              onChange={handleChange}
              placeholder="+63 9xx xxx xxxx"
              className={`w-full rounded-lg border px-3 py-2 ${serverErrors.contactNumber
                ? "border-red-500"
                : "border-gray-300"
                }`}
            />
            {serverErrors.contactNumber && (
              <p className="mt-1 text-sm text-red-500">
                {serverErrors.contactNumber}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Appointment Details */}
      <section>
        <h3 className="mb-4 text-sm font-semibold text-slate-900">
          Appointment Details
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium">Service</label>
            <Dropdown
              value={form.service_id}
              onChange={handleServiceChange}
              options={services.map((s) => ({
                value: String(s.id),
                label: s.name,
              }))}
              className="w-full"
            />
            {serverErrors.service_id && (
              <p className="mt-1 text-sm text-red-500">
                {serverErrors.service_id}
              </p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Status</label>
            <Dropdown
              value={form.status}
              onChange={handleStatusChange}
              options={STATUS_OPTIONS}
              formatter={formatStatusLabel}
              className="w-full"
            />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-12">
          <div className="md:col-span-6">
            <DatePopover
              serviceId={form.service_id}
              value={form.date}
              onChange={handleDateChange}
              error={serverErrors.date}
            />
          </div>
          <div className="md:col-span-6">
            <SlotSelector
              value={form.time}
              onChange={handleTimeChange}
              serviceId={form.service_id}
              date={form.date}
              error={serverErrors.time}
            />
          </div>
        </div>
      </section>

      {/* Notes */}
      <section>
        <h3 className="mb-4 text-sm font-semibold text-slate-900">
          Additional Notes
        </h3>
        <textarea
          rows={4}
          name="notes"
          value={form.notes}
          onChange={handleChange}
          placeholder="Internal notes (optional)…"
          className={`w-full resize-none rounded-lg border px-3 py-2 ${serverErrors.notes ? "border-red-500" : "border-gray-300"
            }`}
        />
        {serverErrors.notes && (
          <p className="mt-1 text-sm text-red-500">{serverErrors.notes}</p>
        )}
      </section>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-4 py-2 text-slate-700 transition hover:bg-gray-100"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-lg bg-secondary px-4 py-2 text-white transition hover:bg-secondary/80"
        >
          Save Appointment
        </button>
      </div>
    </form>
  );
}
