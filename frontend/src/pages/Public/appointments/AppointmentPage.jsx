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
  const [services, setServices] = useState([]);

  // ✅ NEW: File upload state
  const [uploadedFiles, setUploadedFiles] = useState([]);

  // ✅ Track if user manually navigated back to prevent auto-advance
  const [manualNavigation, setManualNavigation] = useState(false);

  const validatorsRef = useRef({});

  const registerValidator = (step, fn) => (validatorsRef.current[step] = fn);

  const steps = [
    { number: 1, title: "Select Service", description: "Choose the type of appointment" },
    { number: 2, title: "Date & Time", description: "Pick an available slot" },
    { number: 3, title: "Personal Info & Details", description: "Fill in service-specific details" },
    { number: 4, title: "Review & Submit", description: "Confirm and send your request" },
  ];

  /* ---------- Load Services ---------- */
  useEffect(() => {
    const loadServices = async () => {
      try {
        const res = await api.get("/public/services");
        setServices(res.data?.services || []);
      } catch (err) {
        console.error("❌ Failed to load services:", err);
        toast.error("Failed to load services. Please try again.");
      }
    };
    loadServices();
  }, []);


  // ✅ ADD THIS NEW USEEFFECT HERE - Handle prefilled data from ServiceAvailabilityPreview
useEffect(() => {
  const prefilled = localStorage.getItem("appointment_prefilled");
  const startStep = localStorage.getItem("appointment_startStep");
  
  if (prefilled && startStep) {
    try {
      const data = JSON.parse(prefilled);
      setFormData(data);
      setCurrentStep(parseInt(startStep));
      setManualNavigation(false); // Prevent auto-advance interference
      
      // Clean up the temporary storage
      localStorage.removeItem("appointment_prefilled");
      localStorage.removeItem("appointment_startStep");
      
      toast.success(`Continuing appointment for ${data.serviceName}`);
    } catch (err) {
      console.error("❌ Failed to load prefilled data:", err);
      toast.error("Failed to load appointment details");
    }
  }
}, [services]); // Run after services are loaded

  /* =====================================================
     🧠 LocalStorage Isolation per Service (Safe Version)
  ===================================================== */
  const getStorageKey = (suffix) => {
    const type = formData.formType || "default";
    return `appointment_${type}_${suffix}`;
  };

  useEffect(() => {
    const loadSavedData = async () => {

      const hasPrefilled = localStorage.getItem("appointment_prefilled");
      if (hasPrefilled) return;

      const savedType = localStorage.getItem("appointment_activeType");
      if (!savedType) return;

      const stepKey = `appointment_${savedType}_step`;
      const dataKey = `appointment_${savedType}_data`;
      const savedStep = parseInt(localStorage.getItem(stepKey)) || 1;
      const savedData = JSON.parse(localStorage.getItem(dataKey) || "{}");

      try {
        const validIds = services.map((s) => s.id);
        if (!savedData.service_id || !validIds.includes(savedData.service_id)) {
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
  }, [services]);

  // Persist per-service data & step
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
      setUploadedFiles([]); // ✅ Clear files on success
    }
  }, [showSuccess]);

  /* =====================================================
     🔄 Auto Reset When Switching Service Type
  ===================================================== */
  const prevTypeRef = useRef(null);
  useEffect(() => {
    const prevService = prevTypeRef.current;
    const currentService = formData.service_id;

    if (prevService && prevService !== currentService && formData.formType) {
      resetStorage(prevService);
      setUploadedFiles([]); // ✅ Clear files when switching service
      setFormData(prev => ({
        ...prev,
        preferredDate: "",
        preferredTime: "",
        extraData: {},
        service_id: currentService,
        serviceName: formData.serviceName,
        formType: formData.formType || "default"
      }));
      setCurrentStep(2);
    }

    prevTypeRef.current = currentService;
  }, [formData.service_id, formData.formType]);


  /* =====================================================
     🧩 Validation Handling
  ===================================================== */
  const runStepValidation = () => {
    let errs = {};
    if (currentStep === 1 && !formData.service_id) errs.service_id = "Please select a service";
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

  const next = () => {
    if (!runStepValidation()) return;
    setCurrentStep((s) => Math.min(s + 1, steps.length));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const back = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    setFormErrors({});
    setManualNavigation(true); // ✅ Mark as manual navigation
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ✅ Auto-advance to Step 2 when service is selected
  useEffect(() => {
    if (currentStep === 1 && formData.service_id && !showSuccess && !manualNavigation) {
      // Small delay to allow the selection to be visible before transitioning
      const timer = setTimeout(() => {
        setCurrentStep(2);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [formData.service_id, currentStep, showSuccess, manualNavigation]);

  const resetForm = () => {
    resetStorage(formData.formType);
    setFormData({});
    setFormErrors({});
    setUploadedFiles([]);
    setCurrentStep(1);
    setShowSuccess(false);
    setManualNavigation(false); // ✅ Reset manual navigation flag
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (currentStep !== 4) return;

    setIsSubmitting(true);
    const toastId = toast.loading("Submitting your appointment request...");

    try {
      const formDataToSend = new FormData();

      // ✅ IMPROVED: Smart name selection based on login status and form type
      let displayName;

      if (user?.fullName || user?.name) {
        // User is logged in - use their account name
        displayName = user.fullName || user.name;
      } else {
        // User is guest - use name from form based on service type
        switch (formData.formType) {
          case "baptism":
            // ✅ UPDATED: Handle multiple children
            const firstChild = formData.children?.[0];
            if (formData.children?.length > 1) {
              displayName = `${firstChild?.fullName || "Guest"} +${formData.children.length - 1} more`;
            } else {
              displayName = firstChild?.fullName || formData.childFullName || "Guest";
            }
            break;
          case "confirmation":
            displayName = formData.confirmandName || "Guest";
            break;
          default:
            // For default/other services
            displayName = formData.firstName && formData.lastName
              ? `${formData.firstName} ${formData.lastName}`.trim()
              : "Guest";
            break;
        }
      }

      // Add basic fields
      formDataToSend.append("service_id", formData.service_id);
      formDataToSend.append("date", formData.preferredDate);
      formDataToSend.append("time", formData.preferredTime);
      formDataToSend.append("name", displayName);
      formDataToSend.append("email", formData.email || user?.email);
      formDataToSend.append("contactNumber", formData.phone);
      formDataToSend.append("address", formData.address);
      formDataToSend.append("notes", formData.notes || formData.additionalNotes || "");

      // ✅ UPDATED: Add baptism fields with children array support
      if (formData.formType === "baptism") {
        // ✅ Send children array (new approach)
        if (formData.children && Array.isArray(formData.children)) {
          formDataToSend.append("children", JSON.stringify(formData.children));
        }
        // ✅ Backward compatibility: single child fields
        else if (formData.childFullName) {
          formDataToSend.append("childFullName", formData.childFullName);
          formDataToSend.append("childDob", formData.childDob);
          formDataToSend.append("childBirthplace", formData.childBirthplace);
        }

        // Parent fields (always sent)
        formDataToSend.append("fatherName", formData.fatherName);
        formDataToSend.append("motherMaidenName", formData.motherMaidenName);
        formDataToSend.append("parentsMarriageType", formData.parentsMarriageType);
        formDataToSend.append("sponsors", JSON.stringify(formData.sponsors || []));
      }

      // ✅ Add confirmation fields if applicable
      if (formData.formType === "confirmation") {
        formDataToSend.append("confirmandName", formData.confirmandName);
        formDataToSend.append("age", formData.age);
        formDataToSend.append("fatherName", formData.fatherName);
        formDataToSend.append("motherMaidenName", formData.motherMaidenName);
        formDataToSend.append("parishOrigin", formData.parishOrigin);
        formDataToSend.append("baptizedAt", formData.baptizedAt);
        formDataToSend.append("baptizedOn", formData.baptizedOn);
        formDataToSend.append("sponsors", JSON.stringify(formData.sponsors || []));
      }

      // ✅ Add default service fields (firstName, lastName) if applicable
      if (formData.formType === "default" || !formData.formType) {
        if (formData.firstName) formDataToSend.append("firstName", formData.firstName);
        if (formData.lastName) formDataToSend.append("lastName", formData.lastName);
      }

      // ✅ Append files
      uploadedFiles.forEach((file) => {
        formDataToSend.append("files", file);
      });

      const { data } = await api.post("/appointments", formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
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
        return (
          <Step1Service
            formData={formData}
            setFormData={setFormData}
            formErrors={formErrors}
            services={services}
            setManualNavigation={setManualNavigation} // ✅ Pass down to reset flag
          />
        );
      case 2:
        return (
          <Step2DateTime
            formData={formData}
            setFormData={setFormData}
            formErrors={formErrors}
            services={services}
          />
        );
      case 3:
        return (
          <Step3Form
            formData={formData}
            setFormData={setFormData}
            registerValidator={registerValidator}
            formErrors={formErrors}
            // ✅ NEW: Pass file upload props
            uploadedFiles={uploadedFiles}
            setUploadedFiles={setUploadedFiles}
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
            // ✅ NEW: Pass files for review
            uploadedFiles={uploadedFiles}
          />
        );
      default:
        return null;
    }
  };

  const formTypeRef = useRef(formData.formType);
  useEffect(() => {
    formTypeRef.current = formData.formType;
  }, [formData.formType]);

  useEffect(() => {
    return () => {
      if (formTypeRef.current) resetStorage(formTypeRef.current);
      localStorage.removeItem("appointment_activeType");
    };
  }, []);

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