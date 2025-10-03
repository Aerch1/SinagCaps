"use client";

import { useEffect, useState, useMemo } from "react";
import Dropdown from "../../../../components/ui/Dropdown1.jsx";
import api from "../../../../api/api.js";
import toast from "react-hot-toast";

export default function Step1Service({ formData, setFormData }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadServices = async () => {
      try {
        const res = await api.get("/public/services");
        if (res.data?.success) {
          setServices(res.data.services || []);
        } else {
          setServices([]);
        }
      } catch (err) {
        console.error("❌ Failed to load services:", err);
        toast.error("Failed to load services. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    loadServices();
  }, []);

  // Selected service object
  const selectedService = useMemo(
    () => services.find((s) => String(s.id) === String(formData.service_id)),
    [formData.service_id, services]
  );

  const selectedServiceLabel = selectedService?.name || "";

  const onServiceChange = (label) => {
    const picked = services.find((s) => s.name === label);
    if (!picked) return;

    setFormData((prev) => ({
      ...prev,
      service_id: picked.id,          // numeric ID (from DB)
      formType: picked.form_type,     // ✅ direct from backend, no guessing
      serviceName: picked.name,     // ✅ NEW field for display later
      preferredDate: "",
      preferredTime: "",
      extraData: {},                  // reset extra form data (baptism, wedding, etc.)
    }));
  };

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

              {selectedService?.reminder && (
                <span className="text-xs text-gray-600">{selectedService.reminder}</span>
              )}
            </div>

            <Dropdown
              value={selectedServiceLabel}
              onChange={onServiceChange}
              options={services.map((s) => s.name)}
              placeholder={loading ? "Loading..." : "Select a service"}
              className="w-full"
            />
          </div>
        </div>

        {/* RIGHT: dynamic info */}
        <div className="md:col-span-6">
          <div className="rounded-md bg-gray-50 p-5">
            <h4 className="text-sm font-semibold text-gray-900">
              {selectedService ? selectedService.name : "Service Information"}
            </h4>

            <div className="mt-3 space-y-3 text-sm leading-6 text-gray-800">
              {!selectedService ? (
                <p>Select a service to see details and scheduling notes.</p>
              ) : (
                <>
                  <p>{selectedService.description}</p>

                  <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-700">
                    {selectedService.requirements?.map((req) => (
                      <li key={req.id || req.name}>
                        {req.name}{" "}
                        {req.is_mandatory && (
                          <span className="text-red-500 text-xs">(required)</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </>
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
        </ol>
      </div>
    </div>
  );
}
