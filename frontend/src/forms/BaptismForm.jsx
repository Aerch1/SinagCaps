"use client"

import { useEffect, useMemo, useState } from "react"
import { useForm, Controller, useFieldArray } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { parseISO, format } from "date-fns"
import { User, Mail, Phone, MapPin, Info, Plus, Trash2, Locate, House } from "lucide-react"

import Input from "../components/ui/Input.jsx"
import Dropdown from "../components/ui/Dropdown1.jsx"
import DateInput from "../components/ui/DateInput.jsx"/* ---------------------- ZOD SCHEMA ---------------------- */
const SponsorSchema = z.object({
    role: z.enum(["Ninong", "Ninang"], { required_error: "Role is required" }),
    name: z.string().min(1, "Name is required"),
    address: z.string().min(1, "Address is required"),
})

export const BaptismSchema = z.object({
    childFullName: z.string().min(1, "Child's name is required"),
    childDob: z.string().min(1, "Date of birth is required"),
    childBirthplace: z.string().min(1, "Birthplace is required"),
    fatherName: z.string().min(1, "Father's name is required"),
    motherMaidenName: z.string().min(1, "Mother's maiden name is required"),
    parentsMarriageType: z.enum(["church", "civil", "unmarried"], {
        required_error: "Please select a marriage status",
    }),
    phone: z.string().min(1, "Phone is required"),
    email: z.string().email("Invalid email address"),
    address: z.string().min(1, "Address is required"),
    sponsors: z.array(SponsorSchema).min(2, "At least 2 sponsors required"),
})

/* ---------------------- HELPERS ---------------------- */
const RequiredIndicator = () => <span className="text-red-500 ml-1">*</span>

const FieldError = ({ error }) =>
    error ? (
        <p className="mt-1 text-xs text-red-500">{error.message}</p>
    ) : null

const SectionHeader = ({ title, description }) => (
    <div className="pb-3 border-b border-gray-100">
        <h4 className="text-sm font-medium text-gray-900">{title}</h4>
        {description && <p className="text-xs text-gray-600 mt-1">{description}</p>}
    </div>
)

/* ---------------------- COMPONENT ---------------------- */
export default function BaptismForm({ formData, setFormData, registerValidator }) {
    const [showSponsorTip, setShowSponsorTip] = useState(false)

    const {
        control,
        register,
        getValues,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(BaptismSchema),
        defaultValues: {
            childFullName: formData.childFullName || "",
            childDob: formData.childDob || "",
            childBirthplace: formData.childBirthplace || "",
            fatherName: formData.fatherName || "",
            motherMaidenName: formData.motherMaidenName || "",
            parentsMarriageType: formData.parentsMarriageType || "",
            phone: formData.phone || "",
            email: formData.email || "",
            address: formData.address || "",
            sponsors: formData.sponsors || [
                { role: "Ninong", name: "", address: "" },
                { role: "Ninang", name: "", address: "" },
            ],
        },
    })

    const { fields, append, remove } = useFieldArray({ control, name: "sponsors" })

    // Sync with parent
    const syncValues = () => {
        const values = getValues()
        setFormData((prev) => ({ ...prev, ...values }))
    }

    useEffect(() => {
        if (!registerValidator) return
        const validator = () => {
            const values = getValues()
            const result = BaptismSchema.safeParse(values)
            if (!result.success) return false
            syncValues()
            return true
        }
        registerValidator(3, validator)
    }, [registerValidator, getValues])

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

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
                <h3 className="text-base font-medium">Baptism Application</h3>
                {scheduleLabel && (
                    <span className="inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-800">
                        Selected schedule: {scheduleLabel}
                    </span>
                )}
            </div>

            <form className="space-y-6" onChange={syncValues} noValidate>
                {/* Child Info */}
                <section className="bg-white rounded-2xl border p-6 space-y-6">
                    <SectionHeader title="Child Information" description="Impormasyon ng Bibinyagan" />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-900 mb-1">
                                Child&apos;s Full Name <RequiredIndicator />
                            </label>
                            <Input icon={User} placeholder="Juan Dela Cruz" {...register("childFullName")} />
                            <FieldError error={errors.childFullName} />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-900 mb-1">
                                Date of Birth <RequiredIndicator />
                            </label>
                            <DateInput
                                control={control}
                                name="childDob"
                                placeholder="Select date"
                                error={errors.childDob}
                                onDateChange={syncValues}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-900 mb-1">
                                Place of Birth <RequiredIndicator />
                            </label>
                            <Input icon={MapPin} placeholder="City / Hospital / Address" {...register("childBirthplace")} />
                            <FieldError error={errors.childBirthplace} />
                        </div>
                    </div>
                </section>

                {/* Parents Info */}
                <section className="bg-white rounded-2xl border p-6 space-y-6">
                    <SectionHeader title="Parents Information" description="Impormasyon ng mga Magulang" />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-900 mb-1">
                                Father&apos;s Full Name <RequiredIndicator />
                            </label>
                            <Input icon={User} placeholder="Father's complete name" {...register("fatherName")} />
                            <FieldError error={errors.fatherName} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-900 mb-1">
                                Mother&apos;s Maiden Name <RequiredIndicator />
                            </label>
                            <Input icon={User} placeholder="Mother's complete maiden name" {...register("motherMaidenName")} />
                            <FieldError error={errors.motherMaidenName} />
                        </div>
                    </div>

                    <div>
                        <p className="text-xs font-medium mb-2">Parents’ Marriage Status <RequiredIndicator /></p>
                        <div className="flex flex-wrap gap-6">
                            {[
                                { v: "church", label: "Church Wedding" },
                                { v: "civil", label: "Civil Wedding" },
                                { v: "unmarried", label: "Not Married" },
                            ].map((opt) => (
                                <label key={opt.v} className="inline-flex items-center gap-2 text-xs">
                                    <input
                                        type="radio"
                                        value={opt.v}
                                        {...register("parentsMarriageType")}
                                        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                    />
                                    {opt.label}
                                </label>
                            ))}
                        </div>
                        <FieldError error={errors.parentsMarriageType} />
                    </div>
                </section>

                {/* Contact */}
                <section className="bg-white rounded-2xl border p-6 space-y-6">
                    <SectionHeader title="Contact & Address" description="Impormasyon sa Pakikipag-ugnayan" />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-900 mb-1">
                                Contact No. <RequiredIndicator />
                            </label>
                            <Input icon={Phone} type="tel" placeholder="09XXXXXXXXX" {...register("phone")} />
                            <FieldError error={errors.phone} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-900 mb-1">
                                Email <RequiredIndicator />
                            </label>
                            <Input icon={Mail} type="email" placeholder="name@email.com" {...register("email")} />
                            <FieldError error={errors.email} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-900 mb-1">
                            Complete Address <RequiredIndicator />
                        </label>
                        <Input
                            icon={House}
                            placeholder="House No., Street, Barangay, City"
                            {...register("address")}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 "
                        />
                        <FieldError error={errors.address} />
                    </div>
                </section>

                {/* Sponsors */}
                {/* ---------------- Sponsors Section ---------------- */}
                <section className="bg-white rounded-2xl border border-gray-100 p-8">
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
                            onClick={() => append({ role: "Ninong", name: "", address: "" })}
                            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors"
                        >
                            <Plus className="h-4 w-4" />
                            Add Sponsor
                        </button>
                    </div>

                    <div className="space-y-6">
                        {fields.map((field, idx) => (
                            <div key={field.id} className="relative  rounded-xl border border-gray-200 p-6">
                                <div className="absolute top-4 right-4">
                                    {fields.length > 2 && (
                                        <button
                                            type="button"
                                            onClick={() => remove(idx)}
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
                                        <Controller
                                            control={control}
                                            name={`sponsors.${idx}.role`}
                                            render={({ field }) => (
                                                <Dropdown
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    options={["Ninong", "Ninang"]}
                                                    placeholder="Select role"
                                                    className="h-12"
                                                />
                                            )}
                                        />
                                        <FieldError error={errors?.sponsors?.[idx]?.role} />
                                    </div>

                                    {/* Full Name */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-900 mb-2">
                                            Full Name <RequiredIndicator />
                                        </label>
                                        <Input
                                            icon={User}
                                            placeholder="Complete name"
                                            {...register(`sponsors.${idx}.name`)}
                                            className="h-12 text-base"
                                        />
                                        <FieldError error={errors?.sponsors?.[idx]?.name} />
                                    </div>

                                    {/* Address as Input (instead of textarea) */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-900 mb-2">
                                            Address <RequiredIndicator />
                                        </label>
                                        <Input
                                            icon={MapPin}
                                            placeholder="Complete address"
                                            {...register(`sponsors.${idx}.address`)}
                                            className="h-12 text-base"
                                        />
                                        <FieldError error={errors?.sponsors?.[idx]?.address} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <FieldError error={errors.sponsors} />
                </section>

            </form>
        </div>
    )
}
