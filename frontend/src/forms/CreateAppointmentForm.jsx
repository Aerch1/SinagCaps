"use client";
import { useEffect, useState } from "react";
import api from "@/api/api";
import Dropdown from "../components/ui/Dropdown1.jsx";
import DatePopover from "../components/ui/DatePopover.jsx";
import SlotSelector from "../components/ui/SlotSelector.jsx";
import { formatStatusLabel } from "../lib/utils.js";

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
  submitting = false,  // ✅ new

}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    contactNumber: "",
    address: "",
    service_id: "",
    status: "pending",
    date: defaultDate,
    time: "",
    notes: "",
  });

  const [services, setServices] = useState([]);
  const [localErrors, setLocalErrors] = useState({});

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

  /* -------- Frontend Validation -------- */
  const validateForm = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = "Name is required.";

    // Email validation
    if (!form.email.trim()) {
      errors.email = "Email is required.";
    } else {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(form.email)) {
        errors.email = "Invalid email format (example@domain.com).";
      }
    }

    // Contact number validation
    if (!form.contactNumber.trim()) {
      errors.contactNumber = "Contact number is required.";
    } else if (!/^\d+$/.test(form.contactNumber)) {
      errors.contactNumber = "Contact number must contain digits only.";
    } else if (form.contactNumber.length !== 11) {
      errors.contactNumber = "Contact number must be exactly 11 digits.";
    }

    // Address required
    if (!form.address.trim()) errors.address = "Address is required.";

    // Service validation
    if (!form.service_id) {
      errors.service_id = "Service is required.";
    } else if (isNaN(Number(form.service_id))) {
      errors.service_id = "Service ID must be a number.";
    }

    // Date/time required
    if (!form.date) errors.date = "Date is required.";
    if (!form.time) errors.time = "Time is required.";

    return errors;
  };

  /* -------- Submit -------- */
  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setLocalErrors(errors);
      return;
    }
    setLocalErrors({});
    onSubmit?.(form);
  };

  // Merge server and local errors
  const mergedErrors = { ...serverErrors, ...localErrors };

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
              className={`w-full rounded-lg border px-3 py-2 ${mergedErrors.name ? "border-red-500" : "border-gray-200"
                }`}
            />
            {mergedErrors.name && (
              <p className="mt-1 text-sm text-red-500">{mergedErrors.name}</p>
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
              className={`w-full rounded-lg border px-3 py-2 ${mergedErrors.email ? "border-red-500" : "border-gray-300"
                }`}
            />
            {mergedErrors.email && (
              <p className="mt-1 text-sm text-red-500">{mergedErrors.email}</p>
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
              placeholder="09xxxxxxxxx"
              className={`w-full rounded-lg border px-3 py-2 ${mergedErrors.contactNumber
                ? "border-red-500"
                : "border-gray-300"
                }`}
            />
            {mergedErrors.contactNumber && (
              <p className="mt-1 text-sm text-red-500">
                {mergedErrors.contactNumber}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium">Address</label>
            <input
              type="text"
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Enter client address"
              className={`w-full rounded-lg border px-3 py-2 ${mergedErrors.address ? "border-red-500" : "border-gray-300"
                }`}
            />
            {mergedErrors.address && (
              <p className="mt-1 text-sm text-red-500">{mergedErrors.address}</p>
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
            {mergedErrors.service_id && (
              <p className="mt-1 text-sm text-red-500">
                {mergedErrors.service_id}
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
              error={mergedErrors.date}
            />
            {mergedErrors.date && (
              <p className="mt-1 text-sm text-red-500">{mergedErrors.date}</p>
            )}
          </div>
          <div className="md:col-span-6">
            <SlotSelector
              value={form.time}
              onChange={handleTimeChange}
              serviceId={form.service_id}
              date={form.date}
              error={mergedErrors.time}
            />
            {mergedErrors.time && (
              <p className="mt-1 text-sm text-red-500">{mergedErrors.time}</p>
            )}
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
          className={`w-full resize-none rounded-lg border px-3 py-2 ${mergedErrors.notes ? "border-red-500" : "border-gray-300"
            }`}
        />
        {mergedErrors.notes && (
          <p className="mt-1 text-sm text-red-500">{mergedErrors.notes}</p>
        )}
      </section>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-white transition 
    ${submitting ? "bg-gray-400 cursor-not-allowed" : "bg-secondary hover:bg-secondary/80"}`}
        >
          {submitting && (
            <svg
              className="h-4 w-4 animate-spin text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
          )}
          {submitting ? "Saving..." : "Save Appointment"}
        </button>

      </div>
    </form>
  );
}
