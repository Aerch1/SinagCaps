// frontend/src/store/auth.js
import { create } from "zustand";
import axios from "axios";
import {
  validateSignup,
  validateForgotPassword,
  validateLogin,
  validateResetPassword,
  validateVerifyEmail,
  validateChangeEmail,
} from "../../../shared/validation.js";

const API_URL = import.meta.env.VITE_API_URL || "/api";
const AUTH_API_URL = `${API_URL}/auth`;

axios.defaults.withCredentials = true;

export const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  error: null,
  isLoading: false,
  message: null,

  isCheckingAuth: true,
  hasCheckedAuth: false,

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
    set({ user, isAuthenticated: !!user, isCheckingAuth: false });
  },

  // ---------- Auth boot: try refresh then check-auth ----------
  checkAuth: async () => {
    if (get().hasCheckedAuth) return get().user;
    set({ isCheckingAuth: true, error: null });
    try {
      // Try to refresh first (handles expired access token on page reload)
      await axios.post(
        `${AUTH_API_URL}/refresh-token`,
        {},
        { withCredentials: true }
      );

      // Then fetch the user
      const { data } = await axios.get(`${AUTH_API_URL}/check-auth`, {
        withCredentials: true,
      });
      set({
        user: data.user,
        isAuthenticated: true,
        isCheckingAuth: false,
        hasCheckedAuth: true,
      });
      return data.user;
    } catch {
      set({
        user: null,
        isAuthenticated: false,
        isCheckingAuth: false,
        hasCheckedAuth: true,
      });
      return null;
    }
  },

  // ---------- Standard flows ----------
  signup: async (email, password, name) => {
    set({ isLoading: true, error: null, message: null });
    const v = validateSignup({ email, password, name });
    if (!v.ok) return get().setError(v.message);
    try {
      const { data } = await axios.post(`${AUTH_API_URL}/signup`, {
        email: email.trim().toLowerCase(),
        password,
        name: name.trim(),
      });
      set({ isLoading: false, isCheckingAuth: false, hasCheckedAuth: true });
      get().setMessage(
        data?.message ||
          "Account created! Please check your email for the verification code."
      );
      return true;
    } catch (error) {
      get().setError(
        error.response?.data?.message || "Signup failed. Please try again."
      );
      throw error;
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null, message: null });
    const v = validateLogin({ email, password });
    if (!v.ok) return get().setError(v.message);

    try {
      const { data } = await axios.post(`${AUTH_API_URL}/login`, {
        email: email.trim().toLowerCase(),
        password,
      });

      set({
        isAuthenticated: true,
        user: data.user,
        error: null,
        isLoading: false,
        hasCheckedAuth: true,
        isCheckingAuth: false,
      });

      get().setMessage("Welcome back!");
      return data.user;
    } catch (error) {
      const status = error.response?.status;
      if (status === 403) {
        get().setError("Please verify your email before logging in.");
        return null;
      }
      get().setError(
        error.response?.data?.message ||
          "Login failed. Please check your credentials."
      );
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true, error: null });
    try {
      await axios.post(`${AUTH_API_URL}/logout`);
    } catch (error) {
      if (error.response?.status !== 401) console.error("Logout error:", error);
    } finally {
      set({
        user: null,
        isAuthenticated: false,
        error: null,
        isLoading: false,
        isCheckingAuth: false,
        hasCheckedAuth: true,
      });
      get().setMessage("Logged out successfully");
    }
  },

  verifyEmail: async (code) => {
    set({ isLoading: true, error: null, message: null });
    const v = validateVerifyEmail({ code });
    if (!v.ok) return get().setError(v.message);

    try {
      const { data } = await axios.post(`${AUTH_API_URL}/verify-email`, {
        code: code.trim(),
      });
      set({
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
        hasCheckedAuth: true,
        isCheckingAuth: false,
      });
      get().setMessage("Email verified successfully!");
      return data;
    } catch (error) {
      get().setError(
        error.response?.data?.message ||
          "Verification failed. Please try again."
      );
      throw error;
    }
  },

  forgotPassword: async (email) => {
    set({ isLoading: true, error: null, message: null });
    const v = validateForgotPassword({ email });
    if (!v.ok) return get().setError(v.message);

    try {
      await axios.post(`${AUTH_API_URL}/forgot-password`, {
        email: email.trim().toLowerCase(),
      });
      get().setMessage("Password reset link sent to your email");
      return true;
    } catch (error) {
      get().setError(
        error.response?.data?.message ||
          "Password reset failed. Please try again."
      );
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  resetPassword: async (token, password) => {
    set({ isLoading: true, error: null, message: null });
    const v = validateResetPassword({ token, password });
    if (!v.ok) return get().setError(v.message);
    try {
      await axios.post(`${AUTH_API_URL}/reset-password/${token}`, { password });
      get().setMessage("Password reset successfully! You can now log in.");
      return true;
    } catch (error) {
      get().setError(
        error.response?.data?.message ||
          "Password reset failed. Please try again."
      );
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // ---------- Headless helpers ----------
  reauthPassword: async (password) => {
    if (!password) return { ok: false, message: "Please enter your password" };
    try {
      await axios.post(`${AUTH_API_URL}/reauth`, { password });
      return { ok: true };
    } catch (err) {
      const s = err?.response?.status;
      if (s === 400 || s === 401)
        return { ok: false, message: "Incorrect password. Please try again." };
      return { ok: false, message: "Something went wrong. Try again." };
    }
  },

  changePassword: async (current, next, logoutOthers = true) => {
    if (!current)
      return {
        ok: false,
        field: "current",
        message: "Enter your current password.",
      };
    if (!next || next.length < 6)
      return {
        ok: false,
        field: "new",
        message: "Password must be at least 6 characters.",
      };

    try {
      const { data } = await axios.post(`${AUTH_API_URL}/change-password`, {
        current,
        next,
        logoutOthers,
      });

      if (data?.user) useAuthStore.getState().setUser(data.user);
      return { ok: true };
    } catch (err) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || "Failed to change password.";
      if (status === 400 || status === 401) {
        if (/current/i.test(msg))
          return { ok: false, field: "current", message: msg };
        if (/new/i.test(msg)) return { ok: false, field: "new", message: msg };
        return { ok: false, message: msg };
      }
      return { ok: false, message: "Something went wrong. Try again." };
    }
  },

  deleteAccount: async (password) => {
    if (!password?.trim())
      return {
        ok: false,
        field: "password",
        message: "Please enter your password.",
      };
    try {
      await axios.post(`${AUTH_API_URL}/delete-account`, { password });
      set({ user: null, isAuthenticated: false });
      return { ok: true };
    } catch (err) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || "Failed to delete account.";
      if (status === 400 || status === 401) {
        return { ok: false, field: "password", message: msg };
      }
      return { ok: false, message: "Something went wrong. Try again." };
    }
  },

  requestEmailChange: async (email) => {
    const v = validateChangeEmail({ email });
    if (!v.ok) return { ok: false, message: v.message };
    try {
      await axios.post(`${AUTH_API_URL}/change-email/request`, {
        email: email.trim().toLowerCase(),
      });
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        message: err?.response?.data?.message || "Failed to send code.",
      };
    }
  },

  confirmEmailChange: async (email, code) => {
    const ve = validateChangeEmail({ email });
    if (!ve.ok) return { ok: false, field: "email", message: ve.message };
    const vc = validateVerifyEmail({ code });
    if (!vc.ok) return { ok: false, field: "code", message: vc.message };

    try {
      const { data } = await axios.post(
        `${AUTH_API_URL}/change-email/confirm`,
        {
          email: email.trim().toLowerCase(),
          code: code.trim(),
        }
      );

      const next =
        data?.user ??
        (get().user
          ? { ...get().user, email: email.trim().toLowerCase() }
          : null);
      if (next) set({ user: next, isAuthenticated: true });

      return { ok: true, user: next };
    } catch (err) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message;
      if (status === 400 || status === 401) {
        if (/code/i.test(msg || ""))
          return { ok: false, field: "code", message: msg || "Invalid code." };
        if (/email/i.test(msg || ""))
          return {
            ok: false,
            field: "email",
            message: msg || "Invalid email.",
          };
        return { ok: false, message: msg || "Request failed." };
      }
      return { ok: false, message: "Something went wrong. Try again." };
    }
  },
}));

// ---- Interceptor: refresh on 401 (even if isAuthenticated=false) ----
axios.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { response, config: originalRequest } = error || {};
    const status = response?.status;
    const url = originalRequest?.url || "";

    // endpoints that must not trigger refresh
    const noRefresh = [
      "/auth/login",
      "/auth/signup",
      "/auth/verify-email",
      "/auth/forgot-password",
      "/auth/reset-password",
    ];

    if (
      status !== 401 ||
      originalRequest?._retry ||
      url.includes("/auth/refresh-token") ||
      noRefresh.some((p) => url.includes(p))
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      await axios.post(
        `${AUTH_API_URL}/refresh-token`,
        {},
        { withCredentials: true }
      );

      // (optional) rehydrate user after refresh
      try {
        const { data } = await axios.get(`${AUTH_API_URL}/check-auth`, {
          withCredentials: true,
        });
        useAuthStore.getState().setUser(data.user);
        useAuthStore.setState({ hasCheckedAuth: true, isCheckingAuth: false });
      } catch {}

      return axios(originalRequest); // retry once
    } catch {
      // session is gone
      useAuthStore.setState({
        user: null,
        isAuthenticated: false,
        error: null,
        isLoading: false,
        isCheckingAuth: false,
        hasCheckedAuth: true,
      });
      return Promise.reject(error);
    }
  }
);
