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
} from "lucide-react";

/* ---------- Labels ---------- */
const LABELS = {
  service_id: "Serbisyo",
  serviceName: "Serbisyo",
  preferredDate: "Petsa",
  preferredTime: "Oras",
  childFullName: "Buong Pangalan ng Bata",
  childDob: "Petsa ng Kapanganakan",
  childBirthplace: "Lugar ng Kapanganakan",
  fatherName: "Pangalan ng Ama",
  motherMaidenName: "Pangalan ng Ina (Bago ikasal)",
  parentsMarriageType: "Kalagayan ng Kasal ng mga Magulang",
  phone: "Numero ng Telepono",
  email: "Email",
  address: "Tirahan",
  sponsors: "Mga Ninong/Ninang",
  firstName: "Unang Pangalan",
  lastName: "Apelyido",
  purpose: "Layunin / Dahilan",
  notes: "Mga Tala",
  additionalNotes: "Karagdagang Tala",

  // ✅ Confirmation (Kumpil)
  confirmandName: "Buong Pangalan ng Kukumpilan",
  age: "Edad",
  fatherNameConfirmand: "Pangalan ng Ama",
  motherMaidenNameConfirmand: "Pangalan ng Ina",
  parishOrigin: "Parokya ng Pinagmulan",
  baptizedAt: "Biniyagan sa (Lugar)",
  baptizedOn: "Biniyagan noong (Petsa)",
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
      const date = sections.Schedule.find((f) => f.label === "Petsa")?.value;
      const time = sections.Schedule.find((f) => f.label === "Oras")?.value;
      sections.Schedule = [
        {
          label: "Iskedyul",
          value: date && time ? `${date} • ${time}` : date || time,
        },
      ];
    }

    return sections;
  }, [formData]);

  /* ---------- ✅ English Success Modal ---------- */
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
            The parish office will contact you within 24–48 hours to confirm
            your appointment. Please keep your phone and email open.
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

  /* ---------- Review Section (Tagalog stays) ---------- */
  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3">
        <CheckCircle2 className="w-6 h-6 text-blue-600 mt-0.5" />
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Suriin ang Iyong Mga Detalye
          </h3>
          <p className="text-sm text-gray-600">
            Siguraduhing tama ang lahat ng impormasyon bago isumite.
          </p>
        </div>
      </div>

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

      <div className="bg-white border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
        <p className="mb-2">
          Sa pag-submit ng appointment, sumasang-ayon ka sa mga patakaran ng
          parokya.
        </p>
        <Link
          to="/services/generalinfo"
          className="text-blue-600 hover:text-blue-700 underline text-sm"
        >
          Tingnan ang Pangkalahatang Impormasyon at Gabay
        </Link>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
        >
          {isSubmitting ? "Ipinapasa..." : "Isumite ang Appointment"}
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
        <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-600" /> Paalala
        </h4>
        <ul className="list-disc pl-5 space-y-1 text-gray-700">
          <li>Panatilihing bukas ang iyong telepono at email para sa aming mensahe.</li>
          <li>Kung walang tugon sa loob ng 48 oras, tawagan ang opisina ng parokya.</li>
          <li>Ihanda ang lahat ng kinakailangang dokumento bago pumunta.</li>
          <li>Dumating 15–30 minuto bago ang itinakdang oras.</li>
        </ul>
      </div>

      <div className="border-t border-blue-200 pt-4">
        <p className="text-sm font-medium text-gray-900 mb-2">
          Kailangan ng agarang tulong?
        </p>
        <p className="text-sm text-gray-700">
          Tumawag sa{" "}
          <a
            href="tel:5551234567"
            className="font-medium text-blue-600 hover:text-blue-700"
          >
            (555) 123-4567
          </a>{" "}
          o mag-email sa{" "}
          <a
            href="mailto:appointments@parish.org"
            className="font-medium text-blue-600 hover:text-blue-700"
          >
            appointments@parish.org
          </a>
        </p>
      </div>
    </div>
  );
}
