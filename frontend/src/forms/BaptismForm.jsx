"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { parseISO, format } from "date-fns";
import { User, Mail, Phone, MapPin, Info, Plus, Trash2, House } from "lucide-react";

import Input from "../components/ui/Input.jsx";
import Dropdown from "../components/ui/Dropdown1.jsx";
import DateInput from "../components/ui/DateInput.jsx";
import api from "@/api/api";


const RequiredIndicator = () => <span className="text-red-500 ml-1">*</span>;
const SectionHeader = ({ title, description }) => (
    <div className="pb-4 border-b border-gray-200">
        <h4 className="text-base font-semibold text-gray-900">{title}</h4>
        {description && <p className="text-sm text-gray-600 mt-1.5">{description}</p>}
    </div>
);

export default function BaptismForm({ formData, setFormData, registerValidator, formErrors = {} }) {
    const [showSponsorTip, setShowSponsorTip] = useState(false);
    const firstErrorRef = useRef(null);

    // ---------- Initialize sponsors ----------
    useEffect(() => {
        if (!formData.sponsors) {
            setFormData((prev) => ({
                ...prev,
                sponsors: [
                    { role: "Ninong", name: "", address: "" },
                    { role: "Ninang", name: "", address: "" },
                ],
            }));
        }
    }, []);


    const [loadingUser, setLoadingUser] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const { data } = await api.get("/auth/check-auth"); // ✅ backend route
                if (data?.user) {
                    setFormData((prev) => ({
                        ...prev,
                        fatherName: prev.fatherName || data.user.name || "",
                        email: prev.email || data.user.email || "",
                        phone: prev.phone || data.user.phone || "",
                        address: prev.address || data.user.location || "",
                    }));
                }
            } catch {
                // not logged in — ignore
            } finally {
                setLoadingUser(false);
            }
        };
        fetchUser();
    }, [setFormData]);



    // ---------- Update helpers ----------
    const updateField = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));
    const updateSponsor = (idx, field, value) => {
        const sponsors = [...(formData.sponsors || [])];
        sponsors[idx][field] = value;
        setFormData((prev) => ({ ...prev, sponsors }));
    };

    // ---------- Sanitize before sending ----------
    const sanitizeFormData = (data) => {
        const clean = { ...data };
        Object.keys(clean).forEach((key) => {
            if (typeof clean[key] === "string") clean[key] = clean[key].trim();
        });
        if (Array.isArray(clean.sponsors)) {
            clean.sponsors = clean.sponsors.map((s) => ({
                ...s,
                role: s.role?.trim(),
                name: s.name?.trim(),
                address: s.address?.trim(),
            }));
        }
        return clean;
    };

    const addSponsor = () => {
        setFormData((prev) => ({
            ...prev,
            sponsors: [...(prev.sponsors || []), { role: "Ninong", name: "", address: "" }],
        }));
    };

    const removeSponsor = (idx) => {
        setFormData((prev) => ({
            ...prev,
            sponsors: (prev.sponsors || []).filter((_, i) => i !== idx),
        }));
    };

    // ======================================================
    // ✅ Validation (Scroll + Highlight)
    // ======================================================
    useEffect(() => {
        if (!registerValidator) return;

        const validator = () => {
            const cleaned = sanitizeFormData(formData);
            const errs = {};
            const requiredFields = [
                "childFullName",
                "childDob",
                "childBirthplace",
                "fatherName",
                "motherMaidenName",
                "parentsMarriageType",
                "phone",
                "email",
                "address",
            ];

            for (const f of requiredFields) {
                if (!cleaned[f]?.toString().trim()) errs[f] = "This field is required.";
            }

            const phoneRegex = /^09\d{9}$/;
            if (cleaned.phone && !phoneRegex.test(cleaned.phone)) {
                errs.phone = "Phone must start with 09 and be 11 digits.";
            }

            const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
            if (cleaned.email && !emailRegex.test(cleaned.email)) {
                errs.email = "Email must be a valid @gmail.com address.";
            }

            if (!cleaned.sponsors || cleaned.sponsors.length < 2) {
                errs.sponsors = "At least 2 sponsors are required.";
            } else {
                cleaned.sponsors.forEach((s, idx) => {
                    if (!s.role) errs[`sponsor_${idx}_role`] = "Role is required.";
                    if (!s.name) errs[`sponsor_${idx}_name`] = "Name is required.";
                    if (!s.address) errs[`sponsor_${idx}_address`] = "Address is required.";
                });
            }

            // Scroll to first error
            if (Object.keys(errs).length > 0 && firstErrorRef.current) {
                firstErrorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
            }

            return Object.keys(errs).length === 0 ? true : errs;
        };

        registerValidator(3, validator);
    }, [formData, registerValidator]);

    // ---------- Schedule Label ----------
    const scheduleLabel = useMemo(() => {
        if (!formData.preferredDate) return "";
        try {
            const d = parseISO(formData.preferredDate);
            const dateStr = format(d, "EEE, MMM d, yyyy");
            return formData.preferredTime ? `${dateStr} • ${formData.preferredTime}` : dateStr;
        } catch {
            return formData.preferredDate;
        }
    }, [formData.preferredDate, formData.preferredTime]);

    // ======================================================
    // 🧱 UI Layout
    // ======================================================
    return (
        <div className="w-full space-y-8 px-2 sm:px-2 lg:px-3" noValidate>
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4 pb-4">
                <h3 className="text-lg font-semibold text-gray-900">Baptism Application</h3>
                {(formData.serviceName || scheduleLabel) && (
                    <span className="inline-flex items-center rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-800">
                        Selected:{" "}
                        {formData.serviceName ? `${formData.serviceName}` : "—"}
                        {scheduleLabel ? ` • ${scheduleLabel}` : ""}
                    </span>
                )}
            </div>

            {/* Child Info */}
            <section className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 lg:p-8 space-y-6 shadow-sm">
                <SectionHeader title="Child Information" description="Impormasyon ng Bibinyagan" />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6 pt-2">
                    <div
                        ref={
                            formErrors.childFullName && !firstErrorRef.current ? firstErrorRef : null
                        }
                        className="lg:col-span-2"
                    >
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                            Child&apos;s Full Name <RequiredIndicator />
                        </label>
                        <Input
                            icon={User}
                            placeholder="Juan Dela Cruz"
                            value={formData.childFullName || ""}
                            onChange={(e) => updateField("childFullName", e.target.value)}
                            className={formErrors.childFullName ? "border-red-500 focus:ring-red-500" : ""}
                        />
                        {formErrors.childFullName && (
                            <p className="text-red-500 text-xs mt-1.5">{formErrors.childFullName}</p>
                        )}
                    </div>

                    <div
                        ref={formErrors.childDob && !firstErrorRef.current ? firstErrorRef : null}
                    >
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                            Date of Birth <RequiredIndicator />
                        </label>
                        <DateInput
                            value={formData.childDob || ""}
                            onDateChange={(val) => updateField("childDob", val)}
                            className={formErrors.childDob ? "border-red-500 focus:ring-red-500" : ""}
                        />
                        {formErrors.childDob && (
                            <p className="text-red-500 text-xs mt-1.5">{formErrors.childDob}</p>
                        )}
                    </div>

                    <div
                        ref={formErrors.childBirthplace && !firstErrorRef.current ? firstErrorRef : null}
                    >
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                            Place of Birth <RequiredIndicator />
                        </label>
                        <Input
                            icon={MapPin}
                            placeholder="City / Hospital / Address"
                            value={formData.childBirthplace || ""}
                            onChange={(e) => updateField("childBirthplace", e.target.value)}
                            className={formErrors.childBirthplace ? "border-red-500 focus:ring-red-500" : ""}
                        />
                        {formErrors.childBirthplace && (
                            <p className="text-red-500 text-xs mt-1.5">{formErrors.childBirthplace}</p>
                        )}
                    </div>
                </div>
            </section>

            {/* Parents Info */}
            <section className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 lg:p-8 space-y-6 shadow-sm">
                <SectionHeader title="Parents Information" description="Impormasyon ng mga Magulang" />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6 pt-2">
                    <div ref={formErrors.fatherName && !firstErrorRef.current ? firstErrorRef : null}>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                            Father&apos;s Full Name <RequiredIndicator />
                        </label>
                        <Input
                            icon={User}
                            placeholder="Father's complete name"
                            value={formData.fatherName || ""}
                            onChange={(e) => updateField("fatherName", e.target.value)}
                            className={formErrors.fatherName ? "border-red-500 focus:ring-red-500" : ""}
                        />
                        {formErrors.fatherName && (
                            <p className="text-red-500 text-xs mt-1.5">{formErrors.fatherName}</p>
                        )}
                    </div>

                    <div
                        ref={formErrors.motherMaidenName && !firstErrorRef.current ? firstErrorRef : null}
                    >
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                            Mother&apos;s Maiden Name <RequiredIndicator />
                        </label>
                        <Input
                            icon={User}
                            placeholder="Mother's complete maiden name"
                            value={formData.motherMaidenName || ""}
                            onChange={(e) => updateField("motherMaidenName", e.target.value)}
                            className={formErrors.motherMaidenName ? "border-red-500 focus:ring-red-500" : ""}
                        />
                        {formErrors.motherMaidenName && (
                            <p className="text-red-500 text-xs mt-1.5">{formErrors.motherMaidenName}</p>
                        )}
                    </div>
                </div>

                <div ref={formErrors.parentsMarriageType && !firstErrorRef.current ? firstErrorRef : null} className="pt-2">
                    <p className="text-sm font-medium text-gray-900 mb-3">
                        Parents' Marriage Status <RequiredIndicator />
                    </p>
                    <div className="flex flex-wrap gap-3">
                        {[
                            { v: "church", label: "Church Wedding" },
                            { v: "civil", label: "Civil Wedding" },
                            { v: "unmarried", label: "Not Married" },
                        ].map((opt) => (
                            <label
                                key={opt.v}
                                className={`flex items-center gap-2.5 rounded-lg border px-4 py-3 cursor-pointer transition-all ${formData.parentsMarriageType === opt.v
                                    ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                                    : "border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                                    }`}
                            >
                                <input
                                    type="radio"
                                    value={opt.v}
                                    checked={formData.parentsMarriageType === opt.v}
                                    onChange={(e) =>
                                        updateField("parentsMarriageType", e.target.value)
                                    }
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                />
                                <span className="text-sm font-medium text-gray-700">{opt.label}</span>
                            </label>
                        ))}
                    </div>
                    {formErrors.parentsMarriageType && (
                        <p className="text-red-500 text-xs mt-2">{formErrors.parentsMarriageType}</p>
                    )}
                </div>
            </section>

            {/* Contact */}
            <section className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 lg:p-8 space-y-6 shadow-sm">
                <SectionHeader title="Contact & Address" description="Impormasyon sa Pakikipag-ugnayan" />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6 pt-2">
                    <div ref={formErrors.phone && !firstErrorRef.current ? firstErrorRef : null}>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                            Contact No. <RequiredIndicator />
                        </label>
                        <Input
                            icon={Phone}
                            type="tel"
                            placeholder="09XXXXXXXXX"
                            value={formData.phone || ""}
                            onChange={(e) => updateField("phone", e.target.value)}
                            className={formErrors.phone ? "border-red-500 focus:ring-red-500" : ""}
                        />
                        {formErrors.phone && (
                            <p className="text-red-500 text-xs mt-1.5">{formErrors.phone}</p>
                        )}
                    </div>

                    <div ref={formErrors.email && !firstErrorRef.current ? firstErrorRef : null}>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                            Email <RequiredIndicator />
                        </label>
                        <Input
                            icon={Mail}
                            type="email"
                            placeholder="name@gmail.com"
                            value={formData.email || ""}
                            onChange={(e) => updateField("email", e.target.value)}
                            className={formErrors.email ? "border-red-500 focus:ring-red-500" : ""}
                        />
                        {formErrors.email && (
                            <p className="text-red-500 text-xs mt-1.5">{formErrors.email}</p>
                        )}
                    </div>
                </div>

                <div ref={formErrors.address && !firstErrorRef.current ? firstErrorRef : null}>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                        Complete Address <RequiredIndicator />
                    </label>
                    <Input
                        icon={House}
                        placeholder="House No., Street, Barangay, City"
                        value={formData.address || ""}
                        onChange={(e) => updateField("address", e.target.value)}
                        className={formErrors.address ? "border-red-500 focus:ring-red-500" : ""}
                    />
                    {formErrors.address && (
                        <p className="text-red-500 text-xs mt-1.5">{formErrors.address}</p>
                    )}
                </div>
            </section>

            {/* Sponsors */}
            <section className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 lg:p-8 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-base font-semibold text-gray-900">
                                Sponsors (Ninong/Ninang) <RequiredIndicator />
                            </h4>
                            <div
                                className="relative"
                                onMouseEnter={() => setShowSponsorTip(true)}
                                onMouseLeave={() => setShowSponsorTip(false)}
                            >
                                <button
                                    type="button"
                                    onClick={() => setShowSponsorTip((s) => !s)}
                                    className="p-1.5 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                                >
                                    <Info className="h-4 w-4" />
                                </button>
                                {showSponsorTip && (
                                    <div className="absolute z-50 left-0 sm:left-full sm:ml-2 top-full sm:top-0 mt-2 sm:mt-0 w-72 sm:w-80 rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-700 shadow-xl">
                                        <p className="font-semibold text-gray-900 mb-2">Sponsor Requirements:</p>
                                        <ul className="list-disc list-inside space-y-1.5 text-gray-600">
                                            <li>Must be at least 16 years old</li>
                                            <li>Two sponsors minimum (1 Ninong + 1 Ninang)</li>
                                            <li>Additional sponsors may incur extra fees</li>
                                            <li>Subject to parish approval</li>
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                        <p className="text-sm text-gray-600">16 taong gulang pataas</p>
                    </div>

                    <button
                        type="button"
                        onClick={addSponsor}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors whitespace-nowrap"
                    >
                        <Plus className="h-4 w-4" />
                        Add Sponsor
                    </button>
                </div>

                <div className="space-y-5">
                    {(formData.sponsors || []).map((s, idx) => (
                        <div
                            key={idx}
                            ref={
                                (formErrors[`sponsor_${idx}_role`] ||
                                    formErrors[`sponsor_${idx}_name`] ||
                                    formErrors[`sponsor_${idx}_address`]) &&
                                    !firstErrorRef.current
                                    ? firstErrorRef
                                    : null
                            }
                            className="relative rounded-xl border border-gray-200 p-5 sm:p-6 bg-gray-50"
                        >
                            {formData.sponsors.length > 2 && (
                                <div className="absolute top-4 right-4">
                                    <button
                                        type="button"
                                        onClick={() => removeSponsor(idx)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                        title="Remove sponsor"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5 pr-10 sm:pr-0">
                                {/* Role */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-2">
                                        Role <RequiredIndicator />
                                    </label>
                                    <Dropdown
                                        value={s.role}
                                        onChange={(val) => updateSponsor(idx, "role", val)}
                                        options={["Ninong", "Ninang"]}
                                        placeholder="Select role"
                                        className={`h-12 ${formErrors[`sponsor_${idx}_role`] ? "border-red-500 focus:ring-red-500" : ""}`}
                                    />
                                    {formErrors[`sponsor_${idx}_role`] && (
                                        <p className="text-red-500 text-xs mt-1.5">{formErrors[`sponsor_${idx}_role`]}</p>
                                    )}
                                </div>

                                {/* Full Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-2">
                                        Full Name <RequiredIndicator />
                                    </label>
                                    <Input
                                        icon={User}
                                        placeholder="Complete name"
                                        value={s.name}
                                        onChange={(e) => updateSponsor(idx, "name", e.target.value)}
                                        className={`h-12 text-base ${formErrors[`sponsor_${idx}_name`] ? "border-red-500 focus:ring-red-500" : ""}`}
                                    />
                                    {formErrors[`sponsor_${idx}_name`] && (
                                        <p className="text-red-500 text-xs mt-1.5">{formErrors[`sponsor_${idx}_name`]}</p>
                                    )}
                                </div>

                                {/* Address */}
                                <div className="sm:col-span-2 lg:col-span-1">
                                    <label className="block text-sm font-medium text-gray-900 mb-2">
                                        Address <RequiredIndicator />
                                    </label>
                                    <Input
                                        icon={MapPin}
                                        placeholder="Complete address"
                                        value={s.address}
                                        onChange={(e) => updateSponsor(idx, "address", e.target.value)}
                                        className={`h-12 text-base ${formErrors[`sponsor_${idx}_address`] ? "border-red-500 focus:ring-red-500" : ""}`}
                                    />
                                    {formErrors[`sponsor_${idx}_address`] && (
                                        <p className="text-red-500 text-xs mt-1.5">{formErrors[`sponsor_${idx}_address`]}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}