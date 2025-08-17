"use client"

import { useEffect, useMemo, useState } from "react"
import { parseISO, format } from "date-fns"
import { User, Mail, Phone, MapPin, Info } from "lucide-react"

import Input from "../components/ui/Input.jsx"
import Dropdown from "../components/ui/Dropdown.jsx"

const Req = () => <span className="text-red-500 ml-0.5">*</span>
const FieldError = ({ show, children }) =>
    show && children ? <p className="mt-1 text-xs text-red-500">{children}</p> : null

export default function BaptismForm({ formData, setFormData, registerValidator }) {
    const [showSponsorTip, setShowSponsorTip] = useState(false)
    const hasExtraSponsors = (formData.sponsors?.length || 0) > 2

    // validation state
    const [errors, setErrors] = useState({})
    const [showErrors, setShowErrors] = useState(false) // shown after Next

    const clearAllErrors = () => {
        setShowErrors(false)
        setErrors({})
    }

    // Selected schedule chip label (from previous steps)
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

    // Ensure default sponsors
    useEffect(() => {
        if (!Array.isArray(formData.sponsors)) {
            setFormData((p) => ({
                ...p,
                sponsors: [
                    { role: "Ninong", name: "", address: "" },
                    { role: "Ninang", name: "", address: "" },
                ],
            }))
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Build errors for current data
    const buildErrors = () => {
        const e = {}
        // child
        if (!formData.childFullName) e.childFullName = "This field is required."
        if (!formData.childDob) e.childDob = "This field is required."
        if (!formData.childBirthplace) e.childBirthplace = "This field is required."
        // parents
        if (!formData.fatherName) e.fatherName = "This field is required."
        if (!formData.motherMaidenName) e.motherMaidenName = "This field is required."
        if (!formData.parentsMarriageType) e.parentsMarriageType = "Please select a status."
        // contact
        if (!formData.phone) e.phone = "This field is required."
        if (!formData.email) e.email = "This field is required."
        if (!formData.address)
            e.address = "This field is required."
                // sponsors
                ; (formData.sponsors || []).forEach((s, i) => {
                    if (!s.role) e[`sponsorRole_${i}`] = "Required."
                    if (!s.name) e[`sponsorName_${i}`] = "Required."
                    if (!s.address) e[`sponsorAddress_${i}`] = "Required."
                })
        return e
    }

    // Validator for the parent
    useEffect(() => {
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
        if (showErrors) clearAllErrors() // requested: clicking any input hides all errors
    }

    // Sponsor helpers
    const addSponsor = () =>
        setFormData((p) => {
            const nextRole = (p.sponsors || []).length % 2 === 0 ? "Ninong" : "Ninang"
            return { ...p, sponsors: [...(p.sponsors || []), { role: nextRole, name: "", address: "" }] }
        })

    const removeSponsor = (idx) =>
        setFormData((p) => ({ ...p, sponsors: (p.sponsors || []).filter((_, i) => i !== idx) }))

    const updateSponsor = (idx, field, value) =>
        setFormData((p) => {
            const next = [...(p.sponsors || [])]
            next[idx] = { ...next[idx], [field]: value }
            return { ...p, sponsors: next }
        })

    return (
        <div className="space-y-10">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <h3 className="text-lg font-medium">Baptism Details (Binyag)</h3>
                {scheduleLabel ? (
                    <span className="inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-800">
                        Selected schedule: {scheduleLabel}
                    </span>
                ) : null}
            </div>

            {/* Child info */}
            <section className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-900">Child Information</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Full name */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                            Pangalan ng Bibinyagan (Child&apos;s Full Name) <Req />
                        </label>
                        <Input
                            icon={User}
                            variant="light"
                            name="childFullName"
                            value={formData.childFullName || ""}
                            onChange={handleChange}
                            onFocus={clearAllErrors}
                            placeholder="Juan Dela Cruz"
                            autoComplete="name"
                        />
                        <FieldError show={showErrors}>{errors.childFullName}</FieldError>
                    </div>

                    {/* Date of birth — native date input */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                            Petsa ng Kapanganakan (Date of Birth) <Req />
                        </label>
                        <Input
                            icon={User}
                            variant="light"
                            type="date"
                            name="childDob"
                            value={formData.childDob || ""}
                            onChange={handleChange}
                            onFocus={clearAllErrors}
                            placeholder="YYYY-MM-DD"
                            max={new Date().toISOString().slice(0, 10)}
                        />
                        <FieldError show={showErrors}>{errors.childDob}</FieldError>
                    </div>

                    {/* Birthplace */}
                    <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                            Lugar ng Kapanganakan (Place of Birth) <Req />
                        </label>
                        <Input
                            icon={MapPin}
                            variant="light"
                            name="childBirthplace"
                            value={formData.childBirthplace || ""}
                            onChange={handleChange}
                            onFocus={clearAllErrors}
                            placeholder="City / Hospital / Address"
                        />
                        <FieldError show={showErrors}>{errors.childBirthplace}</FieldError>
                    </div>
                </div>
            </section>

            {/* Parents */}
            <section className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-900">Parents</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Father */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                            Pangalan ng Ama (Father&apos;s Name) <Req />
                        </label>
                        <Input
                            icon={User}
                            variant="light"
                            name="fatherName"
                            value={formData.fatherName || ""}
                            onChange={handleChange}
                            onFocus={clearAllErrors}
                            placeholder="Full Name"
                            autoComplete="name"
                        />
                        <FieldError show={showErrors}>{errors.fatherName}</FieldError>
                    </div>

                    {/* Mother maiden name */}
                    <div>
                        <label htmlFor="motherMaidenName" className="block text-xs font-medium text-gray-700 mb-1">
                            Pangalan ng Ina (noong dalaga) / Mother&apos;s Maiden Name <Req />
                        </label>
                        <Input
                            id="motherMaidenName"
                            icon={User}
                            variant="light"
                            name="motherMaidenName"
                            value={formData.motherMaidenName || ""}
                            onChange={handleChange}
                            onFocus={clearAllErrors}
                            placeholder="Full Maiden Name"
                            autoComplete="name"
                        />
                        <FieldError show={showErrors}>{errors.motherMaidenName}</FieldError>
                    </div>
                </div>

                {/* Parents marriage status */}
                <div className="pt-2">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                        Katayuan ng Magulang (Parents’ Marriage Status) <Req />
                    </p>
                    <div className="flex flex-wrap gap-4">
                        {[
                            { v: "church", label: "Simbahan (Church)" },
                            { v: "civil", label: "Civil" },
                            { v: "unmarried", label: "Hindi Kasal (Not Married)" },
                        ].map((opt) => (
                            <label key={opt.v} className="inline-flex items-center gap-2 text-sm text-gray-700">
                                <input
                                    type="radio"
                                    name="parentsMarriageType"
                                    value={opt.v}
                                    checked={(formData.parentsMarriageType || "") === opt.v}
                                    onChange={handleChange}
                                    onFocus={clearAllErrors}
                                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                />
                                {opt.label}
                            </label>
                        ))}
                    </div>
                    <FieldError show={showErrors}>{errors.parentsMarriageType}</FieldError>
                </div>
            </section>

            {/* Contact & Address */}
            <section className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-900">Contact & Address</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                            Contact No. <Req />
                        </label>
                        <Input
                            icon={Phone}
                            variant="light"
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            onFocus={clearAllErrors}
                            placeholder="09XXXXXXXXX"
                            autoComplete="tel"
                        />
                        <FieldError show={showErrors}>{errors.phone}</FieldError>
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
                            placeholder="name@email.com"
                            autoComplete="email"
                        />
                        <FieldError show={showErrors}>{errors.email}</FieldError>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                        Tirahan / Address <Req />
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
                            aria-invalid={!!errors.address}
                        />
                    </div>
                    <FieldError show={showErrors}>{errors.address}</FieldError>
                </div>
            </section>

            {/* Sponsors */}
            <section className="space-y-4">
                <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-gray-900">
                        Sponsors (Ninong/Ninang, 16 years old pataas) <Req />
                    </h4>

                    {/* Info icon tooltip */}
                    <div
                        className="relative inline-flex"
                        onMouseEnter={() => setShowSponsorTip(true)}
                        onMouseLeave={() => setShowSponsorTip(false)}
                    >
                        <button
                            type="button"
                            onClick={() => setShowSponsorTip((s) => !s)}
                            className="p-1 rounded-full text-gray-500 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                            aria-label="Sponsor information"
                        >
                            <Info className="h-4 w-4" />
                        </button>
                        {showSponsorTip && (
                            <div className="absolute z-50 mt-2 w-64 rounded-md border border-gray-200 bg-white p-3 text-xs text-gray-700 shadow-md">
                                Two sponsors (1 Ninong + 1 Ninang) are included. Adding more sponsors may have an additional fee and is
                                subject to parish approval.
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    {(formData.sponsors || []).map((s, idx) => (
                        <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-x-4 gap-y-2 md:items-center">
                            {/* Role */}
                            <div className="md:col-span-3 -mt-4.5">
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Role <Req />
                                </label>
                                <Dropdown
                                    value={s.role}
                                    onOpen={clearAllErrors}
                                    onChange={(val) => {
                                        updateSponsor(idx, "role", val)
                                        if (showErrors) clearAllErrors()
                                    }}
                                    options={["Ninong", "Ninang"]}
                                    placeholder="Select role"
                                />
                                <FieldError show={showErrors}>{errors[`sponsorRole_${idx}`]}</FieldError>
                            </div>

                            {/* Name */}
                            <div className="md:col-span-4">
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Name <Req />
                                </label>
                                <Input
                                    icon={User}
                                    variant="light"
                                    name={`sponsorName_${idx}`}
                                    value={s.name}
                                    onChange={(e) => {
                                        updateSponsor(idx, "name", e.target.value)
                                        if (showErrors) clearAllErrors()
                                    }}
                                    onFocus={clearAllErrors}
                                    placeholder="Full Name"
                                />
                                <FieldError show={showErrors}>{errors[`sponsorName_${idx}`]}</FieldError>
                            </div>

                            {/* Address */}
                            <div className="md:col-span-4">
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Address <Req />
                                </label>
                                <Input
                                    icon={MapPin}
                                    variant="light"
                                    name={`sponsorAddress_${idx}`}
                                    value={s.address}
                                    onChange={(e) => {
                                        updateSponsor(idx, "address", e.target.value)
                                        if (showErrors) clearAllErrors()
                                    }}
                                    onFocus={clearAllErrors}
                                    placeholder="Address"
                                />
                                <FieldError show={showErrors}>{errors[`sponsorAddress_${idx}`]}</FieldError>
                            </div>

                            {/* Remove */}
                            <div className="md:col-span-1 flex md:justify-end">
                                <button
                                    type="button"
                                    onClick={() => removeSponsor(idx)}
                                    className="px-3 h-11 text-xs rounded-md text-gray-600 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 flex items-center"
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    ))}

                    {hasExtraSponsors && (
                        <p className="text-xs text-red-500">
                            Adding more than two sponsors may incur an additional fee. Please confirm with the parish office.
                        </p>
                    )}

                    <button
                        type="button"
                        onClick={addSponsor}
                        className="px-4 py-2 text-sm rounded-md text-gray-700 hover:bg-gray-50 border border-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                    >
                        + Add Sponsor
                    </button>
                </div>
            </section>
        </div>
    )
}
