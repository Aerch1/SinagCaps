import { useMemo } from "react";
import { parseISO, format } from "date-fns";
import { Link, useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  FileText,
  Calendar,
  User,
  Mail,
  Clock,
  Image as ImageIcon,
} from "lucide-react";

/* ---------- Labels ---------- */
const LABELS = {
  service_id: "Service",
  serviceName: "Service",
  preferredDate: "Date",
  preferredTime: "Time",
  childFullName: "Child's Full Name",
  childDob: "Date of Birth",
  childBirthplace: "Place of Birth",
  fatherName: "Father's Name",
  motherMaidenName: "Mother's Maiden Name",
  parentsMarriageType: "Parents' Marital Status",
  phone: "Phone Number",
  email: "Email",
  address: "Address",
  sponsors: "Sponsors",
  firstName: "First Name",
  lastName: "Last Name",
  notes: "Notes",
  additionalNotes: "Additional Notes",
  confirmandName: "Full Name of Confirmand",
  age: "Age",
  fatherNameConfirmand: "Father's Name",
  motherMaidenNameConfirmand: "Mother's Maiden Name",
  parishOrigin: "Parish of Origin",
  baptizedAt: "Baptized At",
  baptizedOn: "Baptized On",
};

/* ---------- Skip keys ---------- */
const HIDDEN_KEYS = new Set(["extraData", "formErrors", "formType", "uploadedFiles"]);

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
  const navigate = useNavigate();

  const formatKey = (key) => LABELS[key] || key;

  const formatValue = (key, value) => {
    if (!value) return null;

    if (key === "sponsors" && Array.isArray(value)) {
      return value
        .map(
          (s, i) =>
            `${i + 1}. ${s.name || "-"} (${s.role || "-"})\n${s.address || "-"}`
        )
        .join("\n\n");
    }

    if (["preferredDate", "childDob", "baptizedOn"].includes(key)) {
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

    // merge schedule line
    if (sections.Schedule.length === 2) {
      const date = sections.Schedule.find((f) => f.label === "Date")?.value;
      const time = sections.Schedule.find((f) => f.label === "Time")?.value;
      sections.Schedule = [
        {
          label: "Schedule",
          value: date && time ? `${date} • ${time}` : date || time,
        },
      ];
    }

    return sections;
  }, [formData]);

  /* ---------- Success Modal ---------- */
  if (showSuccess) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
        <div className="bg-white rounded-xl shadow-xl border border-green-200 max-w-md w-full p-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 flex items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="w-7 h-7 text-green-600" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Appointment Submitted Successfully!
          </h2>

          {formData.appointmentId && (
            <p className="text-sm text-gray-700 mb-4">
              Appointment ID:{" "}
              <span className="font-mono font-semibold text-green-700">
                {formData.appointmentId}
              </span>
            </p>
          )}

          <p className="text-gray-600 text-sm mb-6">
            The parish office will contact you within 24–48 hours to confirm your
            appointment. Please keep your phone and email available.
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
                navigate("/");
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

  /* ---------- Review Section ---------- */
  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3">
        <CheckCircle2 className="w-6 h-6 text-blue-600 mt-0.5" />
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Review Your Details
          </h3>
          <p className="text-sm text-gray-600">
            Please make sure all information is correct before submitting.
          </p>
        </div>
      </div>

      {/* ---------- Sections ---------- */}
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

      {/* ---------- Image Preview ---------- */}
      {Array.isArray(formData.uploadedFiles) && formData.uploadedFiles.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <ImageIcon className="w-4 h-4 text-gray-500" />
            <h4 className="text-sm font-medium text-gray-800">Uploaded Files</h4>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {formData.uploadedFiles.map((file, idx) => {
              const previewUrl = file instanceof File ? URL.createObjectURL(file) : file.url;
              return (
                <div
                  key={idx}
                  className="relative border rounded-lg overflow-hidden bg-gray-50 shadow-sm"
                >
                  <img
                    src={previewUrl}
                    alt={`upload-${idx}`}
                    className="object-cover w-full h-28"
                  />
                  <div className="p-1 text-xs text-center text-gray-700 truncate">
                    {file.name || `File ${idx + 1}`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ---------- Disclaimer ---------- */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
        <p className="mb-2">
          By submitting an appointment, you agree to the parish rules and regulations.
        </p>
        <Link
          to="/services/generalinfo"
          className="text-blue-600 hover:text-blue-700 underline text-sm"
        >
          View General Information and Guidelines
        </Link>
      </div>

      {/* ---------- Submit Button ---------- */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 text-sm font-medium text-white bg-secondary rounded-lg hover:bg-secondary/90 disabled:opacity-50 flex items-center gap-2"
        >
          {isSubmitting ? "Submitting..." : "Submit Appointment"}
        </button>
      </div>

      {/* ---------- Reminder Section ---------- */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
        <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-600" /> Reminder
        </h4>
        <ul className="list-disc pl-5 space-y-1 text-gray-700">
          <li>Keep your phone and email available for our message.</li>
          <li>
            If the appointment you created is approved, go immediately to the parish
            office to comply with the requirements.
          </li>
          <li>Prepare all necessary documents before visiting.</li>
          <li>Arrive 15–30 minutes before your scheduled time.</li>
        </ul>
      </div>

      {/* ---------- Contact Info ---------- */}
      <div className="border-t border-blue-200 pt-4">
        <p className="text-sm font-medium text-gray-900 mb-2">
          Need immediate assistance?
        </p>
        <p className="text-sm text-gray-700">
          Call{" "}
          <a
            href="tel:+63966 854 8848"
            className="font-medium text-blue-600 hover:text-blue-700"
          >
            (+63) 966 854 8848
          </a>{" "}
          or email{" "}
          <a
            href="mailto:appointments@parish.org"
            className="font-medium text-blue-600 hover:text-blue-700"
          >
            lodlod.olpgvp@gmail.com
          </a>
        </p>
      </div>
    </div>
  );
}
