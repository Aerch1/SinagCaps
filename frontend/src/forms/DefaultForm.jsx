"use client"

import { useMemo, useState } from "react"
import { parseISO, format } from "date-fns"
import { User, Mail, Phone, MapPin } from "lucide-react"
import Input from "../components/ui/Input"

const Req = () => <span className="text-red-500 ml-0.5">*</span>
const FieldError = ({ show, children }) =>
    show && children ? <p className="mt-1 text-xs text-red-500">{children}</p> : null

export default function DefaultForm({ formData, setFormData, registerValidator }) {
    const [errors, setErrors] = useState({})
    const [showErrors, setShowErrors] = useState(false)

    const clearAllErrors = () => {
        setShowErrors(false)
        setErrors({})
    }

    const scheduleLabel = useMemo(() => {
        if (!formData.preferredDate) return ""
        try {
            const d = parseISO(formData.preferredDate)
            const dateStr = format(d, "EEE, MMM d, yyyy")
            return formData.preferredTime ? `${dateStr} • ${formData.preferredTime}` : dateStr
        } catch {
            return formData.preferredDate
        }
    }, [formData.preferredDate, formData.preferredTime])

    const buildErrors = () => {
        const e = {}
        if (!formData.firstName) e.firstName = "This field is required."
        if (!formData.lastName) e.lastName = "This field is required."
        if (!formData.email) e.email = "This field is required."
        if (!formData.phone) e.phone = "This field is required."
        if (!formData.address) e.address = "This field is required."
        if (!formData.purpose) e.purpose = "This field is required."
        return e
    }

    // register validator
    useState(() => {
        if (!registerValidator) return
        const validator = () => {
            const e = buildErrors()
            setErrors(e)
            setShowErrors(true)
            return Object.keys(e).length === 0
        }
        registerValidator(3, validator)
    }, [registerValidator, formData])

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        const v = type === "checkbox" ? checked : value
        setFormData((p) => ({ ...p, [name]: v }))
        if (showErrors) clearAllErrors()
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <h3 className="text-lg font-medium">Personal Information & Details</h3>
                {scheduleLabel ? (
                    <span className="inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-800">
                        Selected schedule: {scheduleLabel}
                    </span>
                ) : null}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                        First Name <Req />
                    </label>
                    <Input
                        icon={User}
                        variant="light"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        onFocus={clearAllErrors}
                        placeholder="First Name"
                        autoComplete="given-name"
                    />
                    <FieldError show={showErrors}>{errors.firstName}</FieldError>
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                        Last Name <Req />
                    </label>
                    <Input
                        icon={User}
                        variant="light"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        onFocus={clearAllErrors}
                        placeholder="Last Name"
                        autoComplete="family-name"
                    />
                    <FieldError show={showErrors}>{errors.lastName}</FieldError>
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                        Email <Req />
                    </label>
                    <Input
                        icon={Mail}
                        variant="light"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        onFocus={clearAllErrors}
                        placeholder="Email"
                        autoComplete="email"
                    />
                    <FieldError show={showErrors}>{errors.email}</FieldError>
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                        Phone <Req />
                    </label>
                    <Input
                        icon={Phone}
                        variant="light"
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        onFocus={clearAllErrors}
                        placeholder="Phone"
                        autoComplete="tel"
                    />
                    <FieldError show={showErrors}>{errors.phone}</FieldError>
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
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        onFocus={clearAllErrors}
                        placeholder="Complete Address"
                        className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 outline-none transition duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
                    />
                </div>
                <FieldError show={showErrors}>{errors.address}</FieldError>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Purpose / Reason <Req />
                </label>
                <textarea
                    name="purpose"
                    rows="3"
                    value={formData.purpose}
                    onChange={handleChange}
                    onFocus={clearAllErrors}
                    placeholder="Briefly describe why you’re booking"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 outline-none transition duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
                />
                <FieldError show={showErrors}>{errors.purpose}</FieldError>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                <textarea
                    name="additionalNotes"
                    rows="3"
                    value={formData.additionalNotes}
                    onChange={handleChange}
                    onFocus={clearAllErrors}
                    placeholder="Anything else we should know?"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 outline-none transition duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
                />
            </div>
        </div>
    )
}
