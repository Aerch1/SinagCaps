// src/pages/Public/appointments/AppointmentSuccess.jsx
"use client";

import { Link } from "react-router-dom";
import HeroBanner from "../../../components/HeroBanner";

// Your banner image
const HERO_IMG = "/forgot.jpg";

export default function AppointmentSuccess() {
  return (
    <main className="bg-white">
      {/* full-width hero */}
      <HeroBanner title="Appointment Request Submitted" imageSrc={HERO_IMG} />

      {/* content container */}
      <div className="max-w-4xl mx-auto px-4 lg:px-8 py-12 lg:py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 text-center">
          {/* success icon and message */}
          <div className="px-6 py-12">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 mb-6">
              <svg
                className="h-8 w-8 text-emerald-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Thank You for Your Appointment Request!
            </h1>
            
            <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
              We have received your appointment request and will review it carefully. 
              Our parish staff will contact you within 24-48 hours to confirm your appointment 
              and provide any additional information you may need.
            </p>

            {/* what happens next */}
            <div className="bg-gray-50 rounded-lg p-6 mb-8 max-w-3xl mx-auto">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                What Happens Next?
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="bg-emerald-100 rounded-full h-12 w-12 flex items-center justify-center mx-auto mb-3">
                    <span className="text-emerald-600 font-bold text-lg">1</span>
                  </div>
                  <h3 className="font-medium text-gray-900 mb-2">Review & Confirmation</h3>
                  <p className="text-gray-600">
                    We'll review your request and check availability for your preferred date and time.
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="bg-emerald-100 rounded-full h-12 w-12 flex items-center justify-center mx-auto mb-3">
                    <span className="text-emerald-600 font-bold text-lg">2</span>
                  </div>
                  <h3 className="font-medium text-gray-900 mb-2">Contact You</h3>
                  <p className="text-gray-600">
                    Within 24-48 hours, we'll call or email to confirm your appointment details.
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="bg-emerald-100 rounded-full h-12 w-12 flex items-center justify-center mx-auto mb-3">
                    <span className="text-emerald-600 font-bold text-lg">3</span>
                  </div>
                  <h3 className="font-medium text-gray-900 mb-2">Prepare & Attend</h3>
                  <p className="text-gray-600">
                    We'll provide you with any requirements or preparations needed for your appointment.
                  </p>
                </div>
              </div>
            </div>

            {/* important reminders */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-8 max-w-3xl mx-auto">
              <h2 className="text-lg font-semibold text-amber-800 mb-3">
                Important Reminders
              </h2>
              <ul className="text-sm text-amber-700 space-y-2 text-left max-w-2xl mx-auto">
                <li className="flex items-start">
                  <span className="text-amber-600 mr-2">•</span>
                  Please keep your phone and email accessible for our contact
                </li>
                <li className="flex items-start">
                  <span className="text-amber-600 mr-2">•</span>
                  If you don't hear from us within 48 hours, please call the parish office
                </li>
                <li className="flex items-start">
                  <span className="text-amber-600 mr-2">•</span>
                  Have all required documents ready for your appointment
                </li>
                <li className="flex items-start">
                  <span className="text-amber-600 mr-2">•</span>
                  Arrive 15-30 minutes early on your appointment day
                </li>
              </ul>
            </div>

            {/* action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/appointments/general-info"
                className="bg-emerald-600 text-white px-6 py-3 rounded-md font-medium hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                View General Information
              </Link>
              
              <Link
                to="/"
                className="bg-gray-100 text-gray-700 px-6 py-3 rounded-md font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500/50"
              >
                Return to Home
              </Link>
            </div>

            {/* contact info */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-2">
                Need immediate assistance?
              </p>
              <p className="text-sm text-gray-600">
                Call the parish office at <span className="font-medium">(555) 123-4567</span> or 
                email <span className="font-medium">appointments@parish.org</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
