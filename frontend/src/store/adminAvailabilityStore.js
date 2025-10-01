// frontend/src/store/adminAvailabilityStore.js
import { create } from "zustand";
import api from "@/api/api"; // ✅ centralized axios instance
import toast from "react-hot-toast";

export const useAdminAvailabilityStore = create((set, get) => ({
  rules: [], // ✅ unified (weekly + custom)
  loading: false,

  /* ===============================
     FETCH RULES
  =============================== */
  fetchRules: async (serviceId) => {
    try {
      set({ loading: true });
      const res = await api.get(`/admin/availability/${serviceId}/rules`);
      set({ rules: res.data.rules || [] });
    } catch (err) {
      console.error("❌ fetchRules", err);
      toast.error("Failed to load rules");
    } finally {
      set({ loading: false });
    }
  },

  /* ===============================
     ADD RULE
  =============================== */
  addRule: async (serviceId, payload) => {
    try {
      const res = await api.post(
        `/admin/availability/${serviceId}/rules`,
        payload
      );
      set((state) => ({ rules: [...state.rules, res.data.rule] }));
      toast.success("Rule added");
    } catch (err) {
      console.error("❌ addRule", err);
      const errors = err.response?.data?.errors;
      if (Array.isArray(errors)) {
        errors.forEach((e) => toast.error(e));
      } else {
        toast.error("Failed to add rule");
      }
    }
  },

  /* ===============================
     UPDATE RULE
  =============================== */
  updateRule: async (id, payload) => {
    try {
      const rule = get().rules.find((r) => r.id === id);
      const service_id = rule?.service_id;

      const res = await api.put(`/admin/availability/rules/${id}`, {
        ...payload,
        service_id, // ✅ ensure backend always receives service_id
      });

      set((state) => ({
        rules: state.rules.map((r) => (r.id === id ? res.data.rule : r)),
      }));
      toast.success("Rule updated");
    } catch (err) {
      console.error("❌ updateRule", err);
      const errors = err.response?.data?.errors;
      if (Array.isArray(errors)) {
        errors.forEach((e) => toast.error(e));
      } else {
        toast.error("Failed to update rule");
      }
    }
  },

  /* ===============================
     DELETE RULE
  =============================== */
  deleteRule: async (id) => {
    try {
      await api.delete(`/admin/availability/rules/${id}`);
      set((state) => ({
        rules: state.rules.filter((r) => r.id !== id),
      }));
      toast.success("Rule deleted");
    } catch (err) {
      console.error("❌ deleteRule", err);
      toast.error("Failed to delete rule");
    }
  },

  /* ===============================
     TOGGLE BLOCK WEEKDAY
  =============================== */
  toggleBlockWeekday: async (serviceId, weekday, blocked) => {
    try {
      await api.patch(`/admin/availability/${serviceId}/block/${weekday}`, {
        blocked,
      });
      await get().fetchRules(serviceId);
      toast.success(
        `Weekday ${blocked ? "blocked (closed)" : "unblocked (open)"}`
      );
    } catch (err) {
      console.error("❌ toggleBlockWeekday", err);
      const errors = err.response?.data?.errors;
      if (Array.isArray(errors)) {
        errors.forEach((e) => toast.error(e));
      } else {
        toast.error("Failed to toggle block");
      }
    }
  },
}));
