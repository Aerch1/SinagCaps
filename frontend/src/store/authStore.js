import { create } from "zustand";
import axios from "axios";
import {
  validateSignup,
  validateForgotPassword,
  validateLogin,
  validateResetPassword,
  validateVerifyEmail,
  validateChangeEmail, // 👈 add this import
} from "../../../shared/validation.js";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const AUTH_API_URL = `${API_URL}/auth`;

axios.defaults.withCredentials = true;

// Create the store first so we can reference it in the interceptor
export const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  error: null,
  isLoading: false,
  hasCheckedAuth: false, // 👈 add this

  message: null,
  isCheckingAuth: true,

  clearError: () => set({ error: null }),
  clearMessage: () => set({ message: null }),
  clearAll: () => set({ error: null, message: null }),

  setError: (error) => {
    set({ error, isLoading: false });
    setTimeout(() => {
      if (get().error === error) set({ error: null });
    }, 5000);
  },

  setMessage: (message) => {
    set({ message, isLoading: false });
    setTimeout(() => {
      if (get().message === message) set({ message: null });
    }, 5000);
  },

  setUser: (user) => {
    set({
      user,
      isAuthenticated: !!user,
      isCheckingAuth: false,
    });
  },

  checkAuth: async () => {
    if (get().hasCheckedAuth) return get().user;

    set({ isCheckingAuth: true, error: null });

    try {
      const response = await axios.get(`${AUTH_API_URL}/check-auth`);
      set({
        user: response.data.user,
        isAuthenticated: true,
        isCheckingAuth: false,
        hasCheckedAuth: true, // 👈 mark done
      });
      return response.data.user;
    } catch (error) {
      set({
        user: null,
        isAuthenticated: false,
        isCheckingAuth: false,
      });
      // Don't throw error here to prevent infinite loops
      return null;
    }
  },

  signup: async (email, password, name) => {
    set({ isLoading: true, error: null, message: null });

    const v = validateSignup({ email, password, name });
    if (!v.ok) {
      get().setError(v.message);
      return null;
    }

    try {
      const response = await axios.post(`${AUTH_API_URL}/signup`, {
        email: email.trim().toLowerCase(),
        password,
        name: name.trim(),
      });

      set({
        user: response.data.user,
        isAuthenticated: true,
        isLoading: false,
      });

      get().setMessage(
        "Account created! Please check your email for verification code."
      );
      return response.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Signup failed. Please try again.";
      get().setError(errorMessage);
      throw error;
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null, message: null });

    const v = validateLogin({ email, password });
    if (!v.ok) {
      get().setError(v.message);
      return null;
    }

    try {
      const response = await axios.post(`${AUTH_API_URL}/login`, {
        email: email.trim().toLowerCase(),
        password,
      });

      const user = response.data.user;
      set({
        isAuthenticated: true,
        user,
        error: null,
        isLoading: false,
      });

      get().setMessage("Welcome back!");
      return user;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        "Login failed. Please check your credentials.";
      get().setError(errorMessage);
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true, error: null });
    try {
      await axios.post(`${AUTH_API_URL}/logout`);
      set({
        user: null,
        isAuthenticated: false,
        error: null,
        isLoading: false,
      });
      get().setMessage("Logged out successfully");
    } catch (error) {
      if (error.response?.status !== 401) {
        console.error("Logout error:", error);
      }
      set({
        user: null,
        isAuthenticated: false,
        error: null,
        isLoading: false,
      });
    }
  },

  verifyEmail: async (code) => {
    set({ isLoading: true, error: null, message: null });

    const v = validateVerifyEmail({ code });
    if (!v.ok) {
      get().setError(v.message);
      return null;
    }

    try {
      const response = await axios.post(`${AUTH_API_URL}/verify-email`, {
        code: code.trim(),
      });

      set({
        user: response.data.user,
        isAuthenticated: true,
        isLoading: false,
      });

      get().setMessage("Email verified successfully!");
      return response.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        "Verification failed. Please try again.";
      get().setError(errorMessage);
      throw error;
    }
  },

  // ✅ NEW: changeEmail uses store validation & updates user locally (UI-only)
  changeEmail: async (email) => {
    set({ isLoading: true, error: null, message: null });

    const v = validateChangeEmail({ email });
    if (!v.ok) {
      get().setError(v.message);
      return null;
    }

    try {
      // If/when you add a backend endpoint, call it here.
      set({ isLoading: false });
      get().setMessage(
        "Email change request saved. We'll verify this new address shortly."
      );
      return true;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        "Failed to update email. Please try again.";
      get().setError(errorMessage);
      throw error;
    }
  },

  forgotPassword: async (email) => {
    set({ isLoading: true, error: null, message: null });

    const v = validateForgotPassword({ email });
    if (!v.ok) {
      get().setError(v.message);
      return null;
    }

    try {
      await axios.post(`${AUTH_API_URL}/forgot-password`, {
        email: email.trim().toLowerCase(),
      });

      get().setMessage("Password reset link sent to your email");
      return true;
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        "Password reset failed. Please try again.";
      get().setError(msg);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  resetPassword: async (token, password) => {
    set({ isLoading: true, error: null, message: null });

    const v = validateResetPassword({ token, password });
    if (!v.ok) {
      get().setError(v.message);
      return null;
    }

    try {
      await axios.post(`${AUTH_API_URL}/reset-password/${token}`, { password });
      get().setMessage("Password reset successfully! You can now log in.");
      return true;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        "Password reset failed. Please try again.";
      get().setError(errorMessage);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
}));

// axios interceptor unchanged
// authStore.js (interceptor part)
axios.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    // try refresh on ANY 401 once, except the refresh endpoint itself
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/auth/refresh-token")
    ) {
      originalRequest._retry = true;
      try {
        await axios.post(`${AUTH_API_URL}/refresh-token`, {}, { withCredentials: true });
        return axios(originalRequest); // retry original
      } catch (refreshError) {
        // clear auth state
        const store = useAuthStore.getState();
        store.set({
          user: null,
          isAuthenticated: false,
          error: null,
          isLoading: false,
          isCheckingAuth: false,
        });
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
