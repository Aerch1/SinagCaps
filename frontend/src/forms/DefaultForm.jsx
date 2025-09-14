"use client"

import { useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { parseISO, format } from "date-fns"
import { User, Mail, Phone, MapPin } from "lucide-react"

import Input from "../components/ui/Input"

const Req = () => <span className="text-red-500 ml-0.5">*</span>
const FieldError = ({ error }) =>
    error ? <p className="mt-1 text-xs text-red-500">{error.message}</p> : null

/* ---------------------- ZOD SCHEMA ---------------------- */
export const DefaultSchema = z.object({
    firstName: z.string().min(1, "First name is required."),
    lastName: z.string().min(1, "Last name is required."),
    email: z.string().email("Invalid email address."),
    phone: z.string().min(1, "Phone is required."),
    address: z.string().min(1, "Address is required."),
    purpose: z.string().min(1, "Purpose is required."),
    additionalNotes: z.string().optional(),
})

/* ---------------------- COMPONENT ---------------------- */
export default function DefaultForm({ formData, setFormData, registerValidator }) {
    const {
        register,
        formState: { errors },
        getValues,
    } = useForm({
        resolver: zodResolver(DefaultSchema),
        defaultValues: {
            firstName: formData.firstName || "",
            lastName: formData.lastName || "",
            email: formData.email || "",
            phone: formData.phone || "",
            address: formData.address || "",
            purpose: formData.purpose || "",
            additionalNotes: formData.additionalNotes || "",
        },
    })

    // Sync to parent state
    const syncValues = () => {
        const values = getValues()
        setFormData((prev) => ({ ...prev, ...values }))
    }

    // Register validator for Step 3
    useEffect(() => {
        if (!registerValidator) return
        const validator = () => {
            const values = getValues()
            const result = DefaultSchema.safeParse(values)
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
        <form className="space-y-8" onChange={syncValues} noValidate>
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
                    <Input icon={User} placeholder="First Name" autoComplete="given-name" {...register("firstName")} />
                    <FieldError error={errors.firstName} />
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                        Last Name <Req />
                    </label>
                    <Input icon={User} placeholder="Last Name" autoComplete="family-name" {...register("lastName")} />
                    <FieldError error={errors.lastName} />
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                        Email <Req />
                    </label>
                    <Input icon={Mail} type="email" placeholder="Email" autoComplete="email" {...register("email")} />
                    <FieldError error={errors.email} />
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                        Phone <Req />
                    </label>
                    <Input icon={Phone} type="tel" placeholder="Phone" autoComplete="tel" {...register("phone")} />
                    <FieldError error={errors.phone} />
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
                        {...register("address")}
                    />
                </div>
                <FieldError error={errors.address} />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Purpose / Reason <Req />
                </label>
                <textarea
                    rows="3"
                    placeholder="Briefly describe why you’re booking"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300"
                    {...register("purpose")}
                />
                <FieldError error={errors.purpose} />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                <textarea
                    rows="3"
                    placeholder="Anything else we should know?"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300"
                    {...register("additionalNotes")}
                />
            </div>
        </form>
    )
}
