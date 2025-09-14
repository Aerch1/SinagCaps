"use client"

import { useEffect, useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import toast from "react-hot-toast" // Added toast import
import HeroBanner from "../../../components/section/HeroBanner.jsx"
import Stepper from "../../../components/ui/Stepper"

// Steps
import Step1Service from "./steps/Step1ServiceDate.jsx"
import Step2DateTime from "./steps/Step2PersonalInfo.jsx"
import Step3ContactAndDetails from "./steps/Step3AdditionalDetails.jsx"
import Step4ReviewSubmit from "./steps/Step4ReviewSubmit.jsx"

const HERO_IMG = "/forgot.jpg"

const initialFormData = {
  serviceType: "",
  preferredDate: "",
  preferredTime: "",
  // personal + details
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address: "",
  purpose: "",
  additionalNotes: "",
  numberOfPeople: 1,
  isUrgent: false,
  agreeToTerms: true,
}

export default function AppointmentForm() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const [formData, setFormData] = useState(initialFormData)

  const steps = [
    { number: 1, title: "Select Service", description: "Choose the type of appointment" },
    { number: 2, title: "Date & Time", description: "Pick an available slot" },
    { number: 3, title: "Personal Info & Details", description: "Your contact and request info" },
    { number: 4, title: "Review & Submit", description: "Confirm and send your request" },
  ]

  // validator registry (Step 3 registers here)
  const validatorsRef = useRef({})
  const registerValidator = (step, fn) => {
    validatorsRef.current[step] = fn
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return !!formData.serviceType
      case 2:
        return !!formData.preferredDate && !!formData.preferredTime
      case 4:
        return true
      default:
        return false
    }
  }

  const next = () => {
    if (currentStep === 3) {
      const ok = validatorsRef.current[3]?.()
      if (!ok) {
        toast.error("Please fill in all required fields correctly")
        return
      }
    } else {
      if (!canProceed()) {
        toast.error("Please complete all required fields")
        return
      }
    }
    setCurrentStep((s) => Math.min(s + 1, steps.length))
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const back = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // Final submit -> open modal (no route change here)
  const handleSubmit = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)

    const loadingToast = toast.loading("Submitting your appointment request...")

    try {
      // TODO: replace with real API call
      await new Promise((r) => setTimeout(r, 1500))

      toast.success("Appointment request submitted successfully!", {
        id: loadingToast,
        duration: 4000,
      })

      setShowSuccess(true)
    } catch (error) {
      toast.error("Failed to submit appointment. Please try again.", {
        id: loadingToast,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Modal behaviors
  const goHome = () => {
    setShowSuccess(false)
    navigate("/")
  }

  const makeAnother = () => {
    setShowSuccess(false)
    setFormData(initialFormData)
    setCurrentStep(1)
    toast.success("Ready for your next appointment!")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // Close on Escape
  useEffect(() => {
    if (!showSuccess) return
    const onKey = (e) => {
      if (e.key === "Escape") goHome()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [showSuccess])

  // prevent Enter from submitting unless on the last step (we're not using native submit anyway)
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && currentStep !== steps.length) e.preventDefault()
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <Step1Service formData={formData} setFormData={setFormData} />
      case 2:
        return <Step2DateTime formData={formData} setFormData={setFormData} />
      case 3:
        return (
          <Step3ContactAndDetails formData={formData} setFormData={setFormData} registerValidator={registerValidator} />
        )
      case 4:
        return <Step4ReviewSubmit formData={formData} />
      default:
        return null
    }
  }

  const nextDisabled = currentStep !== 3 && !canProceed()

  return (
    <main className="bg-gray-50 min-h-screen">
      <HeroBanner title="Book an Appointment" imageSrc={HERO_IMG} />

      <div className="max-w-6xl mx-auto px-4 lg:px-8 py-8">
        <div className="mb-8">
          <Stepper steps={steps} currentStep={currentStep} />
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Keep <form> for layout/keyboard; do NOT use native submit */}
          <form onKeyDown={handleKeyDown} noValidate>
            <div className="p-6 md:p-8">{renderStepContent()}</div>

            <div className="px-6 md:px-8 py-6 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row justify-between gap-4">
              <button
                type="button"
                disabled={currentStep === 1}
                onClick={back}
                className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                ← Previous
              </button>

              {currentStep < steps.length ? (
                <button
                  type="button"
                  disabled={nextDisabled}
                  onClick={(e) => {
                    e.currentTarget.blur()
                    next()
                  }}
                  className="px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-8 py-3 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    "Submit Appointment Request"
                  )}
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="mt-6 text-center">
          <Link
            to="/services/generalinfo"
            className="text-sm text-blue-600 hover:text-blue-800 underline transition-colors"
          >
            ← Back to General Information
          </Link>
        </div>
      </div>

      {/* Success Modal */}
      <SuccessModal open={showSuccess} onClose={goHome} onAnother={makeAnother} />
    </main>
  )
}

/* ---------- Modal Component (inline) ---------- */
function SuccessModal({ open, onClose, onAnother }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50" aria-modal="true" role="dialog" aria-labelledby="success-title">
      {/* overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* panel */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-200 p-8"
          onClick={(e) => e.stopPropagation()}
        >
          {/* close button */}
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 inline-flex items-center justify-center h-10 w-10 rounded-full text-gray-400 hover:text-gray-600  focus:outline-none focus:ring-2 focus:ring-gray-400/40 transition-colors"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path
                fillRule="evenodd"
                d="M10 8.586l4.95-4.95a1 1 0 111.415 1.415L11.415 10l4.95 4.95a1 1 0 01-1.415 1.415L10 11.415l-4.95 4.95a1 1 0 01-1.415-1.415L8.585 10l-4.95-4.95A1 1 0 115.05 3.636L10 8.586z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
              <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h1 id="success-title" className="text-2xl font-bold text-gray-900 mb-4">
              Thank You!
            </h1>

            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              We have received your appointment request and will contact you within 24–48 hours to confirm your
              appointment.
            </p>

            {/* actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                type="button"
                onClick={onAnother}
                className="bg-primary/80 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-colors"
              >
                Book another appointment
              </button>

              <button
                type="button"
                onClick={onClose}
                className="bg-gray-200/80  text-slate-600 px-6  border-sm border-gray-400 py-3 rounded-lg font-medium hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400/40 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
