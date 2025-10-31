// src/pages/Public/appointments/AppointmentTerms.jsx
"use client";

import { useState, useCallback, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "../../../store/authStore.js";
import HeroBanner from "../../../components/section/HeroBanner.jsx";
import toast from "react-hot-toast";

const HERO_IMG = "/forgot.jpg";

export default function AppointmentTerms() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [agreed, setAgreed] = useState(false);
  const [showAgreeModal, setShowAgreeModal] = useState(false);

  const proceedCore = useCallback(() => {
    if (!isAuthenticated) {
      navigate("/services/appointments/book");
    } else {
      toast.error("Please login your account first.");
      setTimeout(() => {
        navigate("/login", { replace: true, state: { from: "/services/appointments/book" } });
      }, 1200);
    }
  }, [isAuthenticated, navigate]);

  const handleProceed = () => {
    if (!agreed) {
      setShowAgreeModal(true);
      return;
    }
    proceedCore();
  };

  const closeAgreeModal = () => setShowAgreeModal(false);
  const agreeAndProceed = () => {
    setAgreed(true);
    setShowAgreeModal(false);
    proceedCore();
  };

  // Close modal on Escape
  useEffect(() => {
    if (!showAgreeModal) return;
    const onKey = (e) => e.key === "Escape" && setShowAgreeModal(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [showAgreeModal]);

  return (
    <main className="bg-white min-h-screen">
      <HeroBanner title="Appointment Terms & Conditions" imageSrc={HERO_IMG} />

      <div className="max-w-3xl mx-auto px-6 lg:px-8 py-12">
        {/* Reminder (simple paragraph) */}
        <section className="border-l-4 border-red-500 pl-4 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Reminder</h2>
          <p className="text-sm text-gray-700 leading-6">
            Use a working email address you can access—Gmail is recommended to avoid
            compatibility issues. Email delivery can vary depending on your provider, location,
            and email server policies. Keep your phone number active and check your inbox and spam
            for parish updates.
          </p>
        </section>

        {/* Terms & Conditions (all paragraphs, no bullets or per-item titles) */}
        <section>
          <h3 className="text-center text-2xl font-semibold text-gray-900">TERMS AND CONDITIONS</h3>

          <div className="mt-6 space-y-4 text-sm text-gray-800 leading-6">
            <p>
              This appointment and scheduling system allocates slots on a <strong>first-come,
                first-served</strong> basis. A submitted request is considered pending and will only be
              confirmed after requirements are reviewed and verified by the parish office.
            </p>

            <p>
              You are responsible for supplying complete and accurate information. The parish may
              reschedule, deny, or cancel requests that contain incorrect, inconsistent, or
              misleading details, or when requirements are incomplete at the time of verification.
            </p>

            <p>
              If the parish uses advance payment or booking deposits, such payments are
              <strong> non-refundable</strong>. Amounts may be forfeited for no-shows on confirmed
              appointments, cancellations made by the applicant, applications rejected due to
              inconsistencies or incorrect information, or presentation of discrepant or spurious
              documents.
            </p>

            <p>
              By proceeding, you give your clear consent to the collection and processing of your
              personal data for parish scheduling, verification, and records management in
              accordance with diocesan policies and the Data Privacy Act of 2012 and its
              Implementing Rules and Regulations.
            </p>
          </div>
        </section>

        {/* Consent + Actions */}
        <section className="mt-8">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <span className="text-sm text-gray-800">
              I have read and agree to the Terms & Conditions and consent to information processing.
            </span>
          </label>

          <div className="mt-6 flex flex-col sm:flex-row items-center gap-4">
            <button
              onClick={handleProceed}
              className="w-full sm:w-auto px-6 py-3 text-sm font-semibold rounded-md text-white bg-emerald-600 hover:bg-emerald-700 transition"
            >
              Proceed to Appointment
            </button>

            <Link
              to="/services/generalinfo"
              className="w-full sm:w-auto px-6 py-3 text-sm font-semibold rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition text-center"
            >
              Back to General Information
            </Link>
          </div>
        </section>
      </div>

      {/* Simple Agree Modal (also paragraph-only) */}
      {showAgreeModal && (
        <div
          className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-[1px] grid place-items-center px-4"
          role="dialog"
          aria-modal="true"
          onClick={closeAgreeModal}
        >
          <div
            className="w-full max-w-md rounded-lg bg-white shadow-xl border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-gray-100">
              <h4 className="text-base font-semibold text-gray-900">Agreement Required</h4>
            </div>

            <div className="px-6 py-4 text-sm text-gray-700 space-y-3">
              <p>
                To continue with booking, please confirm that you agree to the Terms & Conditions
                and consent to the processing of your information for parish scheduling and records.
              </p>
              <p>
                Slots are first-come, first-served; information must be accurate; any advance
                payments may be non-refundable; and your data will be processed per diocesan
                policies and the Data Privacy Act of 2012.
              </p>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={closeAgreeModal}
                className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={agreeAndProceed}
                className="px-4 py-2 text-sm rounded-md text-white bg-secondary hover:bg-secondary/90"
              >
                I Agree & Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
