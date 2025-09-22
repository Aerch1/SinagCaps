import axios from "axios";

// basic list (initial load, no filters)
export async function getAppointments(params = {}) {
  const res = await axios.get("/api/admin/appointments", { params });
  return res.data;
}

// filtered list (search + service + status + sort)
export async function filterAppointments(filters = {}) {
  const res = await axios.post("/api/admin/appointments/filter", filters);
  return res.data;
}

// export all
export async function exportAppointments() {
  window.open(`/api/admin/appointments/export`, "_blank");
}
