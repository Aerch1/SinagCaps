// frontend/src/hooks/useAutoPopulateForm.js
import { useEffect } from "react";
import { parseISO } from "date-fns";
import { useAuthStore } from "../store/authStore.js";

export function useAutoPopulateForm(formData, setFormData) {
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) return;

    setFormData((prev) => ({
      ...prev,
      // Only fill fields that exist in the formData
      childFullName: prev.childFullName ?? user.name ?? "",
      phone: prev.phone ?? user.phone ?? "",
      email: prev.email ?? user.email ?? "",
      address: prev.address ?? user.location ?? "",
      // You could extend mapping if user has extra info, e.g. parents, etc.
      dob: prev.dob ?? (user.dob ? parseISO(user.dob) : ""),
      gender: prev.gender ?? user.gender ?? "",
    }));
  }, [user, setFormData]);
}
