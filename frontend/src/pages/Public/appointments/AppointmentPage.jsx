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
  const [formData, setFormData] = useState({});
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
     🧠 LocalStorage Isolation per Service (Safe Version)
  ===================================================== */
  const getStorageKey = (suffix) => {
    const type = formData.formType || "default";
    return `appointment_${type}_${suffix}`;
  };

  // ✅ Load and validate saved data
  useEffect(() => {
    const loadSavedData = async () => {
      const savedType = localStorage.getItem("appointment_activeType");
      if (!savedType) return;

      const stepKey = `appointment_${savedType}_step`;
      const dataKey = `appointment_${savedType}_data`;
      const savedStep = parseInt(localStorage.getItem(stepKey)) || 1;
      const savedData = JSON.parse(localStorage.getItem(dataKey) || "{}");

      try {
        // ✅ Fetch valid service IDs to validate saved data
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

  // ✅ Persist per-service data & step
  useEffect(() => {
    if (!formData.formType) return;
    localStorage.setItem("appointment_activeType", formData.formType);
    localStorage.setItem(getStorageKey("step"), currentStep);
    localStorage.setItem(getStorageKey("data"), JSON.stringify(formData));
  }, [formData, currentStep]);

  // ✅ Reset local storage for the current form type
  const resetStorage = (type) => {
    const keyPrefix = `appointment_${type || formData.formType}`;
    localStorage.removeItem(`${keyPrefix}_data`);
    localStorage.removeItem(`${keyPrefix}_step`);
  };

  // ✅ Auto-clear all when successfully submitted
  useEffect(() => {
    if (showSuccess) {
      resetStorage(formData.formType);
      localStorage.removeItem("appointment_activeType");
    }
  }, [showSuccess]);

  /* =====================================================
     🔄 Auto Reset When Switching Service Type
  ===================================================== */
  const prevTypeRef = useRef(null);
  useEffect(() => {
    if (!formData.formType) return;
    const currentType = formData.formType;
    const prevType = prevTypeRef.current;

    // When user switches from one service (baptism → confirmation), clear previous type storage
    if (prevType && prevType !== currentType) {
      resetStorage(prevType);
      setFormData({
        formType: currentType,
        service_id: formData.service_id,
        serviceName: formData.serviceName,
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

    if (currentStep === 1) {
      if (!formData.service_id) errs.service_id = "Please select a service";
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
    setFormData({});
    setFormErrors({});
    setCurrentStep(1);
    setShowSuccess(false);
  };

  /* =====================================================
     🚀 Submit Handler
  ===================================================== */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (currentStep !== 4) return;

    setIsSubmitting(true);
    const toastId = toast.loading("Submitting your appointment request...");

    try {
      const payload = {
        service_id: formData.service_id,
        date: formData.preferredDate,
        time: formData.preferredTime,
        name:
          user?.fullName ||
          user?.name ||
          user?.email?.split("@")[0] ||
          "Guest",
        email: formData.email || user?.email,
        contactNumber: formData.phone,
        address: formData.address,
        notes: formData.notes || formData.additionalNotes || null,
      };

      if (formData.formType === "baptism") {
        Object.assign(payload, {
          childFullName: formData.childFullName,
          childDob: formData.childDob,
          childBirthplace: formData.childBirthplace,
          fatherName: formData.fatherName,
          motherMaidenName: formData.motherMaidenName,
          parentsMarriageType: formData.parentsMarriageType,
          sponsors: formData.sponsors || [],
        });
      }

      if (formData.formType === "confirmation") {
        Object.assign(payload, {
          confirmandName: formData.confirmandName,
          age: formData.age,
          fatherName: formData.fatherName,
          motherMaidenName: formData.motherMaidenName,
          parishOrigin: formData.parishOrigin,
          baptizedAt: formData.baptizedAt,
          baptizedOn: formData.baptizedOn,
          sponsors: formData.sponsors || [],
        });
      }

      const { data } = await api.post("/appointments", payload);

      setFormData((prev) => ({
        ...prev,
        appointmentId: data.appointmentId,
        serviceName: data.serviceName || prev.serviceName,
      }));

      toast.success("Appointment submitted successfully!", { id: toastId });
      setShowSuccess(true);
    } catch (error) {
      toast.dismiss(toastId);

      // If backend returns field-specific errors
      if (error?.response?.data?.errors) {
        const fieldErrors = {};
        error.response.data.errors.forEach(({ field, message }) => {
          fieldErrors[field] = message;
        });
        setFormErrors(fieldErrors);

        // If backend returns a general error message
      } else if (error?.response?.data?.error) {
        toast.error(error.response.data.error);

        // Fallback for network or unknown errors
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
        return (
          <Step1Service
            formData={formData}
            setFormData={setFormData}
            formErrors={formErrors}
          />
        );
      case 2:
        return (
          <Step2DateTime
            formData={formData}
            setFormData={setFormData}
            formErrors={formErrors}
          />
        );
      case 3:
        return (
          <Step3Form
            formData={formData}
            setFormData={setFormData}
            registerValidator={registerValidator}
            formErrors={formErrors}
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



  // Track the latest form type for cleanup
  const formTypeRef = useRef(formData.formType);

  useEffect(() => {
    formTypeRef.current = formData.formType;
  }, [formData.formType]);

  // Clear storage on unmount
  useEffect(() => {
    return () => {
      if (formTypeRef.current) resetStorage(formTypeRef.current);
      localStorage.removeItem("appointment_activeType");
    };
  }, []);



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
