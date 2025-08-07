import { create } from "zustand";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const AUTH_API_URL = `${API_URL}/auth`;

axios.defaults.withCredentials = true;

// Create the store first so we can reference it in the interceptor
export const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  error: null,
  isLoading: false,
  message: null,
  isCheckingAuth: true,

  clearError: () => {
    set({ error: null });
  },

  clearMessage: () => {
    set({ message: null });
  },

  // Clear both error and message when navigating
  clearAll: () => {
    set({ error: null, message: null });
  },

  setError: (error) => {
    set({ error, isLoading: false });
    setTimeout(() => {
      if (get().error === error) {
        set({ error: null });
      }
    }, 5000);
  },

  setMessage: (message) => {
    set({ message, isLoading: false });
    setTimeout(() => {
      if (get().message === message) {
        set({ message: null });
      }
    }, 5000);
  },

  setUser: (user) => {
    set({ 
      user, 
      isAuthenticated: !!user,
      isCheckingAuth: false 
    });
  },

  checkAuth: async () => {
    set({ isCheckingAuth: true, error: null });
    try {
      const response = await axios.get(`${AUTH_API_URL}/check-auth`);
      set({
        user: response.data.user,
        isAuthenticated: true,
        isCheckingAuth: false,
      });
      return response.data.user;
    } catch (error) {
      // Silently handle expected 401 responses (no user logged in)
      set({ 
        user: null, 
        isAuthenticated: false, 
        isCheckingAuth: false 
      });
      return null;
    }
  },

  signup: async (email, password, name) => {
    set({ isLoading: true, error: null, message: null });
    
    if (!name?.trim()) {
      get().setError("Please enter your full name");
      return null;
    }
    if (!email?.trim()) {
      get().setError("Please enter your email address");
      return null;
    }
    if (!email.includes("@")) {
      get().setError("Please enter a valid email address");
      return null;
    }
    if (!password) {
      get().setError("Please enter a password");
      return null;
    }
    if (password.length < 6) {
      get().setError("Password must be at least 6 characters long");
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
      
      get().setMessage("Account created! Please check your email for verification code.");
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Signup failed. Please try again.";
      get().setError(errorMessage);
      throw error;
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null, message: null });
    
    if (!email?.trim()) {
      get().setError("Please enter your email address");
      return null;
    }
    if (!email.includes("@")) {
      get().setError("Please enter a valid email address");
      return null;
    }
    if (!password) {
      get().setError("Please enter your password");
      return null;
    }

    try {
      const response = await axios.post(`${AUTH_API_URL}/login`, {
        email: email.trim().toLowerCase(),
        password,
      });
      
      const userData = response.data.user;
      set({
        isAuthenticated: true,
        user: userData,
        error: null,
        isLoading: false,
      });
      
      get().setMessage("Welcome back!");
      return userData;
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Login failed. Please check your credentials.";
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
      get().setMessage("Logged out successfully"); // ✅ Only show when actually logging out
    } catch (error) {
      // Only log unexpected errors
      if (error.response?.status !== 401) {
        console.error("Logout error:", error);
      }
      // Still clear user state even if logout request fails
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
    
    if (!code?.trim()) {
      get().setError("Please enter the verification code");
      return;
    }
    if (code.trim().length !== 6) {
      get().setError("Verification code must be 6 digits");
      return;
    }
    if (!/^\d{6}$/.test(code.trim())) {
      get().setError("Please enter only numbers");
      return;
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
      const errorMessage = error.response?.data?.message || "Verification failed. Please try again.";
      get().setError(errorMessage);
      throw error;
    }
  },

  forgotPassword: async (email) => {
    set({ isLoading: true, error: null, message: null });
    
    if (!email?.trim()) {
      get().setError("Please enter your email address");
      throw new Error("Email is required");
    }
    if (!email.includes("@")) {
      get().setError("Please enter a valid email address");
      throw new Error("Invalid email");
    }

    try {
      await axios.post(`${AUTH_API_URL}/forgot-password`, {
        email: email.trim().toLowerCase(),
      });
      
      get().setMessage("If an account exists, you'll receive a password reset link.");
    } catch (error) {
      get().setMessage("If an account exists, you'll receive a password reset link.");
      throw error;
    }
  },

  resetPassword: async (token, password) => {
    set({ isLoading: true, error: null, message: null });
    
    if (!token?.trim()) {
      get().setError("Invalid reset link");
      throw new Error("Invalid token");
    }
    if (!password) {
      get().setError("Please enter a new password");
      throw new Error("Password is required");
    }
    if (password.length < 6) {
      get().setError("Password must be at least 6 characters long");
      throw new Error("Password too short");
    }

    try {
      await axios.post(`${AUTH_API_URL}/reset-password/${token}`, { password });
      get().setMessage("Password reset successfully! You can now log in.");
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Password reset failed. Please try again.";
      get().setError(errorMessage);
      throw error;
    }
  },
}));

// Set up axios interceptor with silent handling for expected 401s
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Only attempt token refresh for authenticated routes (not auth endpoints)
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/auth/") // Skip all auth endpoints
    ) {
      originalRequest._retry = true;
      
      try {
        const response = await axios.post(
          `${AUTH_API_URL}/refresh-token`,
          {},
          { withCredentials: true }
        );
        
        if (response.data.user) {
          useAuthStore.getState().setUser(response.data.user);
        }
        
        return axios(originalRequest);
      } catch (refreshError) {
        // Silently handle expected refresh failures - DON'T show logout message
        const store = useAuthStore.getState();
        store.set({
          user: null,
          isAuthenticated: false,
          error: null,
          isLoading: false,
          // ✅ Don't set logout message here
        });
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);
