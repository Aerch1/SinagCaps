import { Link } from "react-router-dom"

export default function Step4ReviewSubmit({ formData }) {
  const hasValue = (value) => {
    return value !== null && value !== undefined && value !== "" && value !== "—"
  }

  const getFilledFields = () => {
    const fields = []

    // Service Details
    if (hasValue(formData.serviceType)) {
      const serviceMap = {
        baptism: "Baptism (Binyag)",
        confirmation: "Confirmation (Kumpil)",
        marriage: "Wedding (Kasal)",
        confession: "Confession (Kumpisal)",
        anointing: "Anointing of the Sick (Pagpapahid sa Maysakit)",
      }
      fields.push({ label: "Service Type", value: serviceMap[formData.serviceType] || formData.serviceType })
    }

    if (hasValue(formData.preferredDate)) {
      const date = new Date(formData.preferredDate)
      const formattedDate = date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
      fields.push({ label: "Preferred Date", value: formattedDate })
    }

    if (hasValue(formData.preferredTime)) {
      fields.push({ label: "Preferred Time", value: formData.preferredTime })
    }

    // Personal Information
    const fullName = `${formData.firstName || ""} ${formData.lastName || ""}`.trim()
    if (hasValue(fullName)) {
      fields.push({ label: "Full Name", value: fullName })
    }

    if (hasValue(formData.email)) {
      fields.push({ label: "Email Address", value: formData.email })
    }

    if (hasValue(formData.phone)) {
      fields.push({ label: "Phone Number", value: formData.phone })
    }

    if (hasValue(formData.address)) {
      fields.push({ label: "Address", value: formData.address })
    }

    // Additional Details
    if (hasValue(formData.purpose)) {
      fields.push({ label: "Purpose", value: formData.purpose })
    }

    if (hasValue(formData.numberOfPeople) && formData.numberOfPeople > 0) {
      fields.push({ label: "Number of People", value: formData.numberOfPeople })
    }

    if (formData.isUrgent !== undefined) {
      fields.push({ label: "Priority", value: formData.isUrgent ? "Urgent" : "Normal" })
    }

    if (hasValue(formData.additionalNotes)) {
      fields.push({ label: "Additional Notes", value: formData.additionalNotes })
    }

    return fields
  }

  const filledFields = getFilledFields()

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Review Your Appointment Request</h3>
        <p className="text-gray-600">Please review all details before submitting your request</p>
      </div>

      <div className="border border-gray-200 rounded-lg p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filledFields.map((field, index) => (
            <div key={index} className="space-y-2">
              <p className="text-sm font-medium text-gray-500">{field.label}</p>
              <p className="text-gray-900 font-medium">{field.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-2">
            By submitting this appointment request, you confirm that you have read and agree to the parish guidelines
            and terms of service.
          </p>
          <Link
            to="/services/generalinfo"
            className="text-sm font-medium text-blue-600 hover:text-blue-700 underline transition-colors"
          >
            View General Information & Guidelines
          </Link>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Reminders</h4>
        <ul className="space-y-2 text-sm text-gray-700 mb-6">
          <li>• Keep your phone and email accessible for our contact.</li>
          <li>• If you don't hear from us within 48 hours, please call the parish office.</li>
          <li>• Have all required documents ready for your appointment.</li>
          <li>• Arrive 15–30 minutes early on your appointment day.</li>
        </ul>

        <div className="border-t border-blue-200 pt-4">
          <p className="text-sm font-medium text-gray-900 mb-2">Need immediate assistance?</p>
          <p className="text-sm text-gray-700">
            Call the parish office at{" "}
            <a href="tel:5551234567" className="font-medium text-blue-600 hover:text-blue-700">
              (555) 123-4567
            </a>{" "}
            or email{" "}
            <a href="mailto:appointments@parish.org" className="font-medium text-blue-600 hover:text-blue-700">
              appointments@parish.org
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
