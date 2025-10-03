
import { useMemo } from "react";
import { parseISO, format } from "date-fns";
import { Link, useNavigate } from "react-router-dom"; // ✅ add useNavigate
import {
  CheckCircle2,
  FileText,
  Calendar,
  User,
  Mail,
  Phone,
  Clock,
} from "lucide-react";

/* ---------- Labels ---------- */
const LABELS = {
  service_id: "Service",
  serviceName: "Service",
  preferredDate: "Date",
  preferredTime: "Time",
  childFullName: "Child's Full Name",
  childDob: "Child's Date of Birth",
  childBirthplace: "Child's Birthplace",
  fatherName: "Father's Name",
  motherMaidenName: "Mother's Maiden Name",
  parentsMarriageType: "Parents' Marriage Status",
  phone: "Contact No.",
  email: "Email",
  address: "Address",
  sponsors: "Sponsors",
  firstName: "First Name",
  lastName: "Last Name",
  purpose: "Purpose / Reason",
  notes: "Notes",
  additionalNotes: "Additional Notes",
};

/* ---------- Skip keys ---------- */
const HIDDEN_KEYS = new Set(["extraData", "formErrors", "formType"]);

/* ---------- Section Icons ---------- */
const SECTION_ICONS = {
  Service: FileText,
  Schedule: Calendar,
  Contact: Mail,
  Details: User,
};

export default function Step4ReviewSubmit({
  formData,
  isSubmitting,
  showSuccess,
  onSuccess,
  resetForm,
}) {
  const navigate = useNavigate(); // ✅ for navigation

  const formatKey = (key) => LABELS[key] || key;

  const formatValue = (key, value) => {
    if (!value) return null;

    if (key === "sponsors" && Array.isArray(value)) {
      return value
        .map(
          (s, i) =>
            `${i + 1}. ${s.role || "-"} — ${s.name || "-"} (${s.address || "-"})`
        )
        .join("\n");
    }

    if (key === "preferredDate" || key === "childDob") {
      try {
        const d = parseISO(value);
        return format(d, "EEE, MMM d, yyyy");
      } catch {
        return value;
      }
    }

    if (key === "preferredTime") {
      try {
        const [h, m] = value.split(":").map(Number);
        const suffix = h >= 12 ? "PM" : "AM";
        const hour = h % 12 || 12;
        return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
      } catch {
        return value;
      }
    }

    if (Array.isArray(value)) return value.join(", ");
    if (typeof value === "object") return JSON.stringify(value);

    return String(value);
  };

  /* ---------- Group fields ---------- */
  const grouped = useMemo(() => {
    if (!formData) return {};

    const sections = { Service: [], Schedule: [], Contact: [], Details: [] };

    for (const [key, rawValue] of Object.entries(formData)) {
      if (HIDDEN_KEYS.has(key)) continue;

      const value = formatValue(key, rawValue);
      if (!value) continue;

      const label = formatKey(key);

      if (["service_id", "serviceName"].includes(key)) {
        if (key === "serviceName") {
          sections.Service.push({ label, value });
        } else if (!formData.serviceName) {
          sections.Service.push({ label, value });
        }
      } else if (["preferredDate", "preferredTime"].includes(key)) {
        sections.Schedule.push({ label, value });
      } else if (["phone", "email", "address"].includes(key)) {
        sections.Contact.push({ label, value });
      } else {
        sections.Details.push({ label, value });
      }
    }

    // merge schedule into one line
    if (sections.Schedule.length === 2) {
      const date = sections.Schedule.find((f) => f.label === "Date")?.value;
      const time = sections.Schedule.find((f) => f.label === "Time")?.value;
      sections.Schedule = [
        { label: "Schedule", value: date && time ? `${date} • ${time}` : date || time },
      ];
    }

    return sections;
  }, [formData]);

  /* ---------- Success modal ---------- */
  if (showSuccess) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
        <div className="bg-white rounded-xl shadow-xl border border-green-200 max-w-md w-full p-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 flex items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="w-7 h-7 text-green-600" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Appointment Submitted!</h2>

          {/* ✅ Appointment ID */}
          {formData.appointmentId && (
            <p className="text-sm text-gray-700 mb-4">
              Your Appointment ID:{" "}
              <span className="font-mono font-semibold text-green-700">
                {formData.appointmentId}
              </span>
            </p>
          )}

          <p className="text-gray-600 text-sm mb-6">
            The parish office will contact you within 24–48 hours to confirm.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={() => {
                onSuccess(false);
                resetForm();
              }}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Book Another
            </button>
            <button
              type="button"
              onClick={() => {
                onSuccess(false);
                resetForm();
                navigate("/"); // ✅ redirect home
              }}
              className="bg-gray-100 text-gray-700 px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }
  /* ---------- Review state ---------- */
  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Compact header */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3">
        <CheckCircle2 className="w-6 h-6 text-blue-600 mt-0.5" />
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Review Your Details</h3>
          <p className="text-sm text-gray-600">
            Make sure everything below is correct before submitting.
          </p>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {Object.entries(grouped).map(([section, fields]) => {
          if (fields.length === 0) return null;
          const Icon = SECTION_ICONS[section] || FileText;

          return (
            <div key={section} className="bg-white rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 px-4 py-2 border-b bg-gray-50">
                <Icon className="w-4 h-4 text-gray-500" />
                <h4 className="text-sm font-medium text-gray-800">{section}</h4>
              </div>
              <div className="divide-y divide-gray-100">
                {fields.map((field, idx) => (
                  <div key={idx} className="px-4 py-2 grid grid-cols-3 gap-2 text-sm">
                    <dt className="text-gray-500">{field.label}</dt>
                    <dd className="col-span-2 text-gray-900 whitespace-pre-line">
                      {field.value}
                    </dd>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Disclaimer */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
        <p className="mb-2">
          By submitting this appointment request, you confirm that you agree to the
          parish guidelines.
        </p>
        <Link
          to="/services/generalinfo"
          className="text-blue-600 hover:text-blue-700 underline text-sm"
        >
          View General Information & Guidelines
        </Link>
      </div>

      {/* Submit button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
        >
          {isSubmitting ? "Submitting..." : "Submit Appointment"}
        </button>
      </div>

      {/* Reminders */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
        <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-600" /> Reminders
        </h4>
        <ul className="list-disc pl-5 space-y-1 text-gray-700">
          <li>Keep your phone and email accessible for our contact.</li>
          <li>If you don't hear from us within 48 hours, please call the parish office</li>
          <li>Prepare all required documents ready for your appointment.</li>
          <li>Arrive 15–30 minutes early on your appointment day.</li>
        </ul>
      </div>
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
  );
}
