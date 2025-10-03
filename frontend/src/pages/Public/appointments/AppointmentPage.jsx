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

const HERO_IMG = "/forgot.jpg";

export default function AppointmentPage() {
  const [currentStep, setCurrentStep] = useState(() => {
    return parseInt(localStorage.getItem("appointmentStep")) || 1;
  });
  const [formData, setFormData] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("appointmentData")) || {};
    } catch {
      return {};
    }
  });

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const steps = [
    { number: 1, title: "Select Service", description: "Choose the type of appointment" },
    { number: 2, title: "Date & Time", description: "Pick an available slot" },
    { number: 3, title: "Personal Info & Details", description: "Fill in service-specific details" },
    { number: 4, title: "Review & Submit", description: "Confirm and send your request" },
  ];

  /* ---------- Scroll & persistence ---------- */
  useEffect(() => {
    if (showSuccess) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [showSuccess]);

  useEffect(() => {
    if (!showSuccess) localStorage.setItem("appointmentStep", currentStep);
  }, [currentStep, showSuccess]);

  useEffect(() => {
    if (!showSuccess) localStorage.setItem("appointmentData", JSON.stringify(formData));
  }, [formData, showSuccess]);

  useEffect(() => {
    if (showSuccess) {
      localStorage.removeItem("appointmentStep");
      localStorage.removeItem("appointmentData");
    }
  }, [showSuccess]);

  /* ---------- Validation handling ---------- */
  const validatorsRef = useRef({});
  const registerValidator = (step, fn) => (validatorsRef.current[step] = fn);

  const runStepValidation = () => {
    let errs = {};

    if (currentStep === 1) {
      if (!formData.service_id) {
        errs.service_id = "Please select a service";
      }
    }

    if (currentStep === 2) {
      if (!formData.preferredDate) errs.preferredDate = "Please select a date";
      if (!formData.preferredTime) errs.preferredTime = "Please select a time";
    }

    if (currentStep === 3) {
      // Call BaptismForm’s validator if registered
      const validator = validatorsRef.current[3];
      if (validator) {
        const result = validator();
        if (result !== true) {
          errs = { ...errs, ...result }; // merge all returned field errors
        }
      }
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

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
    setFormData({});
    setFormErrors({});
    setCurrentStep(1);
    setShowSuccess(false);
    localStorage.removeItem("appointmentStep");
    localStorage.removeItem("appointmentData");
  };

  /* ---------- Submit ---------- */
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
          formData.firstName && formData.lastName
            ? `${formData.firstName} ${formData.lastName}`
            : `${formData.fatherName || ""} ${formData.motherMaidenName || ""}`.trim(),
        email: formData.email,
        contactNumber: formData.phone,
        address: formData.address,
        notes: formData.notes || formData.additionalNotes || null,
      };

      if (formData.formType === "baptism") {
        payload.childFullName = formData.childFullName;
        payload.childDob = formData.childDob;
        payload.childBirthplace = formData.childBirthplace;
        payload.fatherName = formData.fatherName;
        payload.motherMaidenName = formData.motherMaidenName;
        payload.parentsMarriageType = formData.parentsMarriageType;
        payload.sponsors = formData.sponsors || [];
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

      if (error?.response?.data?.errors) {
        const fieldErrors = {};
        error.response.data.errors.forEach(({ field, message }) => {
          fieldErrors[field] = message;
        });
        setFormErrors(fieldErrors);
      } else {
        toast.error("Submission failed. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

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
