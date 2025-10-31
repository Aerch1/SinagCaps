"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { parseISO, format } from "date-fns";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Church,
  BookOpen,
} from "lucide-react";

import Input from "../components/ui/Input.jsx";
import Dropdown from "../components/ui/Dropdown1.jsx";
import DateInput from "../components/ui/DateInput.jsx";
import api from "@/api/api"; // ✅ make sure this exists


/* ---------- Small Helpers ---------- */
const RequiredIndicator = () => <span className="text-red-500 ml-1">*</span>;
const SectionHeader = ({ title, description }) => (
  <div className="pb-3 border-b border-gray-100">
    <h4 className="text-sm font-medium text-gray-900">{title}</h4>
    {description && <p className="text-xs text-gray-600 mt-1">{description}</p>}
  </div>
);

export default function ConfirmationForm({
  formData,
  setFormData,
  registerValidator,
  formErrors = {},
}) {
  const firstErrorRef = useRef(null);



  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await api.get("/auth/check-auth"); // ✅ correct endpoint
        if (data?.user) {
          // ✅ Auto-fill if user logged in
          setFormData((prev) => ({
            ...prev,
            confirmandName: data.user.name || "",
            email: data.user.email || "",
            phone: data.user.phone || "",
            address: data.user.location || "",
          }));
        }
      } catch {
        // not logged in — do nothing
      } finally {
        setLoadingUser(false);
      }
    };
    fetchUser();
  }, [setFormData]);


  /* ---------- Initialize Sponsors ---------- */
  useEffect(() => {
    if (!formData.sponsors || formData.sponsors.length < 2) {
      setFormData((prev) => ({
        ...prev,
        sponsors: [
          { role: "Ninong", name: "", address: "" },
          { role: "Ninang", name: "", address: "" },
        ],
      }));
    }
  }, []);

  /* ---------- Field Updates ---------- */
  const updateField = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const updateSponsor = (idx, field, value) => {
    const sponsors = [...(formData.sponsors || [])];
    sponsors[idx][field] = value;
    setFormData((prev) => ({ ...prev, sponsors }));
  };

  /* ======================================================
     ✅ Validation (Smooth scroll to first error)
  ====================================================== */
  useEffect(() => {
    if (!registerValidator) return;

    const validator = () => {
      const errs = {};
      const required = [
        "confirmandName",
        "fatherName",
        "motherMaidenName",
        "age",
        "parishOrigin",
        "baptizedAt",
        "baptizedOn",
        "phone",
        "email",
        "address",
      ];

      // Required fields
      for (const f of required) {
        const val = formData[f]?.toString().trim();
        if (!val) errs[f] = "This field is required.";
      }

      // Phone validation
      const phoneRegex = /^09\d{9}$/;
      if (formData.phone && !phoneRegex.test(formData.phone.trim())) {
        errs.phone = "Phone must start with 09 and contain 11 digits.";
      }

      // Email validation
      const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
      if (formData.email && !emailRegex.test(formData.email.trim())) {
        errs.email = "Email must be a valid @gmail.com address.";
      }

      // Sponsors validation
      formData.sponsors?.forEach((s, i) => {
        if (!s.role?.trim()) errs[`sponsor_${i}_role`] = "Role is required.";
        if (!s.name?.trim()) errs[`sponsor_${i}_name`] = "Name is required.";
        if (!s.address?.trim()) errs[`sponsor_${i}_address`] = "Address is required.";
      });

      // Smooth scroll to first invalid input
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

  /* ---------- Schedule Label ---------- */
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

  /* ======================================================
     🧱 UI Layout
  ====================================================== */
  return (
    <div className="max-w-7xl mx-auto space-y-6" noValidate>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-base font-medium">Confirmation Application</h3>
        {(formData.serviceName || scheduleLabel) && (
          <span className="inline-flex items-center rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-800">
            Selected:{" "}
            {formData.serviceName ? `${formData.serviceName}` : "—"}
            {scheduleLabel ? ` • ${scheduleLabel}` : ""}
          </span>
        )}
      </div>

      {/* Confirmand Info */}
      <section className="bg-white rounded-2xl border p-6 space-y-6 border-gray-100">
        <SectionHeader title="Confirmand Information" description="Confirmand details" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <div
            ref={formErrors.confirmandName && !firstErrorRef.current ? firstErrorRef : null}
          >
            <label className="block text-xs font-medium text-gray-900 mb-1">
              Full Name <RequiredIndicator />
            </label>
            <Input
              icon={User}
              placeholder="Juan Dela Cruz"
              value={formData.confirmandName || ""}
              onChange={(e) => updateField("confirmandName", e.target.value)}
              className={formErrors.confirmandName ? "border-red-500 focus:ring-red-500" : ""}
            />
            {formErrors.confirmandName && (
              <p className="text-red-500 text-xs mt-1">{formErrors.confirmandName}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-900 mb-1">
              Age <RequiredIndicator />
            </label>
            <Input
              type="number"
              placeholder="e.g. 18"
              value={formData.age || ""}
              onChange={(e) => updateField("age", e.target.value)}
              className={formErrors.age ? "border-red-500 focus:ring-red-500" : ""}
            />
            {formErrors.age && <p className="text-red-500 text-xs mt-1">{formErrors.age}</p>}
          </div>
        </div>
      </section>

      {/* Parents Info */}
      <section className="bg-white rounded-2xl border p-6 space-y-6 border-gray-100">
        <SectionHeader title="Parents Information" description="Parent details" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <div>
            <label className="block text-xs font-medium text-gray-900 mb-1">
              Father's Full Name <RequiredIndicator />
            </label>
            <Input
              icon={User}
              placeholder="Father's complete name"
              value={formData.fatherName || ""}
              onChange={(e) => updateField("fatherName", e.target.value)}
              className={formErrors.fatherName ? "border-red-500 focus:ring-red-500" : ""}
            />
            {formErrors.fatherName && <p className="text-red-500 text-xs mt-1">{formErrors.fatherName}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-900 mb-1">
              Mother's Maiden Name <RequiredIndicator />
            </label>
            <Input
              icon={User}
              placeholder="Mother's complete name"
              value={formData.motherMaidenName || ""}
              onChange={(e) => updateField("motherMaidenName", e.target.value)}
              className={formErrors.motherMaidenName ? "border-red-500 focus:ring-red-500" : ""}
            />
            {formErrors.motherMaidenName && <p className="text-red-500 text-xs mt-1">{formErrors.motherMaidenName}</p>}
          </div>
        </div>
      </section>

      {/* Baptism Record */}
      <section className="bg-white rounded-2xl border p-6 space-y-6 border-gray-100">
        <SectionHeader title="Baptism Record" description="Baptism details" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <div>
            <label className="block text-xs font-medium text-gray-900 mb-1">
              Baptized At (Place) <RequiredIndicator />
            </label>
            <Input
              icon={Church}
              placeholder="Parish or Church Name"
              value={formData.baptizedAt || ""}
              onChange={(e) => updateField("baptizedAt", e.target.value)}
              className={formErrors.baptizedAt ? "border-red-500 focus:ring-red-500" : ""}
            />
            {formErrors.baptizedAt && <p className="text-red-500 text-xs mt-1">{formErrors.baptizedAt}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-900 mb-1">
              Baptized On (Date) <RequiredIndicator />
            </label>
            <DateInput
              value={formData.baptizedOn || ""}
              onDateChange={(val) => updateField("baptizedOn", val)}
              className={formErrors.baptizedOn ? "border-red-500 focus:ring-red-500" : ""}
            />
            {formErrors.baptizedOn && <p className="text-red-500 text-xs mt-1">{formErrors.baptizedOn}</p>}
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-900 mb-1">
              Parish Origin <RequiredIndicator />
            </label>
            <Input
              icon={BookOpen}
              placeholder="e.g. Sto. Niño Parish, Lipa City"
              value={formData.parishOrigin || ""}
              onChange={(e) => updateField("parishOrigin", e.target.value)}
              className={formErrors.parishOrigin ? "border-red-500 focus:ring-red-500" : ""}
            />
            {formErrors.parishOrigin && <p className="text-red-500 text-xs mt-1">{formErrors.parishOrigin}</p>}
          </div>
        </div>
      </section>

      {/* Contact Info */}
      <section className="bg-white rounded-2xl border p-6 space-y-6 border-gray-100">
        <SectionHeader title="Contact & Address" description="Contact details" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <Input
            label="Contact No."
            icon={Phone}
            type="tel"
            placeholder="09XXXXXXXXX"
            value={formData.phone || ""}
            onChange={(e) => updateField("phone", e.target.value)}
            className={formErrors.phone ? "border-red-500 focus:ring-red-500" : ""}
          />
          <Input
            label="Email"
            icon={Mail}
            type="email"
            placeholder="name@gmail.com"
            value={formData.email || ""}
            onChange={(e) => updateField("email", e.target.value)}
            className={formErrors.email ? "border-red-500 focus:ring-red-500" : ""}
          />
        </div>
        {formErrors.phone && <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>}
        {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}

        <Input
          label="Complete Address"
          icon={MapPin}
          placeholder="House No., Street, Barangay, City"
          value={formData.address || ""}
          onChange={(e) => updateField("address", e.target.value)}
          className={formErrors.address ? "border-red-500 focus:ring-red-500" : ""}
        />
        {formErrors.address && <p className="text-red-500 text-xs mt-1">{formErrors.address}</p>}
      </section>

      {/* Sponsors */}
      <section className="bg-white rounded-2xl border border-gray-100 p-6">
        <SectionHeader title="Sponsors (Ninong/Ninang)" description="Two sponsors required" />
        <div className="space-y-6 pt-4">
          {(formData.sponsors || []).map((s, idx) => (
            <div key={idx} className="rounded-xl border border-gray-200 p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-900 mb-2">
                    Role <RequiredIndicator />
                  </label>
                  <Dropdown
                    value={s.role}
                    onChange={(val) => updateSponsor(idx, "role", val)}
                    options={["Ninong", "Ninang"]}
                    placeholder="Select role"
                    className={`h-12 ${formErrors[`sponsor_${idx}_role`] ? "border-red-500 focus:ring-red-500" : ""
                      }`}
                  />
                  {formErrors[`sponsor_${idx}_role`] && <p className="text-red-500 text-xs mt-1">{formErrors[`sponsor_${idx}_role`]}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-900 mb-2">
                    Full Name <RequiredIndicator />
                  </label>
                  <Input
                    icon={User}
                    placeholder="Complete name"
                    value={s.name}
                    onChange={(e) => updateSponsor(idx, "name", e.target.value)}
                    className={`h-12 text-base ${formErrors[`sponsor_${idx}_name`] ? "border-red-500 focus:ring-red-500" : ""
                      }`}
                  />
                  {formErrors[`sponsor_${idx}_name`] && <p className="text-red-500 text-xs mt-1">{formErrors[`sponsor_${idx}_name`]}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-900 mb-2">
                    Address <RequiredIndicator />
                  </label>
                  <Input
                    icon={MapPin}
                    placeholder="Complete address"
                    value={s.address}
                    onChange={(e) => updateSponsor(idx, "address", e.target.value)}
                    className={`h-12 text-base ${formErrors[`sponsor_${idx}_address`] ? "border-red-500 focus:ring-red-500" : ""
                      }`}
                  />
                  {formErrors[`sponsor_${idx}_address`] && <p className="text-red-500 text-xs mt-1">{formErrors[`sponsor_${idx}_address`]}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
