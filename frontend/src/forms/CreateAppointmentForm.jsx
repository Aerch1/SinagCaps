// src/components/common/forms/CreateAppointmentForm.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, parse, isValid } from "date-fns";
import Dropdown from "../components/ui/Dropdown1"; // <-- update this path to your Dropdown file

/* constants (plain JS) */
const SERVICE_TYPES = ["Wedding", "Baptism", "Counseling", "Confirmation", "Funeral"];
const STATUS_OPTIONS = ["Pending", "In Process", "Confirmed", "Completed", "Cancelled"];

/* Zod schema */
const HHMM = /^\d{2}:\d{2}$/;
const YYYYMMDD = /^\d{4}-\d{2}-\d{2}$/;

const AppointmentSchema = z
  .object({
    clientName: z.string().min(1, "Client name is required").max(120),
    email: z.string().email("Enter a valid email").optional().or(z.literal("")),
    phone: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine(v => !v || /^[\d+\-\s()]{6,}$/.test(v), { message: "Enter a valid phone number" }),
    address: z.string().optional().or(z.literal("")),
    serviceType: z.enum(SERVICE_TYPES, { errorMap: () => ({ message: "Select a service type" }) }),
    status: z.enum(STATUS_OPTIONS).default("Pending"),
    date: z.string().regex(YYYYMMDD, "Pick a valid date"),
    allDay: z.boolean().default(false),
    time: z.string().optional(), // validated in superRefine
    purpose: z.string().optional().or(z.literal("")),
    notes: z.string().optional().or(z.literal("")),
  })
  .superRefine((val, ctx) => {
    if (!val.allDay) {
      if (!val.time || !val.time.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["time"], message: "Preferred time is required (or check All-day)" });
      } else if (!HHMM.test(val.time)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["time"], message: "Use format HH:MM" });
      }
    }
    if (val.date && YYYYMMDD.test(val.date)) {
      const d = new Date(val.date + "T00:00:00");
      if (isNaN(d.getTime())) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["date"], message: "Invalid date" });
      }
    }
  });

export default function CreateAppointmentForm({
  defaultDate = format(new Date(), "yyyy-MM-dd"),
  onSubmit,
  fetchAvailableTimes, // async (dateISO, serviceType) => Promise<string[]>
}) {
  const {
    register,
    control,
    handleSubmit,
    setValue,
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
      date: defaultDate, // yyyy-MM-dd
      allDay: false,
      time: "", // HH:mm
      purpose: "",
      notes: "",
    },
  });

  const allDay = useWatch({ control, name: "allDay" });
  const dateISO = useWatch({ control, name: "date" });
  const serviceType = useWatch({ control, name: "serviceType" });
  const timeHHmm = useWatch({ control, name: "time" });

  const [suggestions, setSuggestions] = useState([]);
  const [loadingTimes, setLoadingTimes] = useState(false);

  /* fetch smart suggestions */
  useEffect(() => {
    let active = true;
    (async () => {
      if (!dateISO || allDay) {
        setSuggestions([]);
        return;
      }
      setLoadingTimes(true);
      try {
        let times = [];
        if (typeof fetchAvailableTimes === "function") {
          times = await fetchAvailableTimes(dateISO, serviceType);
        } else {
          times = mockGenerateTimes("08:00", "17:30", 30);
        }
        if (active) setSuggestions(times);
      } catch {
        if (active) setSuggestions([]);
      } finally {
        if (active) setLoadingTimes(false);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateISO, serviceType, allDay]);

  const isActiveTime = useMemo(() => (t) => t === timeHHmm, [timeHHmm]);

  const onLocalSubmit = async (data) => {
    const { start, end } = buildStartEnd(data.date, data.time, data.allDay);
    await onSubmit({
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

  /* date/time adapters for react-datepicker */
  const dateToDateObj = (iso) => {
    if (!iso || !YYYYMMDD.test(iso)) return null;
    const d = parse(iso, "yyyy-MM-dd", new Date());
    return isValid(d) ? d : null;
  };
  const dateObjToISO = (d) => (d ? format(d, "yyyy-MM-dd") : "");

  const timeToDateObj = (hhmm) => {
    if (!hhmm || !HHMM.test(hhmm)) return null;
    const parsed = parse(hhmm, "HH:mm", new Date());
    return isValid(parsed) ? parsed : null;
  };
  const dateObjToHHmm = (d) => (d ? format(d, "HH:mm") : "");

  return (
    <form onSubmit={handleSubmit(onLocalSubmit)} className="space-y-8" aria-labelledby="create-appointment-title">
      {/* =================== Personal Info =================== */}
      <section>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Client Name */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Client Name</label>
            <input
              type="text"
              {...register("clientName")}
              placeholder="Enter full name"
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.clientName ? "border-red-500" : "border-gray-300 dark:border-slate-600"
                }`}
            />
            {errors.clientName && <p className="text-red-500 text-sm mt-1">{errors.clientName.message}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Email (for notifications)</label>
            <input
              type="email"
              {...register("email")}
              placeholder="client@example.com"
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.email ? "border-red-500" : "border-gray-300 dark:border-slate-600"
                }`}
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Contact Number</label>
            <input
              type="tel"
              {...register("phone")}
              placeholder="+63 9xx xxx xxxx"
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.phone ? "border-red-500" : "border-gray-300 dark:border-slate-600"
                }`}
            />
            {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
          </div>

          {/* Address (full) */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Address</label>
            <input
              type="text"
              {...register("address")}
              placeholder="Street / Barangay / City / Province"
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent border-gray-300 dark:border-slate-600"
            />
          </div>
        </div>
      </section>

      {/* =================== Appointment Details =================== */}
      <section>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Appointment Details</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Service Type (Dropdown) */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Service Type</label>
            <Controller
              control={control}
              name="serviceType"
              render={({ field }) => (
                <Dropdown
                  value={field.value}
                  onChange={(v) => field.onChange(v)}
                  options={SERVICE_TYPES}
                  placeholder="Select service type..."
                  className="w-full"
                />
              )}
            />
            {errors.serviceType && <p className="text-red-500 text-sm mt-1">{errors.serviceType.message}</p>}
          </div>

          {/* Status (Dropdown) — single place only */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Status</label>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Dropdown
                  value={field.value}
                  onChange={(v) => field.onChange(v)}
                  options={STATUS_OPTIONS}
                  placeholder="Select status..."
                  className="w-full"
                />
              )}
            />
          </div>
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-4">
          {/* Appointment Date */}
          <div className="md:col-span-6">
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Appointment Date</label>
            <Controller
              control={control}
              name="date"
              render={({ field }) => (
                <DatePicker
                  selected={dateToDateObj(field.value)}
                  onChange={(d) => field.onChange(dateObjToISO(d))}
                  dateFormat="yyyy-MM-dd"
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.date ? "border-red-500" : "border-gray-300 dark:border-slate-600"
                    }`}
                  placeholderText="YYYY-MM-DD"
                  todayButton="Today"
                  isClearable={false}
                />
              )}
            />
            {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>}
          </div>

          {/* Preferred Time (time-only) */}
          {/* Preferred Time (free input) */}
          <div className="md:col-span-6">
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Preferred Time</label>
            <input
              type="time"
              step="60"              // 1-minute granularity; change to 300 for 5-min steps
              disabled={allDay}
              {...register("time")}
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors?.time ? "border-red-500" : "border-gray-300 dark:border-slate-600"
                } ${allDay ? "opacity-60 cursor-not-allowed" : ""}`}
              placeholder="HH:MM"
            />
            {!allDay && errors?.time && <p className="text-red-500 text-sm mt-1">{errors.time.message}</p>}
          </div>

        </div>

        {/* All-day BELOW date/time */}
        <div className="mt-3">
          <label className="inline-flex items-center gap-2 text-sm text-gray-900 dark:text-gray-100">
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

        {/* Smart time suggestions */}
        {!allDay && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Suggested times</span>
              {loadingTimes && <span className="text-xs text-gray-500 dark:text-slate-400">Loading…</span>}
            </div>
            {suggestions.length ? (
              <div className="flex flex-wrap gap-2">
                {suggestions.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setValue("time", t, { shouldValidate: true })}
                    className={`px-3 py-1.5 rounded-full border text-sm transition ${isActiveTime(t)
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600"
                      }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-slate-400">No suggestions for the selected date.</p>
            )}
          </div>
        )}
      </section>

      {/* =================== Purpose =================== */}
      <section>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Purpose</h3>
        <input
          type="text"
          {...register("purpose")}
          placeholder="Short purpose of appointment"
          className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent border-gray-300 dark:border-slate-600"
        />
      </section>

      {/* =================== Additional Notes (full width) =================== */}
      <section>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Additional Notes</h3>
        <textarea
          rows={4}
          {...register("notes")}
          placeholder="Any extra details for the staff…"
          className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none border-gray-300 dark:border-slate-600"
        />
      </section>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => document.getElementById("create-appointment-close")?.click()}
          className="px-4 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-black/90 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white transition"
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

function buildStartEnd(dateISO, hhmm, allDay) {
  if (allDay) return { start: `${dateISO}T00:00:00`, end: `${dateISO}T23:59:59` };
  const end = addMinutes(hhmm, 60);
  return { start: `${dateISO}T${hhmm}:00`, end: `${dateISO}T${end}:00` };
}

function addMinutes(hhmm, add) {
  const [h, m] = hhmm.split(":").map(Number);
  const total = h * 60 + m + add;
  const nh = Math.floor(((total % 1440) + 1440) % 1440 / 60);
  const nm = ((total % 60) + 60) % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
}

/* date adapters */
function dateToDateObj(iso) {
  if (!iso || !YYYYMMDD.test(iso)) return null;
  const d = parse(iso, "yyyy-MM-dd", new Date());
  return isValid(d) ? d : null;
}
function dateObjToISO(d) { return d ? format(d, "yyyy-MM-dd") : ""; }
function timeToDateObj(hhmm) {
  if (!hhmm || !HHMM.test(hhmm)) return null;
  const parsed = parse(hhmm, "HH:mm", new Date());
  return isValid(parsed) ? parsed : null;
}
function dateObjToHHmm(d) { return d ? format(d, "HH:mm") : ""; }
