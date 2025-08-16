"use client";

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import HeroBanner from "../../../components/HeroBanner";
import Stepper from "../../../components/Stepper";
import Step1ServiceDate from "./steps/Step1ServiceDate";
import Step2PersonalInfo from "./steps/Step2PersonalInfo";
import Step3AdditionalDetails from "./steps/Step3AdditionalDetails";
import Step4ReviewSubmit from "./steps/Step4ReviewSubmit";

const HERO_IMG = "/forgot.jpg";

export default function AppointmentForm() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    serviceType: "",
    preferredDate: "",
    preferredTime: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    purpose: "",
    additionalNotes: "",
    numberOfPeople: 1,
    isUrgent: false,
    agreeToTerms: false,
  });

  const steps = [
    { number: 1, title: "Service & Date", description: "Select service type and preferred date" },
    { number: 2, title: "Personal Info", description: "Enter your contact information" },
    { number: 3, title: "Additional Details", description: "Purpose and other requirements" },
    { number: 4, title: "Review & Submit", description: "Review and submit your request" },
  ];

  const next = () => setCurrentStep((prev) => prev + 1);
  const back = () => setCurrentStep((prev) => prev - 1);

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.serviceType && formData.preferredDate && formData.preferredTime;
      case 2:
        return (
          formData.firstName &&
          formData.lastName &&
          formData.email &&
          formData.phone &&
          formData.address
        );
      case 3:
        return !!formData.purpose;
      case 4:
        return !!formData.agreeToTerms;
      default:
        return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.agreeToTerms) return;

    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 1500));
    setIsSubmitting(false);

    alert("Appointment request submitted!");
    navigate("/appointments/success");
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <Step1ServiceDate formData={formData} setFormData={setFormData} />;
      case 2:
        return <Step2PersonalInfo formData={formData} setFormData={setFormData} />;
      case 3:
        return <Step3AdditionalDetails formData={formData} setFormData={setFormData} />;
      case 4:
        return <Step4ReviewSubmit formData={formData} />;
      default:
        return null;
    }
  };

  return (
    <main className="bg-white">
      <HeroBanner title="Book an Appointment" imageSrc={HERO_IMG} />

      <div className="max-w-6xl mx-auto px-4 lg:px-8 py-12">
        {/* Stepper Header */}
        <Stepper steps={steps} currentStep={currentStep} />

        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200">
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-6">{renderStepContent()}</div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
              <button
                type="button"
                disabled={currentStep === 1}
                onClick={back}
                className="px-4 py-2 text-sm border rounded-md disabled:opacity-50"
              >
                Previous
              </button>

              {currentStep < steps.length ? (
                <button
                  type="button"
                  disabled={!canProceed()}
                  onClick={next}
                  className="px-4 py-2 text-sm text-white bg-emerald-600 rounded-md disabled:opacity-50"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!canProceed() || isSubmitting}
                  className="px-6 py-2 text-sm text-white bg-emerald-600 rounded-md disabled:opacity-50"
                >
                  {isSubmitting ? "Submitting..." : "Submit Appointment Request"}
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="mt-6 text-center">
          <Link to="/appointments/general-info" className="text-sm text-emerald-600 underline">
            ← Back to General Information
          </Link>
        </div>
      </div>
    </main>
  );
}
