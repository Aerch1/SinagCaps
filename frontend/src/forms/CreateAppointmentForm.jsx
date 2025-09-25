"use client";

import { useEffect, useState } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import Dropdown from "../components/ui/Dropdown1";
import DatePopover from "../components/ui/DatePopover";
import TimePopover from "../components/ui/TimePopover";
import { formatStatusLabel } from "../lib/utils.js";

/* ---------------- Status Options ---------------- */
const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

/* ---------------- Regex ---------------- */
const YYYYMMDD = /^\d{4}-\d{2}-\d{2}$/;
const TIME_24H = /^([01]\d|2[0-3]):([0-5]\d)$/;

/* ---------------- Zod Schema ---------------- */
const AppointmentSchema = z
  .object({
    clientName: z.string().min(1, "Client name is required").max(120),
    email: z.string().email("Enter a valid email").optional().or(z.literal("")),
    phone: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine((v) => !v || /^[\d+\-\s()]{6,}$/.test(v), {
        message: "Enter a valid phone number",
      }),
    address: z.string().optional().or(z.literal("")),
    service_id: z.string().min(1, "Select a service"),
    status: z.enum(STATUS_OPTIONS.map((o) => o.value)).default("pending"),
    date: z.string().regex(YYYYMMDD, "Pick a valid date"),
    allDay: z.boolean().default(false),
    time: z.string().optional().or(z.literal("")),
    notes: z.string().optional().or(z.literal("")),
  })
  .superRefine((val, ctx) => {
    if (!val.date || !YYYYMMDD.test(val.date)) {
      ctx.addIssue({
        path: ["date"],
        code: z.ZodIssueCode.custom,
        message: "Appointment date is required",
      });
    }
    if (!val.allDay) {
      if (!val.time || !val.time.trim()) {
        ctx.addIssue({
          path: ["time"],
          code: z.ZodIssueCode.custom,
          message: "Preferred time is required",
        });
      } else if (!TIME_24H.test(val.time)) {
        ctx.addIssue({
          path: ["time"],
          code: z.ZodIssueCode.custom,
          message: "Use format HH:mm (24-hour)",
        });
      }
    }
  });

/* ---------------- Component ---------------- */
export default function CreateAppointmentForm({
  defaultDate = "",
  onSubmit,
  onCancel,
  fetchAvailableTimes,
}) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(AppointmentSchema),
    mode: "onTouched",
    defaultValues: {
      clientName: "",
      email: "",
      phone: "",
      address: "",
      service_id: "",
      status: "pending",
      date: defaultDate,
      allDay: false,
      time: "",
      notes: "",
    },
  });

  const allDay = useWatch({ control, name: "allDay" });
  const dateISO = useWatch({ control, name: "date" });
  const service_id = useWatch({ control, name: "service_id" });

  const [services, setServices] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingTimes, setLoadingTimes] = useState(false);

  /* Fetch services for dropdown */
  useEffect(() => {
    axios
      .get("/api/admin/services")
      .then((res) => {
        if (res.data.success) {
          setServices(res.data.services || []);
        }
      })
      .catch((err) => console.error("❌ fetch services failed:", err));
  }, []);

  /* Fetch available times */
  useEffect(() => {
    let active = true;
    (async () => {
      if (!dateISO || allDay) {
        setSuggestions([]);
        return;
      }
      setLoadingTimes(true);
      try {
        const times =
          typeof fetchAvailableTimes === "function"
            ? await fetchAvailableTimes(dateISO, service_id)
            : mockGenerateTimes("08:00", "17:30", 30);
        if (active) setSuggestions(Array.isArray(times) ? times : []);
      } catch {
        if (active) setSuggestions([]);
      } finally {
        if (active) setLoadingTimes(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [dateISO, service_id, allDay, fetchAvailableTimes]);

  /* Pass validated form data up */
  const handleFormSubmit = (data) => {
    onSubmit?.({
      name: data.clientName.trim(),
      email: data.email.trim(),
      contactNumber: data.phone.trim(),
      address: data.address.trim(),
      service_id: Number(data.service_id),
      status: data.status,
      date: data.date,
      time: data.allDay ? null : data.time,
      allDay: !!data.allDay,
      notes: data.notes.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
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
              {...register("clientName")}
              placeholder="Enter full name"
              className={`w-full rounded-lg border px-3 py-2 ${errors.clientName ? "border-red-500" : "border-gray-300"
                }`}
            />
            {errors.clientName && (
              <p className="mt-1 text-sm text-red-500">
                {errors.clientName.message}
              </p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Email</label>
            <input
              type="email"
              {...register("email")}
              placeholder="client@example.com"
              className={`w-full rounded-lg border px-3 py-2 ${errors.email ? "border-red-500" : "border-gray-300"
                }`}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Contact Number</label>
            <input
              type="tel"
              {...register("phone")}
              placeholder="+63 9xx xxx xxxx"
              className={`w-full rounded-lg border px-3 py-2 ${errors.phone ? "border-red-500" : "border-gray-300"
                }`}
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium">Address</label>
            <input
              type="text"
              {...register("address")}
              placeholder="Street / Barangay / City / Province"
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
        </div>
      </section>

      {/* Appointment Details */}
      <section>
        <h3 className="mb-4 text-sm font-semibold text-slate-900">
          Appointment Details
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Service */}
          <div>
            <label className="mb-2 block text-sm font-medium">Service</label>
            <Controller
              control={control}
              name="service_id"
              render={({ field }) => (
                <Dropdown
                  value={field.value}
                  onChange={field.onChange}
                  options={services.map((s) => ({
                    value: String(s.id),
                    label: s.name,
                  }))}
                  className="w-full"
                />
              )}
            />
            {errors.service_id && (
              <p className="mt-1 text-sm text-red-500">
                {errors.service_id.message}
              </p>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="mb-2 block text-sm font-medium">Status</label>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Dropdown
                  value={field.value}
                  onChange={field.onChange}
                  options={STATUS_OPTIONS}
                  formatter={formatStatusLabel}
                  className="w-full"
                />
              )}
            />
          </div>
        </div>

        {/* Date & Time */}
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-12">
          <div className="md:col-span-6">
            <Controller
              control={control}
              name="date"
              render={({ field }) => (
                <DatePopover
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.date?.message}
                />
              )}
            />
          </div>
          <div className="md:col-span-6">
            <Controller
              control={control}
              name="time"
              render={({ field }) => (
                <TimePopover
                  value={field.value}
                  onChange={field.onChange}
                  suggestions={allDay ? [] : suggestions}
                  loading={loadingTimes}
                  disabled={allDay}
                  error={!allDay ? errors.time?.message : undefined}
                  minuteStep={5}
                />
              )}
            />
          </div>
        </div>

        <div className="mt-3">
          <label className="inline-flex items-center gap-2 text-sm">
            <Controller
              control={control}
              name="allDay"
              render={({ field }) => (
                <input
                  type="checkbox"
                  {...field}
                  className="h-4 w-4 rounded border-gray-300"
                />
              )}
            />
            All-day
          </label>
        </div>
      </section>

      {/* Notes */}
      <section>
        <h3 className="mb-4 text-sm font-semibold text-slate-900">
          Additional Notes
        </h3>
        <textarea
          rows={4}
          {...register("notes")}
          placeholder="Internal notes (optional)…"
          className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2"
        />
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
          className="rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving…" : "Save Appointment"}
        </button>
      </div>
    </form>
  );
}

/* Helpers */
function mockGenerateTimes(startHHmm = "08:00", endHHmm = "17:30", everyMin = 30) {
  const [sh, sm] = startHHmm.split(":").map(Number);
  const [eh, em] = endHHmm.split(":").map(Number);
  const out = [];
  let h = sh,
    m = sm;
  while (h < eh || (h === eh && m <= em)) {
    out.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    m += everyMin;
    while (m >= 60) {
      m -= 60;
      h += 1;
    }
  }
  return out;
}
