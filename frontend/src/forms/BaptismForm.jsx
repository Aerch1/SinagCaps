"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { parseISO, format } from "date-fns";
import { User, Mail, Phone, MapPin, Info, Plus, Trash2, House } from "lucide-react";

import Input from "../components/ui/Input.jsx";
import Dropdown from "../components/ui/Dropdown1.jsx";
import DateInput from "../components/ui/DateInput.jsx";

const RequiredIndicator = () => <span className="text-red-500 ml-1">*</span>;
const SectionHeader = ({ title, description }) => (
    <div className="pb-3 border-b border-gray-100">
        <h4 className="text-sm font-medium text-gray-900">{title}</h4>
        {description && <p className="text-xs text-gray-600 mt-1">{description}</p>}
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
        <div className="max-w-7xl mx-auto space-y-6" noValidate>
            {/* Header */}
            <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
                <h3 className="text-base font-medium">Baptism Application</h3>
                {scheduleLabel && (
                    <span className="inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-800">
                        Selected schedule: {scheduleLabel}
                    </span>
                )}
            </div>

            {/* Child Info */}
            <section className="bg-white rounded-2xl border p-6 space-y-6 border-gray-100">
                <SectionHeader title="Child Information" description="Impormasyon ng Bibinyagan" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    <div
                        ref={
                            formErrors.childFullName && !firstErrorRef.current ? firstErrorRef : null
                        }
                        className="md:col-span-2"
                    >
                        <label className="block text-xs font-medium text-gray-900 mb-1">
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
                            <p className="text-red-500 text-xs mt-1">{formErrors.childFullName}</p>
                        )}
                    </div>

                    <div
                        ref={formErrors.childDob && !firstErrorRef.current ? firstErrorRef : null}
                    >
                        <label className="block text-xs font-medium text-gray-900 mb-1">
                            Date of Birth <RequiredIndicator />
                        </label>
                        <DateInput
                            value={formData.childDob || ""}
                            onDateChange={(val) => updateField("childDob", val)}
                            className={formErrors.childDob ? "border-red-500 focus:ring-red-500" : ""}
                        />
                        {formErrors.childDob && (
                            <p className="text-red-500 text-xs mt-1">{formErrors.childDob}</p>
                        )}
                    </div>

                    <div
                        ref={formErrors.childBirthplace && !firstErrorRef.current ? firstErrorRef : null}
                    >
                        <label className="block text-xs font-medium text-gray-900 mb-1">
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
                            <p className="text-red-500 text-xs mt-1">{formErrors.childBirthplace}</p>
                        )}
                    </div>
                </div>
            </section>

            {/* Parents Info */}
            <section className="bg-white rounded-2xl border p-6 space-y-6 border-gray-100">
                <SectionHeader title="Parents Information" description="Impormasyon ng mga Magulang" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    <div ref={formErrors.fatherName && !firstErrorRef.current ? firstErrorRef : null}>
                        <label className="block text-xs font-medium text-gray-900 mb-1">
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
                            <p className="text-red-500 text-xs mt-1">{formErrors.fatherName}</p>
                        )}
                    </div>

                    <div
                        ref={formErrors.motherMaidenName && !firstErrorRef.current ? firstErrorRef : null}
                    >
                        <label className="block text-xs font-medium text-gray-900 mb-1">
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
                            <p className="text-red-500 text-xs mt-1">{formErrors.motherMaidenName}</p>
                        )}
                    </div>
                </div>

                <div ref={formErrors.parentsMarriageType && !firstErrorRef.current ? firstErrorRef : null}>
                    <p className="text-xs font-medium mb-2">
                        Parents’ Marriage Status <RequiredIndicator />
                    </p>
                    <div className="flex flex-wrap gap-4">
                        {[
                            { v: "church", label: "Church Wedding" },
                            { v: "civil", label: "Civil Wedding" },
                            { v: "unmarried", label: "Not Married" },
                        ].map((opt) => (
                            <label
                                key={opt.v}
                                className={`flex items-center gap-2 rounded-lg border px-4 py-2 cursor-pointer transition ${formData.parentsMarriageType === opt.v
                                    ? "border-blue-400 bg-blue-50"
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
                                <span className="text-sm text-gray-700">{opt.label}</span>
                            </label>
                        ))}
                    </div>
                    {formErrors.parentsMarriageType && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.parentsMarriageType}</p>
                    )}
                </div>
            </section>

            {/* Contact */}
            <section className="bg-white rounded-2xl border p-6 space-y-6 border-gray-100">
                <SectionHeader title="Contact & Address" description="Impormasyon sa Pakikipag-ugnayan" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    <div ref={formErrors.phone && !firstErrorRef.current ? firstErrorRef : null}>
                        <label className="block text-xs font-medium text-gray-900 mb-1">
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
                            <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>
                        )}
                    </div>

                    <div ref={formErrors.email && !firstErrorRef.current ? firstErrorRef : null}>
                        <label className="block text-xs font-medium text-gray-900 mb-1">
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
                            <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
                        )}
                    </div>
                </div>

                <div ref={formErrors.address && !firstErrorRef.current ? firstErrorRef : null}>
                    <label className="block text-xs font-medium text-gray-900 mb-1">
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
                        <p className="text-red-500 text-xs mt-1">{formErrors.address}</p>
                    )}
                </div>
            </section>

            {/* Sponsors */}
            <section className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-sm font-medium text-gray-900">
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
                                    <div className="absolute z-50 left-full ml-2 top-0 w-80 rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-700 shadow-lg">
                                        <p className="font-medium text-gray-900 mb-2">Sponsor Requirements:</p>
                                        <ul className="list-disc list-inside space-y-1 text-gray-600">
                                            <li>Must be at least 16 years old</li>
                                            <li>Two sponsors minimum (1 Ninong + 1 Ninang)</li>
                                            <li>Additional sponsors may incur extra fees</li>
                                            <li>Subject to parish approval</li>
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                        <p className="text-xs text-gray-600">16 taong gulang pataas</p>
                    </div>

                    <button
                        type="button"
                        onClick={addSponsor}
                        className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        Add Sponsor
                    </button>
                </div>

                <div className="space-y-6">
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
                            className="relative rounded-xl border border-gray-200 p-6"
                        >
                            <div className="absolute top-4 right-4">
                                {formData.sponsors.length > 2 && (
                                    <button
                                        type="button"
                                        onClick={() => removeSponsor(idx)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                        title="Remove sponsor"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Role */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-900 mb-2">
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
                                        <p className="text-red-500 text-xs mt-1">{formErrors[`sponsor_${idx}_role`]}</p>
                                    )}
                                </div>

                                {/* Full Name */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-900 mb-2">
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
                                        <p className="text-red-500 text-xs mt-1">{formErrors[`sponsor_${idx}_name`]}</p>
                                    )}
                                </div>

                                {/* Address */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-900 mb-2">
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
                                        <p className="text-red-500 text-xs mt-1">{formErrors[`sponsor_${idx}_address`]}</p>
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
