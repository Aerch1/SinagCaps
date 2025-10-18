import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../../store/authStore.js";
import HeroBanner from "../../../components/section/HeroBanner.jsx";
import toast from "react-hot-toast";
import api from "@/api/api"; // ✅ centralized axios

const HERO_IMG = "/forgot.jpg";

export default function GeneralInformation() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState(null);
  const [showModal, setShowModal] = useState(false);

  /* -------------------- 🔹 Fetch Services + Requirements -------------------- */
  useEffect(() => {
    const fetchServices = async () => {
      try {
        // ✅ Correct public route
        const res = await api.get("public/services");
        if (res.data.success) setServices(res.data.services);
      } catch (err) {
        console.error("❌ Failed to fetch services:", err);
        toast.error("Unable to load services.");
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);


  /* -------------------- 🔹 Booking Button -------------------- */
  const goToBooking = (e) => {
    e.preventDefault();
    if (isAuthenticated) {
      navigate("/services/appointments/terms")
    } else {
      toast.error("Please login your account first.");
      setTimeout(() => {
        navigate("/login", { replace: true, state: { from: "/services/appointments/book" } });
      }, 1500);
    }
  };

  /* -------------------- 🔹 Modal Control -------------------- */
  const handleOpenModal = (service) => {
    setSelectedService(service);
    setShowModal(true);
  };
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedService(null);
  };


  return (
    <main className="bg-white">
      {/* Full-width hero */}
      <HeroBanner title="General Information" imageSrc={HERO_IMG} />

      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* LEFT: one clean container with good spacing */}
          <section className="lg:col-span-2 overflow-hidden ">
            {/* header */}
            <header className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-md font-medium text-gray-900">
                GENERAL INFORMATION FOR MAKING A CHURCH APPOINTMENT
              </h2>
              <p className="text-xs text-gray-600">Please read carefully before booking.</p>
            </header>

            {/* Important reminder */}
            <div className="px-6 py-5 border-b border-gray-200">
              <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
                <h3 className="text-sm font-semibold text-amber-900">
                  Important Reminder (For All Services)
                </h3>
                <ul className="mt-2 list-disc pl-5 text-sm text-amber-900 space-y-1 leading-6">
                  <li>
                    If your service requires a seminar (e.g., Pre-Baptism, Pre-Cana/Marriage Prep, RCIA/Catechesis), <span className="font-medium">attendance and punctuality are mandatory</span>.
                  </li>
                  <li>
                    <span className="font-medium">Failure to attend or complete the required seminar</span> will result in <span className="font-medium">cancellation or rescheduling</span> of your appointment.
                  </li>
                  <li>
                    <span className="font-medium">Fees are paid only at the parish/church office cashier on-site.</span> Do not pay fixers or unauthorized coordinators.
                  </li>
                  <li>
                    Booking is confirmed only after requirements are verified and (when applicable) the required seminar is completed.
                  </li>
                </ul>
              </div>
            </div>

            {/* Church Records and Sacraments */}
            <div className="px-6 py-6 border-b border-gray-200 space-y-4">
              <h3 className="font-semibold text-gray-900">Church Records and Sacraments</h3>
              <p className="text-sm leading-6 text-gray-800">
                Church records such as baptismal, confirmation, and marriage certificates are sacred and protected
                documents. Any form of falsification, unauthorized duplication, or destruction of these records is
                strictly prohibited. Doing so may result in the invalidity of the document and denial of services from
                the parish.
              </p>
              <div className="rounded-md border border-red-200 bg-red-50 p-4">
                <p className="text-sm text-red-800">
                  <span className="font-semibold">Warning:</span> The information submitted through appointment forms and
                  supporting documents must be accurate, truthful, and complete. Misrepresentation or submission of fake
                  documents is a violation of Canon Law and applicable civil regulations, and may result in disqualification
                  from receiving sacraments or services.
                </p>
              </div>
            </div>

            {/* Before Booking */}
            <div className="px-6 py-6 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">Before Booking a Church Appointment</h3>
              <ul className="list-disc pl-6 space-y-1 text-sm leading-6 text-gray-800">
                <li>
                  All appointments for sacraments and document requests must be scheduled in advance through the church's
                  official booking system (online or on-site).
                </li>
                <li>Review the list of requirements for each service before choosing a date.</li>
                <li>
                  Personal appearance is required for sacraments such as Baptism, Confirmation, and Weddings. Representatives
                  may not attend in place of the principal.
                </li>
                <li>Parents, sponsors, or couples must attend required seminars or interviews prior to the sacrament date.</li>
                <li>Walk-ins are discouraged and may not be accommodated depending on availability.</li>
                <li>Do not rely on fixers or unauthorized coordinators. Book directly with the parish office.</li>
                <li>Bring original documents and valid IDs. Incomplete requirements may lead to rescheduling.</li>
                <li>Arrive 15–30 minutes early for verification and orientation.</li>
              </ul>
            </div>

            {/* Attire & Decorum */}
            <div className="px-6 py-6 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">On Attire and Decorum</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Dress Code</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm leading-6 text-gray-800">
                    <li>Wear respectful and decent attire when visiting the church.</li>
                    <li>For baptisms, confirmations, and weddings: white or formal clothes are encouraged.</li>
                    <li>Avoid sleeveless tops, short skirts, or revealing clothing inside the church premises.</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Behavior</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm leading-6 text-gray-800">
                    <li>Keep mobile phones on silent and maintain a reverent attitude on church grounds.</li>
                    <li>Respect the sanctity and solemnity of all transactions.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* After the Appointment */}
            <div className="px-6 py-6 space-y-4">
              <h3 className="font-semibold text-gray-900">After the Appointment</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-md bg-emerald-50 p-4">
                  <h4 className="font-semibold text-emerald-900 mb-1">Certificate Verification</h4>
                  <p className="text-sm text-emerald-800">
                    Double-check issued certificates for correct spelling of names, dates, and other details. Report any
                    errors immediately to the parish office.
                  </p>
                </div>
                <div className="rounded-md bg-blue-50 p-4">
                  <h4 className="font-semibold text-blue-900 mb-1">Collection by Representative</h4>
                  <p className="text-sm text-blue-800">
                    If you cannot personally claim a certificate, a representative may do so with a signed authorization
                    letter and valid ID.
                  </p>
                </div>
              </div>
              <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm text-amber-800">
                  <span className="font-semibold">Important:</span> Unclaimed certificates may be archived or discarded after
                  a certain period (e.g., 6–12 months). Keep official documents in a safe place. Lost or damaged records may
                  require revalidation and an affidavit of loss.
                </p>
              </div>

              {/* Important Notes */}
              <div className="mt-2">
                <h3 className="font-semibold text-gray-900 mb-2">Important Notes</h3>
                <ul className="list-disc pl-6 space-y-1 text-sm leading-6 text-gray-800">
                  <li>Church services are spiritual in nature. Respect the sanctity and solemnity of all transactions.</li>
                  <li>Attempts to bribe, pressure, or manipulate church staff or clergy may lead to cancellation and disciplinary action.</li>
                  <li>The parish may reschedule or decline requests based on availability, compliance, or ecclesiastical considerations.</li>
                </ul>
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <div
              className="border border-gray-200 rounded-xl p-6 sticky top-6 flex flex-col justify-between"
              style={{ minHeight: "520px" }} // ✅ keeps consistent height like static version
            >
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Service Requirements</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Click any service to view documents and specific requirements.
                </p>

                {/* Service List */}
                <div className="flex-1">
                  {loading ? (
                    <ul className="space-y-2 animate-pulse">
                      {[...Array(6)].map((_, i) => (
                        <li
                          key={i}
                          className="h-8 bg-gray-100 rounded-md border border-gray-200"
                        ></li>
                      ))}
                    </ul>
                  ) : services.length > 0 ? (
                    <ul className="space-y-2">
                      {services.map((s) => (
                        <li key={s.id}>
                          <button
                            onClick={() => handleOpenModal(s)}
                            className="w-full text-left block rounded-md border border-gray-200 px-3 py-2 text-sm text-blue-700 hover:text-blue-800 hover:border-blue-300 transition"
                          >
                            {s.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-sm text-gray-500 italic py-4 text-center border rounded-md bg-gray-50">
                      No active services available.
                    </div>
                  )}
                </div>

                <p className="text-xs text-gray-500 mt-4">
                  Note: Requirements may vary by parish/diocese. Bring originals and photocopies.
                </p>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={goToBooking}
                  aria-label="Book a church appointment"
                  className="w-full rounded-md border border-gray-200 bg-secondary text-white px-5 py-3 text-sm font-semibold hover:bg-secondary/90"
                >
                  Book an Appointment
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* ===========================
          📌 MODAL (DB Data)
      ============================ */}
      {showModal && selectedService && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4 py-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative my-auto max-h-[calc(100vh-2rem)] flex flex-col">
            {/* Close Button */}
            <button
              onClick={handleCloseModal}
              className="absolute top-2 right-3 text-gray-500 hover:text-gray-700 text-xl font-bold"
            >
              ×
            </button>

            {/* Header */}
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              {selectedService.name} Requirements
            </h2>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {selectedService.requirements?.length ? (
                <ul className="list-disc pl-5 space-y-2 text-sm text-gray-800">
                  {selectedService.requirements.map((r) => (
                    <li key={r.id}>
                      {r.name}{" "}
                      {r.is_mandatory && (
                        <span className="text-red-500 text-xs font-medium">(Required)</span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-gray-500 italic">
                    No specific requirements for this service.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <p className="text-xs text-gray-500 mt-4">
              Bring both original and photocopy of each document during verification.
            </p>

            <div className="mt-5 text-right">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}