"use client";

import { useEffect, useState } from "react";
import { User, MapPin, CalendarDays } from "lucide-react";
import Input from "../components/ui/Input.jsx";
import DateInput from "../components/ui/DateInput.jsx";

const RequiredIndicator = () => <span className="text-red-500 ml-1">*</span>;
const SectionHeader = ({ title, description }) => (
    <div className="pb-3 border-b border-gray-100">
        <h4 className="text-sm font-medium text-gray-900">{title}</h4>
        {description && (
            <p className="text-xs text-gray-600 mt-1">{description}</p>
        )}
    </div>
);

export default function ConfirmationForm({
    formData,
    setFormData,
    registerValidator,
    formErrors = {},
}) {
    const updateField = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    // --- validator
    useEffect(() => {
        if (!registerValidator) return;

        const validator = () => {
            const errs = {};
            const required = [
                "confirmantName",
                "fatherName",
                "motherName",
                "parishOrigin",
                "baptizedAt",
                "baptizedOn",
                "sponsor1",
                "sponsor2",
            ];
            for (const f of required) {
                if (!formData[f]) errs[f] = "This field is required";
            }
            return Object.keys(errs).length === 0 ? true : errs;
        };

        registerValidator(1, validator);
    }, [formData, registerValidator]);

    return (
        <div className="max-w-4xl mx-auto space-y-6" noValidate>
            {/* Header */}
            <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
                <h3 className="text-base font-medium">
                    Confirmation (Kumpil) Application Form
                </h3>
            </div>

            {/* Confirmation Info */}
            <section className="bg-white rounded-2xl border p-6 space-y-6 border-gray-100">
                <SectionHeader
                    title="Confirmation Information"
                    description="Please fill out this form using PRINTED CAPITAL LETTERS"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-900 mb-1">
                            Ngalan ng Kukumpilan <RequiredIndicator />
                        </label>
                        <Input
                            icon={User}
                            placeholder="Buong Pangalan"
                            value={formData.confirmantName || ""}
                            onChange={(e) => updateField("confirmantName", e.target.value)}
                        />
                        {formErrors.confirmantName && (
                            <p className="text-red-500 text-xs mt-1">
                                {formErrors.confirmantName}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-900 mb-1">
                            Ngalan ng Ama <RequiredIndicator />
                        </label>
                        <Input
                            icon={User}
                            placeholder="Pangalan ng Ama"
                            value={formData.fatherName || ""}
                            onChange={(e) => updateField("fatherName", e.target.value)}
                        />
                        {formErrors.fatherName && (
                            <p className="text-red-500 text-xs mt-1">
                                {formErrors.fatherName}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-900 mb-1">
                            Ngalan ng Ina <RequiredIndicator />
                        </label>
                        <Input
                            icon={User}
                            placeholder="Pangalan ng Ina"
                            value={formData.motherName || ""}
                            onChange={(e) => updateField("motherName", e.target.value)}
                        />
                        {formErrors.motherName && (
                            <p className="text-red-500 text-xs mt-1">
                                {formErrors.motherName}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-900 mb-1">
                            Pinagmulan ng Parokya <RequiredIndicator />
                        </label>
                        <Input
                            icon={MapPin}
                            placeholder="Hal. Sto. Niño Parish, Lipa City"
                            value={formData.parishOrigin || ""}
                            onChange={(e) => updateField("parishOrigin", e.target.value)}
                        />
                        {formErrors.parishOrigin && (
                            <p className="text-red-500 text-xs mt-1">
                                {formErrors.parishOrigin}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-900 mb-1">
                            Biniyagan sa (Lugar) <RequiredIndicator />
                        </label>
                        <Input
                            icon={MapPin}
                            placeholder="Simbahan o Lugar ng Binyag"
                            value={formData.baptizedAt || ""}
                            onChange={(e) => updateField("baptizedAt", e.target.value)}
                        />
                        {formErrors.baptizedAt && (
                            <p className="text-red-500 text-xs mt-1">
                                {formErrors.baptizedAt}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-900 mb-1">
                            Biniyagan noong (Petsa) <RequiredIndicator />
                        </label>
                        <DateInput
                            icon={CalendarDays}
                            value={formData.baptizedOn || ""}
                            onDateChange={(val) => updateField("baptizedOn", val)}
                        />
                        {formErrors.baptizedOn && (
                            <p className="text-red-500 text-xs mt-1">
                                {formErrors.baptizedOn}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-900 mb-1">
                            Sponsor 1 <RequiredIndicator />
                        </label>
                        <Input
                            icon={User}
                            placeholder="Buong Pangalan ng Sponsor 1"
                            value={formData.sponsor1 || ""}
                            onChange={(e) => updateField("sponsor1", e.target.value)}
                        />
                        {formErrors.sponsor1 && (
                            <p className="text-red-500 text-xs mt-1">
                                {formErrors.sponsor1}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-900 mb-1">
                            Sponsor 2 <RequiredIndicator />
                        </label>
                        <Input
                            icon={User}
                            placeholder="Buong Pangalan ng Sponsor 2"
                            value={formData.sponsor2 || ""}
                            onChange={(e) => updateField("sponsor2", e.target.value)}
                        />
                        {formErrors.sponsor2 && (
                            <p className="text-red-500 text-xs mt-1">
                                {formErrors.sponsor2}
                            </p>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}
