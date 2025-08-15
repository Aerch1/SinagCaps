// src/pages/Public/appointments/GeneralInformation.jsx
"use client";

import { Link } from "react-router-dom";
import HeroBanner from "../../../components/HeroBanner";

// Your banner image
const HERO_IMG = "/forgot.jpg";

export default function GeneralInformation() {
  return (
    <main className="bg-white">
      {/* full-width hero */}
      <HeroBanner title="General Information" imageSrc={HERO_IMG} />

      {/* content container */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12 lg:py-8">
        <section className="overflow-hidden ">
          {/* header (no icon) */}
          <div className="px-6 py-5 border-b border-gray-200">
            <div className="text-sm font-medium text-gray-900">
              GENERAL INFORMATION FOR MAKING A CHURCH APPOINTMENT
            </div>
            <div className="text-xs text-gray-600">
              Please read carefully before booking.
            </div>
          </div>

          {/* body */}
          <div className="px-6 py-6 space-y-6 text-sm leading-6 text-gray-800">
            <section className="space-y-2">
              <h3 className="font-semibold">Church Records and Sacraments</h3>
              <p>
                Church records such as baptismal, confirmation, and marriage certificates are
                sacred and protected documents. Any form of falsification, unauthorized
                duplication, or destruction of these records is strictly prohibited. Doing so may
                result in the invalidity of the document and denial of services from the parish.
              </p>
              <p>
                The information submitted through appointment forms and supporting documents must
                be accurate, truthful, and complete. Misrepresentation or submission of fake
                documents is a violation of Canon Law and applicable civil regulations, and may
                result in disqualification from receiving sacraments or services.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold">Before Booking a Church Appointment</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  All appointments for sacraments and document requests must be scheduled in
                  advance through the church’s official booking system (online or on-site).
                </li>
                <li>
                  Walk-ins are discouraged and may not be accommodated depending on the priest’s
                  or parish’s availability.
                </li>
                <li>Review the list of requirements for each service before choosing a date.</li>
                <li>
                  Personal appearance is required for sacraments such as Baptism, Confirmation,
                  and Weddings. Representatives may not attend in place of the principal.
                </li>
                <li>
                  Parents, sponsors, or couples must attend required seminars or interviews prior
                  to the sacrament date.
                </li>
                <li>
                  Do not rely on fixers or unauthorized coordinators. All bookings must be made
                  directly with the parish office.
                </li>
                <li>
                  Bring all original documents and valid IDs on the appointment day.
                  Incomplete requirements may lead to rescheduling.
                </li>
                <li>Arrive 15–30 minutes early for verification and orientation.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold">On Attire and Decorum</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Wear respectful and decent attire when visiting the church.</li>
                <li>For baptisms, confirmations, and weddings: white or formal clothes are encouraged.</li>
                <li>
                  Avoid sleeveless tops, short skirts, or revealing clothing inside the church premises.
                </li>
                <li>Keep mobile phones on silent and maintain a reverent attitude on church grounds.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold">After the Appointment</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  Double-check issued certificates for correct spelling of names, dates, and
                  other details. Report any errors immediately to the parish office.
                </li>
                <li>
                  If you cannot personally claim a certificate, a representative may do so with
                  a signed authorization letter and valid ID.
                </li>
                <li>Unclaimed certificates may be archived or discarded after a certain period (e.g., 6–12 months).</li>
                <li>
                  Keep official documents in a safe place. Lost or damaged records may require
                  revalidation and an affidavit of loss.
                </li>
              </ul>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold">Important Notes</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Church services are spiritual in nature. Respect the sanctity and solemnity of all transactions.</li>
                <li>
                  Attempts to bribe, pressure, or manipulate church staff or clergy may lead to
                  cancellation of the appointment and disciplinary action.
                </li>
                <li>
                  The parish reserves the right to reschedule or decline requests based on
                  availability, compliance, or ecclesiastical considerations.
                </li>
              </ul>
            </section>
          </div>

          {/* footer action */}
          <div className="px-6 pb-8">
            <Link
              to="/appointments/book"
              className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              Book an appointment
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
