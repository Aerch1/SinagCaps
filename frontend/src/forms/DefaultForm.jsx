"use client";

import { useEffect, useMemo, useRef } from "react";
import { parseISO, format } from "date-fns";
import { User, Mail, Phone, MapPin, FileText } from "lucide-react";
import Input from "../components/ui/Input";

const Req = () => <span className="text-red-500 ml-0.5">*</span>;

export default function DefaultForm({
  formData,
  setFormData,
  registerValidator,
  formErrors = {},
}) {
  const firstErrorRef = useRef(null);

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  /* =====================================================
     ✅ Validation (Smooth scroll + highlight)
  ===================================================== */
  useEffect(() => {
    if (!registerValidator) return;

    const validator = () => {
      const errs = {};
      const required = [
        "firstName",
        "lastName",
        "email",
        "phone",
        "address",
        "purpose",
      ];

      // Check required fields
      for (const f of required) {
        const val = formData[f]?.toString().trim();
        if (!val) errs[f] = "This field is required.";
      }

      // Email check
      const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
      if (formData.email && !emailRegex.test(formData.email.trim())) {
        errs.email = "Email must be a valid @gmail.com address.";
      }

      // Phone check
      const phoneRegex = /^09\d{9}$/;
      if (formData.phone && !phoneRegex.test(formData.phone.trim())) {
        errs.phone = "Phone must start with 09 and be 11 digits.";
      }

      // 🔽 Scroll to first invalid input if errors
      if (Object.keys(errs).length > 0 && firstErrorRef.current) {
        firstErrorRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }

      return Object.keys(errs).length === 0 ? true : errs;
    };

    registerValidator(3, validator);
  }, [formData, registerValidator]);

  /* =====================================================
     ✅ Scroll to first backend error
  ===================================================== */
  useEffect(() => {
    if (!firstErrorRef.current) return;
    if (Object.keys(formErrors).length > 0) {
      firstErrorRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [formErrors]);

  /* =====================================================
     🗓 Schedule Label
  ===================================================== */
  const scheduleLabel = useMemo(() => {
    if (!formData.preferredDate) return "";
    try {
      const d = parseISO(formData.preferredDate);
      const dateStr = format(d, "EEE, MMM d, yyyy");
      return formData.preferredTime
        ? `${dateStr} • ${formData.preferredTime}`
        : dateStr;
    } catch {
      return formData.preferredDate;
    }
  }, [formData.preferredDate, formData.preferredTime]);

  /* =====================================================
     🧱 Form Layout
  ===================================================== */
  return (
    <div className="space-y-8" noValidate>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-lg font-medium">Personal Information & Details</h3>
        {scheduleLabel && (
          <span className="inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-800">
            Selected schedule: {scheduleLabel}
          </span>
        )}
      </div>

      {/* ---------- Input Fields ---------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* First Name */}
        <div
          ref={
            formErrors.firstName && !firstErrorRef.current
              ? firstErrorRef
              : null
          }
        >
          <label className="block text-xs font-medium text-gray-700 mb-1">
            First Name <Req />
          </label>
          <Input
            icon={User}
            placeholder="First Name"
            autoComplete="given-name"
            value={formData.firstName || ""}
            onChange={(e) => updateField("firstName", e.target.value)}
            className={
              formErrors.firstName ? "border-red-500 focus:ring-red-500" : ""
            }
          />
          {formErrors.firstName && (
            <p className="text-red-500 text-xs mt-1">{formErrors.firstName}</p>
          )}
        </div>

        {/* Last Name */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Last Name <Req />
          </label>
          <Input
            icon={User}
            placeholder="Last Name"
            autoComplete="family-name"
            value={formData.lastName || ""}
            onChange={(e) => updateField("lastName", e.target.value)}
            className={
              formErrors.lastName ? "border-red-500 focus:ring-red-500" : ""
            }
          />
          {formErrors.lastName && (
            <p className="text-red-500 text-xs mt-1">{formErrors.lastName}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Email <Req />
          </label>
          <Input
            icon={Mail}
            type="email"
            placeholder="name@gmail.com"
            autoComplete="email"
            value={formData.email || ""}
            onChange={(e) => updateField("email", e.target.value)}
            className={
              formErrors.email ? "border-red-500 focus:ring-red-500" : ""
            }
          />
          {formErrors.email && (
            <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Phone <Req />
          </label>
          <Input
            icon={Phone}
            type="tel"
            placeholder="09XXXXXXXXX"
            autoComplete="tel"
            value={formData.phone || ""}
            onChange={(e) => updateField("phone", e.target.value)}
            className={
              formErrors.phone ? "border-red-500 focus:ring-red-500" : ""
            }
          />
          {formErrors.phone && (
            <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>
          )}
        </div>
      </div>

      {/* ---------- Address ---------- */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Address <Req />
        </label>
        <Input
          icon={MapPin}
          placeholder="Complete Address"
          as="textarea"
          rows={3}
          value={formData.address || ""}
          onChange={(e) => updateField("address", e.target.value)}
          className={
            formErrors.address ? "border-red-500 focus:ring-red-500" : ""
          }
        />
        {formErrors.address && (
          <p className="text-red-500 text-xs mt-1">{formErrors.address}</p>
        )}
      </div>

      {/* ---------- Purpose / Reason ---------- */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Purpose / Reason <Req />
        </label>
        <Input
          icon={FileText}
          placeholder="Briefly describe why you’re booking"
          as="textarea"
          rows={3}
          value={formData.purpose || ""}
          onChange={(e) => updateField("purpose", e.target.value)}
          className={
            formErrors.purpose ? "border-red-500 focus:ring-red-500" : ""
          }
        />
        {formErrors.purpose && (
          <p className="text-red-500 text-xs mt-1">{formErrors.purpose}</p>
        )}
      </div>

      {/* ---------- Additional Notes (Optional) ---------- */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Additional Notes <span className="text-gray-400 text-xs">(optional)</span>
        </label>
        <Input
          icon={FileText}
          placeholder="Anything else we should know?"
          as="textarea"
          rows={3}
          value={formData.additionalNotes || ""}
          onChange={(e) => updateField("additionalNotes", e.target.value)}
        />
      </div>
    </div>
  );
}
