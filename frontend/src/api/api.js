// frontend/src/api/api.js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // ✅ always points to /api
  withCredentials: true, // ✅ keep cookies/JWT
});

export default api;
