// src/utils/validateAppointment.js
import { format } from "date-fns";

export function normalizeTime(t) {
  if (!t) return null;
  if (/^\d{2}:\d{2}$/.test(t)) return t;
  if (/^\d{2}:\d{2}:\d{2}$/.test(t)) return t.slice(0, 5);
  return null;
}

export function validateCreate({
  name,
  email,
  contactNumber,
  service_id,
  date,
  time,
}) {
  const errors = [];

  // Required checks
  if (!name || !name.trim())
    errors.push({ field: "name", message: "Name is required." });
  if (!email || !email.trim())
    errors.push({ field: "email", message: "Email is required." });
  if (!contactNumber)
    errors.push({
      field: "contactNumber",
      message: "Contact number is required.",
    });
  if (!service_id)
    errors.push({ field: "service_id", message: "Service is required." });
  if (!date) errors.push({ field: "date", message: "Date is required." });
  if (!time) errors.push({ field: "time", message: "Time is required." });

  // Type checks
  if (contactNumber && !/^\d+$/.test(String(contactNumber))) {
    errors.push({
      field: "contactNumber",
      message: "Contact number must be digits only.",
    });
  }

  if (service_id && isNaN(Number(service_id))) {
    errors.push({
      field: "service_id",
      message: "Service ID must be a number.",
    });
  }

  return errors;
}

export function validateUpdate({ status, date, time }) {
  const errors = [];

  // ✅ removed "in_progress" (no longer a valid status)
  if (
    status &&
    ![
      "pending",
      "approved",
      "completed",
      "cancelled",
      "rejected",
      "archived",
    ].includes(status)
  ) {
    errors.push({ field: "status", message: "Invalid status." });
  }

  if (time && !/^\d{2}:\d{2}$/.test(time)) {
    errors.push({ field: "time", message: "Invalid time format (HH:mm)." });
  }
  return errors;
}
