import { create } from "zustand";
import axios from "axios";
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
      const res = await axios.get(
        `/api/admin/availability/${serviceId}/rules`,
        { withCredentials: true }
      );
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
      const res = await axios.post(
        `/api/admin/availability/${serviceId}/rules`,
        payload,
        { withCredentials: true }
      );
      set((state) => ({ rules: [...state.rules, res.data.rule] }));
      toast.success("Rule added");
    } catch (err) {
      console.error("❌ addRule", err);
      if (err.response?.status === 400 && err.response.data?.errors) {
        err.response.data.errors.forEach((e) => toast.error(e));
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
      const res = await axios.put(
        `/api/admin/availability/rules/${id}`,
        payload,
        { withCredentials: true }
      );
      set((state) => ({
        rules: state.rules.map((r) => (r.id === id ? res.data.rule : r)),
      }));
      toast.success("Rule updated");
    } catch (err) {
      console.error("❌ updateRule", err);
      if (err.response?.status === 400 && err.response.data?.errors) {
        err.response.data.errors.forEach((e) => toast.error(e));
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
      await axios.delete(`/api/admin/availability/rules/${id}`, {
        withCredentials: true,
      });
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
      await axios.patch(
        `/api/admin/availability/${serviceId}/block/${weekday}`,
        { blocked },
        { withCredentials: true }
      );
      await get().fetchRules(serviceId); // ✅ always refresh after toggle
      toast.success(
        `Weekday ${blocked ? "blocked (closed)" : "unblocked (open)"}`
      );
    } catch (err) {
      console.error("❌ toggleBlockWeekday", err);
      if (err.response?.status === 400 && err.response.data?.errors) {
        err.response.data.errors.forEach((e) => toast.error(e));
      } else {
        toast.error("Failed to toggle block");
      }
    }
  },
}));
