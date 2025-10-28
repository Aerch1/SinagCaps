"use client";

import Dropdown from "../../../../components/ui/Dropdown1.jsx";

export default function Step1Service({ formData, setFormData, services = [] }) {
  const onServiceChange = (label) => {
    const picked = services.find((s) => s.name === label);
    if (!picked) return;

    setFormData((prev) => ({
      ...prev,
      service_id: picked.id,
      formType: picked.form_type,
      serviceName: picked.name,
      preferredDate: "",
      preferredTime: "",
      extraData: {},
    }));
  };

  return (
    <div className="space-y-8">
      <h3 className="text-lg font-medium">Select Service</h3>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Service Type <span className="text-red-500">*</span>
            </label>

            <Dropdown
              value={formData.serviceName || ""}
              onChange={onServiceChange}
              options={services.map((s) => s.name)}
              placeholder={services.length === 0 ? "Loading..." : "Select a service"}
              className="w-full"
            />
          </div>
        </div>
      </div>

      <div className="pt-2">
        <h5 className="text-sm font-semibold text-red-600 tracking-wide">NOTICE</h5>
        <ol className="mt-2 list-decimal pl-5 text-sm leading-6 text-gray-800 space-y-1">
          <li>
            Ensure all requirements and personal details are complete and accurate. Incomplete or
            incorrect info may cause delays or rescheduling.
          </li>
          <li>
            Seminars/Orientations are required where applicable (e.g., Pre-Baptism,
            Pre-Cana/Marriage Prep, Catechesis). Attendance and punctuality are mandatory.
          </li>
          <li>
            Use your active phone and email. Official updates are sent through parish channels.
            Avoid fixers or third-party coordinators.
          </li>
          <li>
            If your appointment is approved, please comply with the church office immediately for
            the required documents and requirements.
          </li>
        </ol>
      </div>
    </div>
  );
}
