"use client";

import { useEffect, useState } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Dropdown from "../components/ui/Dropdown1";
import DatePopover from "../components/ui/DatePopover";
import TimePopover from "../components/ui/TimePopover";

/* constants */
const SERVICE_TYPES = ["Wedding", "Baptism", "Counseling", "Confirmation", "Funeral"];
const STATUS_OPTIONS = ["Pending", "In Process", "Confirmed", "Completed", "Cancelled"];

/* Zod schema (24h time) */
const YYYYMMDD = /^\d{4}-\d{2}-\d{2}$/;
const TIME_24H = /^([01]\d|2[0-3]):([0-5]\d)$/;

const AppointmentSchema = z
  .object({
    clientName: z.string().min(1, "Client name is required").max(120),
    email: z.string().email("Enter a valid email").optional().or(z.literal("")),
    phone: z.string().optional().or(z.literal(""))
      .refine(v => !v || /^[\d+\-\s()]{6,}$/.test(v), { message: "Enter a valid phone number" }),
    address: z.string().optional().or(z.literal("")),
    serviceType: z.enum(SERVICE_TYPES, { errorMap: () => ({ message: "Select a service type" }) }),
    status: z.enum(STATUS_OPTIONS).default("Pending"),
    date: z.string().regex(YYYYMMDD, "Pick a valid date").optional().or(z.literal("")),
    allDay: z.boolean().default(false),
    time: z.string().optional().or(z.literal("")),
    purpose: z.string().optional().or(z.literal("")),
    notes: z.string().optional().or(z.literal("")),
  })
  .superRefine((val, ctx) => {
    if (!val.date || !YYYYMMDD.test(val.date)) {
      ctx.addIssue({ path: ["date"], code: z.ZodIssueCode.custom, message: "Appointment date is required" });
    }
    if (!val.allDay) {
      if (!val.time || !val.time.trim()) {
        ctx.addIssue({ path: ["time"], code: z.ZodIssueCode.custom, message: "Preferred time is required" });
      } else if (!TIME_24H.test(val.time)) {
        ctx.addIssue({ path: ["time"], code: z.ZodIssueCode.custom, message: "Use format HH:mm (24-hour)" });
      }
    }
  });

/**
 * Props:
 *  - defaultDate?: "yyyy-MM-dd"
 *  - onSubmit: (payload) => void/Promise
 *  - onCancel?: () => void
 *  - fetchAvailableTimes?: (dateISO, serviceType) => Promise<string[]> // "HH:mm"
 */
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
      serviceType: SERVICE_TYPES[0],
      status: "Pending",
      date: defaultDate,
      allDay: false,
      time: "",
      purpose: "",
      notes: "",
    },
  });

  const allDay = useWatch({ control, name: "allDay" });
  const dateISO = useWatch({ control, name: "date" });
  const serviceType = useWatch({ control, name: "serviceType" });

  const [suggestions, setSuggestions] = useState([]);
  const [loadingTimes, setLoadingTimes] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!dateISO || allDay) {
        setSuggestions([]);
        return;
      }
      setLoadingTimes(true);
      try {
        const times = typeof fetchAvailableTimes === "function"
          ? await fetchAvailableTimes(dateISO, serviceType)
          : mockGenerateTimes("08:00", "17:30", 30);
        if (active) setSuggestions(Array.isArray(times) ? times : []);
      } catch {
        if (active) setSuggestions([]);
      } finally {
        if (active) setLoadingTimes(false);
      }
    })();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateISO, serviceType, allDay]);

  const onLocalSubmit = async (data) => {
    const { start, end } = buildStartEnd(data.date, data.allDay ? null : data.time, data.allDay);
    await onSubmit?.({
      clientName: data.clientName.trim(),
      email: (data.email || "").trim(),
      phone: (data.phone || "").trim(),
      address: (data.address || "").trim(),
      serviceType: data.serviceType,
      status: data.status,
      date: data.date,
      time: data.allDay ? null : data.time,
      allDay: !!data.allDay,
      purpose: (data.purpose || "").trim(),
      notes: (data.notes || "").trim(),
      start,
      end,
    });
  };

  return (
    <form onSubmit={handleSubmit(onLocalSubmit)} className="space-y-8 " aria-labelledby="create-appointment-title">
      {/* Personal Information */}
      <section >
        <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-slate-100">Personal Information</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium">Client Name</label>
            <input
              type="text"
              {...register("clientName")}
              placeholder="Enter full name"
              className={`w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 ${errors.clientName ? "border-red-500" : "border-gray-300"
                }`}
            />
            {errors.clientName && <p className="mt-1 text-sm text-red-500">{errors.clientName.message}</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Email (for notifications)</label>
            <input
              type="email"
              {...register("email")}
              placeholder="client@example.com"
              className={`w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 ${errors.email ? "border-red-500" : "border-gray-300"
                }`}
            />
            {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Contact Number</label>
            <input
              type="tel"
              {...register("phone")}
              placeholder="+63 9xx xxx xxxx"
              className={`w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 ${errors.phone ? "border-red-500" : "border-gray-300"
                }`}
            />
            {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone.message}</p>}
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium">Address</label>
            <input
              type="text"
              {...register("address")}
              placeholder="Street / Barangay / City / Province"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100"
            />
          </div>
        </div>
      </section>

      {/* Appointment Details */}
      <section>
        <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-slate-100">Appointment Details</h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium">Service Type</label>
            <Controller
              control={control}
              name="serviceType"
              render={({ field }) => (
                <Dropdown
                  value={field.value}
                  onChange={field.onChange}
                  options={SERVICE_TYPES}
                  placeholder="Select service type..."
                  className="w-full"
                />
              )}
            />
            {errors.serviceType && <p className="mt-1 text-sm text-red-500">{errors.serviceType.message}</p>}
          </div>

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
                  placeholder="Select status..."
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
                <DatePopover value={field.value} onChange={field.onChange} error={errors.date?.message} />
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
                <input type="checkbox" {...field} className="h-4 w-4 rounded border-gray-300 dark:border-slate-600" />
              )}
            />
            All-day
          </label>
        </div>
      </section>

      {/* Purpose */}
      <section>
        <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-slate-100">Purpose</h3>
        <input
          type="text"
          {...register("purpose")}
          placeholder="Short purpose of appointment"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100"
        />
      </section>

      {/* Additional Notes */}
      <section>
        <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-slate-100">Additional Notes</h3>
        <textarea
          rows={4}
          {...register("notes")}
          placeholder="Any extra details for the staff…"
          className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100"
        />
      </section>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-4 py-2 text-slate-700 transition hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-lg bg-secondary px-4 py-2 text-white transition hover:bg-secondary/90 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving…" : "Save Appointment"}
        </button>
      </div>

    </form>
  );
}

/* helpers */
function mockGenerateTimes(startHHmm = "08:00", endHHmm = "17:30", everyMin = 30) {
  const [sh, sm] = startHHmm.split(":").map(Number);
  const [eh, em] = endHHmm.split(":").map(Number);
  const out = [];
  let h = sh, m = sm;
  while (h < eh || (h === eh && m <= em)) {
    out.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    m += everyMin;
    while (m >= 60) { m -= 60; h += 1; }
  }
  return out;
}
function buildStartEnd(dateISO, hhmmOrNull, allDay) {
  const [y, m, d] = dateISO.split("-").map(Number);

  if (allDay || !hhmmOrNull) {
    // All-day events should use date-only and an exclusive end (next day)
    const start = new Date(y, m - 1, d, 0, 0, 0, 0);        // local midnight
    const end = new Date(y, m - 1, d + 1, 0, 0, 0, 0);    // next day (exclusive)
    return { start, end };
  }

  const [hh, mm] = hhmmOrNull.split(":").map(Number);
  const start = new Date(y, m - 1, d, hh, mm, 0, 0);        // local time
  const end = new Date(y, m - 1, d, hh + 1, mm, 0, 0);    // +60 minutes
  return { start, end };
}

function addMinutes(hhmm, add) {
  const [h, m] = hhmm.split(":").map(Number);
  const total = h * 60 + m + add;
  const nh = Math.floor((((total % 1440) + 1440) % 1440) / 60);
  const nm = ((total % 60) + 60) % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
}
