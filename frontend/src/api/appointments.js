// src/api/appointments.js
import api from "./api"; // ✅ centralized axios instance

// basic list (initial load, no filters)
export async function getAppointments(params = {}) {
  const res = await api.get("/admin/appointments", { params });
  return res.data;
}

// filtered list (search + service + status + sort)
export async function filterAppointments(filters = {}) {
  const res = await api.post("/admin/appointments/filter", filters);
  return res.data;
}

