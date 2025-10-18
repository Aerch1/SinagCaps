"use client";

import { useState } from "react";
import Card from "../../components/common/Card";
import Calendar from "../../components/common/Calendar";
import TodaySchedule from "../../components/common/TodaySchedule";
import UpcomingEvents from "../../components/common/UpcomingEvents";
import ViewAppointmentModal from "../../components/common/modal/ViewAppointmentModal";
import useChurchHours from "@/hooks/useChurchHours";

export default function CalendarPage() {
  const [appointments, setAppointments] = useState([]);
  const [events, setEvents] = useState([]);
  const [viewOpen, setViewOpen] = useState(false);

  const { churchHours } = useChurchHours();

  const [viewApptId, setViewApptId] = useState(null);

  const handleTodayItemClick = (appointmentId) => {
    setViewApptId(appointmentId);
    setViewOpen(true);
  };


  // Dynamic available times based on church hours
  const fetchAvailableTimes = async (date) => {
    if (!date) return [];
    const day = new Date(date).getDay(); // 0=Sunday
    const hours = churchHours[day];
    if (!hours || hours.is_closed) return [];
    return generateTimes(hours.open_time, hours.close_time, 30);
  };

  return (

    <>
      <div className="w-full max-w-7xl mx-auto space-y-6 sm:space-y-8 lg:space-y-10  pb-8">
        {/* ---------- Header ---------- */}
        <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Calendar</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage appointments, schedules, and upcoming parish events
            </p>
          </div>
        </header>

        {/* ---------- KPI Cards ---------- */}
        <section className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-4">
          <Card />
        </section>

        {/* ---------- Main Grid: Calendar + Right Column ---------- */}
        <main className="grid grid-cols-1 md:grid-cols-[1fr_350px] gap-5 lg:gap-6">
          {/* Left: Calendar */}
          <div className="w-full bg-white rounded-xl border border-gray-200 shadow-sm p-3 sm:p-4 md:p-5">
            <Calendar
              appointments={appointments}
              onAppointmentsChange={setAppointments}
            />
          </div>

          {/* Right: Today Schedule + Upcoming Events */}
          <aside className="flex flex-col gap-4 sm:gap-3">
            <TodaySchedule
              appointments={appointments}
              onItemClick={handleTodayItemClick}
              className="flex-1 min-h-[300px] md:min-h-[45vh]"
            />

            <UpcomingEvents
              events={events}
              onItemClick={(evt) => console.log("Clicked Upcoming:", evt)}
              className="flex-1 min-h-[300px] md:min-h-[45vh]"
            />
          </aside>
        </main>
      </div>

      {/* ---------- Appointment View Modal ---------- */}
      <ViewAppointmentModal
        isOpen={viewOpen}
        onClose={() => setViewOpen(false)}
        appointmentId={viewApptId}
        onUpdate={(updated) => {
          setAppointments((prev) =>
            prev.map((a) => (a.id === updated.id ? { ...a, ...updated } : a))
          );
          setViewOpen(false);
        }}
        fetchAvailableTimes={fetchAvailableTimes}
      />
    </>

  );

  /* Utility to generate time slots */
  function generateTimes(startHHmm = "08:00", endHHmm = "17:30", everyMin = 30) {
    const [sh, sm] = startHHmm.split(":").map(Number);
    const [eh, em] = endHHmm.split(":").map(Number);
    const out = [];
    let h = sh,
      m = sm;
    while (h < eh || (h === eh && m <= em)) {
      out.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
      m += everyMin;
      while (m >= 60) {
        m -= 60;
        h += 1;
      }
    }
    return out;
  }
}
