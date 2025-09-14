// src/pages/Public/appointments/steps/Step1Service.jsx
"use client"

import Dropdown from "../../../../components/ui/Dropdown1"

export default function Step1Service({ formData, setFormData }) {
  const SERVICES = [
    { id: "baptism", label: "Baptism (Binyag)" },
    { id: "confirmation", label: "Confirmation (Kumpil)" },
    { id: "marriage", label: "Wedding (Kasal)" },
    { id: "confession", label: "Confession (Kumpisal)" },
    { id: "anointing", label: "Anointing of the Sick (Pagpapahid sa Maysakit)" },
  ]

  const serviceNotes = {
    baptism:
      "Baptism is scheduled as a parish group after Sunday Mass, or as a solo schedule upon request (subject to parish approval).",
    confirmation:
      "Confirmation may require catechesis/orientation and is typically scheduled on weekdays as announced by the parish.",
    marriage:
      "Weddings require a canonical interview and Pre-Cana/Marriage preparation. Coordinate early and prepare complete church/civil documents.",
    confession:
      "Confession is available during parish confession hours or by request. Please arrive early and maintain a prayerful disposition.",
    anointing:
      "Anointing of the Sick is for those who are seriously ill or elderly. Coordinate details (home/hospital) with the parish office.",
  }

  // show pretty label in the dropdown; store the id in state
  const serviceOptions = SERVICES.map((s) => s.label)
  const selectedServiceLabel =
    SERVICES.find((s) => s.id === formData.serviceType)?.label || ""

  const onServiceChange = (label) => {
    const picked = SERVICES.find((s) => s.label === label)
    const id = picked?.id || ""
    setFormData((p) => ({
      ...p,
      serviceType: id,
      // clear any date/time whenever service changes
      preferredDate: "",
      preferredTime: "",
    }))
  }

  return (
    <div className="space-y-8">
      <h3 className="text-lg font-medium">Select Service</h3>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* LEFT */}
        <div className="md:col-span-6 space-y-6">
          <div>
            <div className="flex items-center justify-between gap-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service Type <span className="text-red-500">*</span>
              </label>

              {/* Inline reminder shown when Baptism is selected */}
              {formData.serviceType === "baptism" && (
                <span className="text-xs text-gray-600">
                  Reminder: Group after Sunday Mass or solo by request (with approval).
                </span>
              )}
            </div>

            <Dropdown
              value={selectedServiceLabel}
              onChange={onServiceChange}
              options={serviceOptions}
              placeholder="Select a service"
              className="w-full"
              variant="light"   // 👈 force light mode for Public side
            />
          </div>
        </div>

        {/* RIGHT: dynamic info */}
        <div className="md:col-span-6">
          <div className="rounded-md bg-gray-50 p-5">
            <h4 className="text-sm font-semibold text-gray-900">
              {formData.serviceType
                ? SERVICES.find((s) => s.id === formData.serviceType)?.label
                : "Service Information"}
            </h4>

            <div className="mt-3 space-y-3 text-sm leading-6 text-gray-800">
              {!formData.serviceType ? (
                <p>Select a service to see details and scheduling notes.</p>
              ) : (
                <p>{serviceNotes[formData.serviceType]}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* NOTICE */}
      <div className="pt-2">
        <h5 className="text-sm font-semibold text-red-600 tracking-wide">NOTICE</h5>
        <ol className="mt-2 list-decimal pl-5 text-sm leading-6 text-gray-800 space-y-1">
          <li>
            Ensure all requirements and personal details are complete and accurate. Incomplete or incorrect info may
            cause delays or rescheduling.
          </li>
          <li>
            Seminars/Orientations are required where applicable (e.g., Pre-Baptism, Pre-Cana/Marriage Prep, Catechesis).
            Attendance and punctuality are mandatory.
          </li>
          <li>
            Use your active phone and email. Official updates are sent through parish channels. Avoid fixers or
            third-party coordinators.
          </li>
        </ol>
      </div>
    </div>
  )
}
