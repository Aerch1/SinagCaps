"use client";

import { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../../api/api.js";
import HeroBanner from "../../../components/section/HeroBanner.jsx";
import Stepper from "../../../components/ui/Stepper.jsx";

// Steps
import Step1Service from "./steps/Step1ServiceDate.jsx";
import Step2DateTime from "./steps/Step2DateTime.jsx";
import Step3Form from "./steps/Step3Forms.jsx";
import Step4ReviewSubmit from "./steps/Step4ReviewSubmit.jsx";
import { useAuthStore } from "@/store/authStore.js";

const HERO_IMG = "/appbg.jpg";

export default function AppointmentPage() {
  const { user } = useAuthStore();

  /* ---------- State ---------- */
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({ documentFiles: [] });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const validatorsRef = useRef({});

  const registerValidator = (step, fn) => (validatorsRef.current[step] = fn);

  const steps = [
    { number: 1, title: "Select Service", description: "Choose the type of appointment" },
    { number: 2, title: "Date & Time", description: "Pick an available slot" },
    { number: 3, title: "Personal Info & Details", description: "Fill in service-specific details" },
    { number: 4, title: "Review & Submit", description: "Confirm and send your request" },
  ];

  /* =====================================================
     🧠 LocalStorage Isolation per Service
  ===================================================== */
  const getStorageKey = (suffix) => {
    const type = formData.formType || "default";
    return `appointment_${type}_${suffix}`;
  };

  useEffect(() => {
    const loadSavedData = async () => {
      const savedType = localStorage.getItem("appointment_activeType");
      if (!savedType) return;

      const stepKey = `appointment_${savedType}_step`;
      const dataKey = `appointment_${savedType}_data`;
      const savedStep = parseInt(localStorage.getItem(stepKey)) || 1;
      const savedData = JSON.parse(localStorage.getItem(dataKey) || "{}");

      try {
        const { data } = await api.get("/public/services");
        const validIds = data?.services?.map((s) => s.id) || [];

        if (!savedData.service_id || !validIds.includes(savedData.service_id)) {
          console.warn("⚠️ Outdated or invalid saved appointment data cleared.");
          localStorage.removeItem(dataKey);
          localStorage.removeItem(stepKey);
          localStorage.removeItem("appointment_activeType");
          return;
        }

        setFormData(savedData);
        setCurrentStep(savedStep);
      } catch (err) {
        console.warn("⚠️ Failed to validate saved service:", err.message);
      }
    };

    loadSavedData();
  }, []);

  useEffect(() => {
    if (!formData.formType) return;
    localStorage.setItem("appointment_activeType", formData.formType);
    localStorage.setItem(getStorageKey("step"), currentStep);
    localStorage.setItem(getStorageKey("data"), JSON.stringify(formData));
  }, [formData, currentStep]);

  const resetStorage = (type) => {
    const keyPrefix = `appointment_${type || formData.formType}`;
    localStorage.removeItem(`${keyPrefix}_data`);
    localStorage.removeItem(`${keyPrefix}_step`);
  };

  useEffect(() => {
    if (showSuccess) {
      resetStorage(formData.formType);
      localStorage.removeItem("appointment_activeType");
    }
  }, [showSuccess]);

  const prevTypeRef = useRef(null);
  useEffect(() => {
    if (!formData.formType) return;
    const currentType = formData.formType;
    const prevType = prevTypeRef.current;

    if (prevType && prevType !== currentType) {
      resetStorage(prevType);
      setFormData({
        formType: currentType,
        service_id: formData.service_id,
        serviceName: formData.serviceName,
        documentFiles: [],
      });
      setCurrentStep(1);
    }

    prevTypeRef.current = currentType;
  }, [formData.formType]);

  /* =====================================================
     🧩 Validation Handling
  ===================================================== */
  const runStepValidation = () => {
    let errs = {};

    if (currentStep === 1 && !formData.service_id) {
      errs.service_id = "Please select a service";
    }

    if (currentStep === 2) {
      if (!formData.preferredDate) errs.preferredDate = "Please select a date";
      if (!formData.preferredTime) errs.preferredTime = "Please select a time";
    }

    if (currentStep === 3) {
      const validator = validatorsRef.current[3];
      if (validator) {
        const result = validator();
        if (result !== true) errs = { ...errs, ...result };
      }
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  /* =====================================================
     ⚙️ Step Navigation
  ===================================================== */
  const next = () => {
    if (!runStepValidation()) return;
    setCurrentStep((s) => Math.min(s + 1, steps.length));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const back = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    setFormErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    resetStorage(formData.formType);
    setFormData({ documentFiles: [] });
    setFormErrors({});
    setCurrentStep(1);
    setShowSuccess(false);
  };

  /* =====================================================
     🖇 Document Upload Handlers (multiple, max 10)
  ===================================================== */
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const maxFiles = 10;

    setFormData((prev) => {
      const totalFiles = [...prev.documentFiles, ...files];
      if (totalFiles.length > maxFiles) {
        toast.error("You can upload a maximum of 10 documents.");
        return { ...prev, documentFiles: totalFiles.slice(0, maxFiles) };
      }
      return { ...prev, documentFiles: totalFiles };
    });
  };

  const handleRemoveFile = (index) => {
    setFormData((prev) => {
      const updated = [...prev.documentFiles];
      updated.splice(index, 1);
      return { ...prev, documentFiles: updated };
    });
  };

  /* =====================================================
     🚀 Submit Handler (supports multiple documents)
  ===================================================== */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (currentStep !== 4) return;

    setIsSubmitting(true);
    const toastId = toast.loading("Submitting your appointment request...");

    try {
      const payload = new FormData();

      payload.append("service_id", formData.service_id);
      payload.append("date", formData.preferredDate);
      payload.append("time", formData.preferredTime);
      payload.append(
        "name",
        user?.fullName || user?.name || user?.email?.split("@")[0] || "Guest"
      );
      payload.append("email", formData.email || user?.email);
      payload.append("contactNumber", formData.phone || "");
      payload.append("address", formData.address || "");
      payload.append("notes", formData.notes || formData.additionalNotes || "");

      // Baptism fields
      if (formData.formType === "baptism") {
        payload.append("childFullName", formData.childFullName || "");
        payload.append("childDob", formData.childDob || "");
        payload.append("childBirthplace", formData.childBirthplace || "");
        payload.append("fatherName", formData.fatherName || "");
        payload.append("motherMaidenName", formData.motherMaidenName || "");
        payload.append("parentsMarriageType", formData.parentsMarriageType || "");
        payload.append("sponsors", JSON.stringify(formData.sponsors || []));
      }

      // Confirmation fields
      if (formData.formType === "confirmation") {
        payload.append("confirmandName", formData.confirmandName || "");
        payload.append("age", formData.age || "");
        payload.append("fatherName", formData.fatherName || "");
        payload.append("motherMaidenName", formData.motherMaidenName || "");
        payload.append("parishOrigin", formData.parishOrigin || "");
        payload.append("baptizedAt", formData.baptizedAt || "");
        payload.append("baptizedOn", formData.baptizedOn || "");
        payload.append("sponsors", JSON.stringify(formData.sponsors || []));
      }

      // Append uploaded documents
      formData.documentFiles?.forEach((file) => payload.append("documents[]", file));

      const { data } = await api.post("/appointments", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setFormData((prev) => ({
        ...prev,
        appointmentId: data.appointmentId,
        serviceName: data.serviceName || prev.serviceName,
      }));

      toast.success("Appointment submitted successfully!", { id: toastId });
      setShowSuccess(true);
    } catch (error) {
      toast.dismiss(toastId);

      if (error?.response?.data?.errors) {
        const fieldErrors = {};
        error.response.data.errors.forEach(({ field, message }) => {
          fieldErrors[field] = message;
        });
        setFormErrors(fieldErrors);
      } else if (error?.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error("Submission failed. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /* =====================================================
     🧱 Step Content Renderer
  ===================================================== */
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <Step1Service formData={formData} setFormData={setFormData} formErrors={formErrors} />;
      case 2:
        return <Step2DateTime formData={formData} setFormData={setFormData} formErrors={formErrors} />;
      case 3:
        return (
          <Step3Form
            formData={formData}
            setFormData={setFormData}
            registerValidator={registerValidator}
            formErrors={formErrors}
            handleFileChange={handleFileChange}
            handleRemoveFile={handleRemoveFile}
          />
        );
      case 4:
        return (
          <Step4ReviewSubmit
            formData={formData}
            isSubmitting={isSubmitting}
            showSuccess={showSuccess}
            onSuccess={setShowSuccess}
            resetForm={resetForm}
          />
        );
      default:
        return null;
    }
  };

  /* =====================================================
     🖥️ Layout
  ===================================================== */
  return (
    <main className="bg-gray-50 min-h-screen">
      <HeroBanner title="Book an Appointment" imageSrc={HERO_IMG} />
      <div className="max-w-6xl mx-auto px-4 lg:px-8 py-8">
        {!showSuccess && <Stepper steps={steps} currentStep={currentStep} />}

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden mt-8">
          <form noValidate onSubmit={handleSubmit}>
            <div className="p-6 md:p-8">{renderStepContent()}</div>

            {!showSuccess && currentStep <= steps.length && (
              <div className="px-6 md:px-8 py-6 bg-gray-50 border-t flex flex-col sm:flex-row justify-between gap-4">
                <button
                  type="button"
                  disabled={currentStep === 1}
                  onClick={back}
                  className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  ← Previous
                </button>
                {currentStep < 4 && (
                  <button
                    type="button"
                    onClick={next}
                    className="px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    Next →
                  </button>
                )}
              </div>
            )}
          </form>
        </div>

        <div className="mt-6 text-center">
          <Link
            to="/services/generalinfo"
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            ← Back to General Information
          </Link>
        </div>
      </div>
    </main>
  );
}
