// src/utils/validateAppointment.js
import { format } from "date-fns";

const STATUSES = [
  "pending",
  "approved",
  "in_progress",
  "completed",
  "cancelled",
];

// Regex patterns
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/; // 24h format HH:mm
const PHONE_REGEX = /^[\d+\-\s()]{6,}$/;

/* ---------------- Normalization ---------------- */
export function normalizeTime(t) {
  if (!t) return null;
  try {
    return format(new Date(`1970-01-01T${t}`), "HH:mm");
  } catch {
    return t; // fallback, let validation handle if still invalid
  }
}

/* ---------------- Strict Validation (Create) ---------------- */
export function validateAppointmentInput(data) {
  const errors = [];

  if (!data.name || typeof data.name !== "string" || !data.name.trim()) {
    errors.push("Name is required");
  }

  if (!data.email || !EMAIL_REGEX.test(data.email)) {
    errors.push("Valid email is required");
  }

  if (data.contactNumber && !PHONE_REGEX.test(data.contactNumber)) {
    errors.push("Invalid contact number");
  }

  if (!data.service_id || isNaN(Number(data.service_id))) {
    errors.push("Service ID is required");
  }

  if (!data.date || !DATE_REGEX.test(data.date)) {
    errors.push("Date must be in YYYY-MM-DD format");
  }

  if (!data.time || !TIME_REGEX.test(data.time)) {
    errors.push("Time must be in HH:mm 24-hour format");
  }

  if (data.status && !STATUSES.includes(data.status)) {
    errors.push("Invalid status value");
  }

  return errors;
}

/* ---------------- Loose Validation (Update) ---------------- */
export function validateAppointmentUpdateInput(data) {
  const errors = [];

  if (data.name && !data.name.trim()) {
    errors.push("Name cannot be empty");
  }

  if (data.email && !EMAIL_REGEX.test(data.email)) {
    errors.push("Invalid email");
  }

  if (data.contactNumber && !PHONE_REGEX.test(data.contactNumber)) {
    errors.push("Invalid contact number");
  }

  if (data.service_id && isNaN(Number(data.service_id))) {
    errors.push("Invalid service ID");
  }

  if (data.date && !DATE_REGEX.test(data.date)) {
    errors.push("Invalid date format (YYYY-MM-DD)");
  }

  if (data.time && !TIME_REGEX.test(data.time)) {
    errors.push("Invalid time format (HH:mm 24-hour)");
  }

  if (data.status && !STATUSES.includes(data.status)) {
    errors.push("Invalid status value");
  }

  return errors;
}
