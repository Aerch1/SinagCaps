"use client"

import { useEffect, useMemo, useState } from "react"
import { useForm, Controller, useFieldArray } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { parseISO, format } from "date-fns"
import { User, Mail, Phone, MapPin, Info } from "lucide-react"

import Input from "../components/ui/Input.jsx"
import Dropdown from "../components/ui/Dropdown1.jsx"

/* ---------------------- ZOD SCHEMA ---------------------- */
const SponsorSchema = z.object({
  role: z.enum(["Ninong", "Ninang"], { required_error: "Role is required" }),
  name: z.string().min(1, "Name is required"),
  address: z.string().min(1, "Address is required"),
})

const BaptismSchema = z.object({
  childFullName: z.string().min(1, "Child's name is required"),
  childDob: z.string().min(1, "Date of birth is required"),
  childBirthplace: z.string().min(1, "Birthplace is required"),
  fatherName: z.string().min(1, "Father’s name is required"),
  motherMaidenName: z.string().min(1, "Mother’s maiden name is required"),
  parentsMarriageType: z.enum(["church", "civil", "unmarried"], {
    required_error: "Please select a marriage status",
  }),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email("Invalid email address"),
  address: z.string().min(1, "Address is required"),
  sponsors: z.array(SponsorSchema).min(2, "At least 2 sponsors required"),
})

const Req = () => <span className="text-red-500 ml-0.5">*</span>
const FieldError = ({ error }) =>
  error ? <p className="mt-1 text-xs text-red-500">{error.message}</p> : null

/* ---------------------- COMPONENT ---------------------- */
export default function BaptismForm({ defaultValues, onSubmit }) {
  const [showSponsorTip, setShowSponsorTip] = useState(false)

  const {
    control,
    handleSubmit,
    register,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(BaptismSchema),
    defaultValues: defaultValues || {
      childFullName: "",
      childDob: "",
      childBirthplace: "",
      fatherName: "",
      motherMaidenName: "",
      parentsMarriageType: "",
      phone: "",
      email: "",
      address: "",
      sponsors: [
        { role: "Ninong", name: "", address: "" },
        { role: "Ninang", name: "", address: "" },
      ],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "sponsors",
  })

  const scheduleLabel = useMemo(() => {
    if (!defaultValues?.preferredDate) return ""
    try {
      const d = parseISO(defaultValues.preferredDate)
      const dateStr = format(d, "EEE, MMM d, yyyy")
      return defaultValues.preferredTime
        ? `${dateStr} • ${defaultValues.preferredTime}`
        : dateStr
    } catch {
      return defaultValues.preferredDate
    }
  }, [defaultValues])

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-10"
      aria-labelledby="baptism-form"
    >
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-lg font-medium">Baptism Details (Binyag)</h3>
        {scheduleLabel ? (
          <span className="inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-800">
            Selected schedule: {scheduleLabel}
          </span>
        ) : null}
      </div>

      {/* ---------------- Child info ---------------- */}
      <section className="space-y-6">
        <h4 className="text-sm font-semibold text-gray-900">Child Information</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-medium mb-1">
              Pangalan ng Bibinyagan (Child&apos;s Full Name) <Req />
            </label>
            <Input
              icon={User}
              variant="light"
              placeholder="Juan Dela Cruz"
              autoComplete="name"
              {...register("childFullName")}
            />
            <FieldError error={errors.childFullName} />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">
              Petsa ng Kapanganakan (Date of Birth) <Req />
            </label>
            <Input
              type="date"
              variant="light"
              max={new Date().toISOString().slice(0, 10)}
              {...register("childDob")}
            />
            <FieldError error={errors.childDob} />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium mb-1">
              Lugar ng Kapanganakan (Place of Birth) <Req />
            </label>
            <Input
              icon={MapPin}
              variant="light"
              placeholder="City / Hospital / Address"
              {...register("childBirthplace")}
            />
            <FieldError error={errors.childBirthplace} />
          </div>
        </div>
      </section>

      {/* ---------------- Parents ---------------- */}
      <section className="space-y-6 border-t border-gray-200 pt-6">
        <h4 className="text-sm font-semibold text-gray-900">Parents</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-medium mb-1">
              Pangalan ng Ama (Father&apos;s Name) <Req />
            </label>
            <Input
              icon={User}
              variant="light"
              placeholder="Full Name"
              autoComplete="name"
              {...register("fatherName")}
            />
            <FieldError error={errors.fatherName} />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">
              Pangalan ng Ina (noong dalaga) / Mother&apos;s Maiden Name <Req />
            </label>
            <Input
              icon={User}
              variant="light"
              placeholder="Full Maiden Name"
              autoComplete="name"
              {...register("motherMaidenName")}
            />
            <FieldError error={errors.motherMaidenName} />
          </div>
        </div>

        <div className="pt-2">
          <p className="text-sm font-medium mb-2">
            Katayuan ng Magulang (Parents’ Marriage Status) <Req />
          </p>
          <div className="flex flex-wrap gap-6">
            {[
              { v: "church", label: "Simbahan (Church)" },
              { v: "civil", label: "Civil" },
              { v: "unmarried", label: "Hindi Kasal (Not Married)" },
            ].map((opt) => (
              <label
                key={opt.v}
                className="inline-flex items-center gap-2 text-sm"
              >
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

      {/* ---------------- Contact & Address ---------------- */}
      <section className="space-y-6 border-t border-gray-200 pt-6">
        <h4 className="text-sm font-semibold text-gray-900">Contact & Address</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-medium mb-1">
              Contact No. <Req />
            </label>
            <Input
              icon={Phone}
              variant="light"
              type="tel"
              placeholder="09XXXXXXXXX"
              autoComplete="tel"
              {...register("phone")}
            />
            <FieldError error={errors.phone} />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">
              Email <Req />
            </label>
            <Input
              icon={Mail}
              variant="light"
              type="email"
              placeholder="name@email.com"
              autoComplete="email"
              {...register("email")}
            />
            <FieldError error={errors.email} />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1">
            Tirahan / Address <Req />
          </label>
          <textarea
            rows={3}
            placeholder="Complete Address"
            {...register("address")}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 resize-none"
          />
          <FieldError error={errors.address} />
        </div>
      </section>

      {/* ---------------- Sponsors ---------------- */}
      <section className="space-y-6 border-t border-gray-200 pt-6">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold text-gray-900">
            Sponsors (Ninong/Ninang, 16 years old pataas) <Req />
          </h4>
          <div
            className="relative inline-flex"
            onMouseEnter={() => setShowSponsorTip(true)}
            onMouseLeave={() => setShowSponsorTip(false)}
          >
            <button
              type="button"
              onClick={() => setShowSponsorTip((s) => !s)}
              className="p-1 rounded-full text-gray-500 hover:text-gray-700"
            >
              <Info className="h-4 w-4" />
            </button>
            {showSponsorTip && (
              <div className="absolute z-50 mt-2 w-64 rounded-md border border-gray-200 bg-white p-3 text-xs text-gray-700 shadow-md">
                Two sponsors (1 Ninong + 1 Ninang) are included. Adding more
                sponsors may have an additional fee and is subject to parish
                approval.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {fields.map((field, idx) => (
            <div
              key={field.id}
              className="grid grid-cols-1 md:grid-cols-12 gap-6 md:items-center"
            >
              <div className="md:col-span-3">
                <label className="block text-xs font-medium mb-1">
                  Role <Req />
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
                      variant="light"
                      className="w-32 " // ✅ fixed width
                    />
                  )}
                />
                <FieldError error={errors.sponsors?.[idx]?.role} />
              </div>

              <div className="md:col-span-4">
                <label className="block text-xs font-medium mb-1">
                  Name <Req />
                </label>
                <Input
                  icon={User}
                  variant="light"
                  placeholder="Full Name"
                  {...register(`sponsors.${idx}.name`)}
                />
                <FieldError error={errors.sponsors?.[idx]?.name} />
              </div>

              <div className="md:col-span-4">
                <label className="block text-xs font-medium mb-1">
                  Address <Req />
                </label>
                <Input
                  icon={MapPin}
                  variant="light"
                  placeholder="Address"
                  {...register(`sponsors.${idx}.address`)}
                />
                <FieldError error={errors.sponsors?.[idx]?.address} />
              </div>

              <div className="md:col-span-1 flex  md:justify-end">
                <button
                  type="button"
                  onClick={() => remove(idx)}
                  className="px-3  h-11 mt-3 text-xs rounded-md text-gray-600 hover:text-red-600"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={() =>
              append({ role: "Ninong", name: "", address: "" })
            }
            className="px-4 py-2 text-sm rounded-md text-gray-700 hover:bg-gray-50 border border-gray-300"
          >
            + Add Sponsor
          </button>
        </div>
      </section>

   
    </form>
  )
}
