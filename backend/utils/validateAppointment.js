// src/utils/validateAppointment.js
import { format } from "date-fns";

// Minimal sanitization/normalization + only-needed checks

export function normalizeTime(t) {
  if (!t) return null;
  // Accept "HH:mm" or "HH:mm:ss"
  if (/^\d{2}:\d{2}$/.test(t)) return t;
  if (/^\d{2}:\d{2}:\d{2}$/.test(t)) return t.slice(0, 5);
  return null;
}

export function validateCreate({ name, email, service_id, date, time }) {
  const errors = [];
  if (!service_id) errors.push("Service is required.");
  if (!date) errors.push("Date is required.");
  if (!time) errors.push("Time is required.");
  if (!name) errors.push("Name is required.");
  if (!email) errors.push("Email is required.");
  return errors;
}

export function validateUpdate({ status, date, time }) {
  const errors = [];
  if (
    status &&
    !["pending", "approved", "in_progress", "completed", "cancelled"].includes(
      status
    )
  ) {
    errors.push("Invalid status.");
  }
  // Date/time optional, but if present must be valid
  if (time && !/^\d{2}:\d{2}$/.test(time))
    errors.push("Invalid time format (HH:mm).");
  return errors;
}
