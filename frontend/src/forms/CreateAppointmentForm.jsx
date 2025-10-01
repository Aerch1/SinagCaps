
import { useEffect, useState } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import api from "@/api/api";                // ✅ use centralized axios instance
import Dropdown from "../components/ui/Dropdown1.jsx";
import DatePopover from "../components/ui/DatePopover.jsx";
import SlotSelector from "../components/ui/SlotSelector.jsx";
import { formatStatusLabel } from "../lib/utils.js";
import useChurchHours from "../hooks/useChurchHours.js";

/* ---------------- Status Options ---------------- */
const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

/* ---------------- Light Zod Schema ---------------- */
const AppointmentSchema = z.object({
  clientName: z.string().min(1, "Client name is required"),
  service_id: z.string().min(1, "Select a service"),
  date: z.string().min(1, "Date is required"),
  time: z.string().optional(),
  status: z.enum(STATUS_OPTIONS.map((o) => o.value)).default("pending"),
  email: z.string().optional(),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

export default function CreateAppointmentForm({
  defaultDate = "",
  onSubmit,
  onCancel,
  serverErrors = {},
}) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    setValue,
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
  const serviceId = useWatch({ control, name: "service_id" });

  const [services, setServices] = useState([]);
  const { churchHours } = useChurchHours();

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

  /* -------- Apply backend errors into form -------- */
  useEffect(() => {
    if (serverErrors && Object.keys(serverErrors).length > 0) {
      Object.entries(serverErrors).forEach(([field, message]) => {
        setError(field, { type: "server", message });
      });
    }
  }, [serverErrors, setError]);

  /* -------- Reset time when date/allDay changes -------- */
  useEffect(() => {
    if (dateISO) setValue("time", "");
  }, [dateISO, setValue]);

  useEffect(() => {
    if (allDay) setValue("time", "");
  }, [allDay, setValue]);

  /* -------- Map data for backend -------- */
  const handleFormSubmit = (data) => {
    onSubmit?.({
      name: data.clientName.trim(),
      email: data.email?.trim() || null,
      contactNumber: data.phone?.trim() || null,
      address: data.address?.trim() || null,
      service_id: Number(data.service_id),
      status: data.status,
      date: data.date,
      time: data.allDay ? null : data.time,
      allDay: !!data.allDay,
      notes: data.notes?.trim() || null,
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
              className={`w-full rounded-lg border focus:ring-2 focus:ring-blue-500 px-3 py-2 ${errors.clientName ? "border-red-500" : "border-gray-200"
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
              className={`w-full rounded-lg border focus:ring-2 focus:ring-blue-500 px-3 py-2 ${errors.email ? "border-red-500" : "border-gray-300"
                }`}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Contact Number</label>
            <input
              type="tel"
              {...register("phone")}
              placeholder="+63 9xx xxx xxxx"
              className={`w-full rounded-lg border focus:ring-2 focus:ring-blue-500 px-3 py-2 ${errors.phone ? "border-red-500" : "border-gray-300"
                }`}
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-500">{errors.phone.message}</p>
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

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-12">
          <div className="md:col-span-6">
            <Controller
              control={control}
              name="date"
              render={({ field }) => (
                <DatePopover
                  serviceId={serviceId}
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
                <SlotSelector
                  value={field.value}
                  onChange={field.onChange}
                  serviceId={serviceId}
                  date={dateISO}
                  disabled={allDay}
                  error={!allDay ? errors.time?.message : undefined}
                />
              )}
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
          {...register("notes")}
          placeholder="Internal notes (optional)…"
          className={`w-full resize-none rounded-lg border focus:ring-2 focus:ring-blue-500 px-3 py-2 ${errors.notes ? "border-red-500" : "border-gray-300"
            }`}
        />
        {errors.notes && (
          <p className="mt-1 text-sm text-red-500">{errors.notes.message}</p>
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
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving…" : "Save Appointment"}
        </button>
      </div>
    </form>
  );
}
