"use client";

import { useState } from "react";
import Card from "../../components/common/Card";
import Calendar from "../../components/common/Calendar";
import TodaySchedule from "../../components/common/TodaySchedule";
import UpcomingEvents from "../../components/common/UpcomingEvents";
import ViewAppointmentModal from "../../components/common/modal/ViewAppointmentModal";
import useChurchHours from "@/hooks/useChurchHours"; // ✅ dynamic hours

export default function CalendarPage() {
  // Appointments shown on calendar + TodaySchedule
  const [appointments, setAppointments] = useState([]);

  // Independent upcoming events (fiesta, holy week, etc.)
  const [events, setEvents] = useState([]);

  // ViewAppointmentModal (page-level)
  const [viewOpen, setViewOpen] = useState(false);
  const [viewAppt, setViewAppt] = useState(null);

  const { churchHours } = useChurchHours();

  const handleTodayItemClick = (appt) => {
    setViewAppt(appt);
    setViewOpen(true);
  };

  // ✅ Use church hours to build available time slots dynamically
  const fetchAvailableTimes = async (date) => {
    if (!date) return [];
    const day = new Date(date).getDay(); // 0=Sunday
    const hours = churchHours[day];
    if (!hours || hours.is_closed) return [];

    return generateTimes(hours.open_time, hours.close_time, 30); // every 30 min
  };

  return (
    <div className="w-full max-w-full space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:gap-6 sm:flex-row sm:items-center sm:justify-between px-2 sm:px-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">Calendar</h1>
          <p className="text-xs md:text-sm text-gray-500 mt-1">
            Manage appointments and schedules
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6 px-2 sm:px-4">
        <Card />
      </div>

      {/* Calendar + Right Column */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-4 px-2 sm:px-4">
        {/* Calendar */}
        <div className="w-full">
          <Calendar
            appointments={appointments}
            onAppointmentsChange={setAppointments}
          />
        </div>

        {/* Right column */}
        <div className="grid grid-cols-1 gap-4 md:grid-rows-2 w-full">
          <TodaySchedule
            appointments={appointments}
            onItemClick={handleTodayItemClick}
            className="h-[50vh]"
          />
          <UpcomingEvents
            events={events}
            onItemClick={(evt) => console.log("Clicked Upcoming:", evt)}
            className="h-[50vh]"
          />
        </div>
      </div>

      {/* ViewAppointmentModal */}
      <ViewAppointmentModal
        isOpen={viewOpen}
        onClose={() => setViewOpen(false)}
        appointment={viewAppt}
        onUpdate={(updated) => {
          setAppointments((prev) =>
            prev.map((a) => (a.id === updated.id ? { ...a, ...updated } : a))
          );
          setViewOpen(false);
        }}
        fetchAvailableTimes={fetchAvailableTimes}
      />
    </div>
  );


  /* Utility to generate time slots */
  function generateTimes(startHHmm = "08:00", endHHmm = "17:30", everyMin = 30) {
    const [sh, sm] = startHHmm.split(":").map(Number);
    const [eh, em] = endHHmm.split(":").map(Number);
    const out = [];
    let h = sh,
      m = sm;
    while (h < eh || (h === eh && m <= em)) {
      out.push(
        `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
      );
      m += everyMin;
      while (m >= 60) {
        m -= 60;
        h += 1;
      }
    }
    return out;
  }
}