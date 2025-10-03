"use client";

import { useEffect, useMemo } from "react";
import { parseISO, format } from "date-fns";
import { User, Mail, Phone, MapPin } from "lucide-react";

import Input from "../components/ui/Input";

const Req = () => <span className="text-red-500 ml-0.5">*</span>;

export default function DefaultForm({ formData, setFormData, registerValidator }) {
    const updateField = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    // Step validation
    useEffect(() => {
        if (!registerValidator) return;
        const validator = () => {
            const required = ["firstName", "lastName", "email", "phone", "address", "purpose"];
            for (const f of required) {
                if (!formData[f]) return false;
            }
            return true;
        };
        registerValidator(3, validator);
    }, [formData, registerValidator]);

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

    return (
        <div className="space-y-8" noValidate>
            <div className="flex items-center justify-between flex-wrap gap-3">
                <h3 className="text-lg font-medium">Personal Information & Details</h3>
                {scheduleLabel && (
                    <span className="inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-800">
                        Selected schedule: {scheduleLabel}
                    </span>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                        First Name <Req />
                    </label>
                    <Input
                        icon={User}
                        placeholder="First Name"
                        autoComplete="given-name"
                        value={formData.firstName || ""}
                        onChange={(e) => updateField("firstName", e.target.value)}
                    />
                </div>

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
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                        Email <Req />
                    </label>
                    <Input
                        icon={Mail}
                        type="email"
                        placeholder="Email"
                        autoComplete="email"
                        value={formData.email || ""}
                        onChange={(e) => updateField("email", e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                        Phone <Req />
                    </label>
                    <Input
                        icon={Phone}
                        type="tel"
                        placeholder="Phone"
                        autoComplete="tel"
                        value={formData.phone || ""}
                        onChange={(e) => updateField("phone", e.target.value)}
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address <Req />
                </label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-start pt-2 pl-3 pointer-events-none">
                        <MapPin className="size-5 text-gray-400" />
                    </div>
                    <textarea
                        rows={3}
                        placeholder="Complete Address"
                        className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300"
                        value={formData.address || ""}
                        onChange={(e) => updateField("address", e.target.value)}
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Purpose / Reason <Req />
                </label>
                <textarea
                    rows="3"
                    placeholder="Briefly describe why you’re booking"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300"
                    value={formData.purpose || ""}
                    onChange={(e) => updateField("purpose", e.target.value)}
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                <textarea
                    rows="3"
                    placeholder="Anything else we should know?"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300"
                    value={formData.additionalNotes || ""}
                    onChange={(e) => updateField("additionalNotes", e.target.value)}
                />
            </div>
        </div>
    );
}
