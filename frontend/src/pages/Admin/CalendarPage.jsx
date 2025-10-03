"use client";

import { useState } from "react";
import Card from "../../components/common/Card";
import Calendar from "../../components/common/Calendar";
import TodaySchedule from "../../components/common/TodaySchedule";
import UpcomingEvents from "../../components/common/UpcomingEvents";
import ViewAppointmentModal from "../../components/common/modal/ViewAppointmentModal"; // ← add

export default function CalendarPage() {
    const viewOptions = ["Week", "Month"];

    // Appointments shown on calendar + TodaySchedule
    const [appointments, setAppointments] = useState([]);

    // Independent upcoming events (fiesta, holy week, etc.)
    const [events, setEvents] = useState([]);

    // ViewAppointmentModal (page-level) for clicks coming from TodaySchedule
    const [viewOpen, setViewOpen] = useState(false);
    const [viewAppt, setViewAppt] = useState(null);

    const handleTodayItemClick = (appt) => {
        setViewAppt(appt);
        setViewOpen(true);
    };

    // Same shape as your calendar’s fetchAvailableTimes (HH:mm strings)
    const fetchAvailableTimes = async () => mockGenerateTimes("08:00", "17:30", 30);

    return (
        <div className="space-y-4 md:space-y-6 calendar-page-container">
            {/* Header */}
            <div className="flex flex-col gap-3 md:gap-8 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-slate-900">Calendar</h1>
                    <p className="text-xs md:text-sm text-gray-500 mt-1">
                        Manage appointments and schedules
                    </p>
                </div>


            </div>
            {/* Stats */}
            <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
                <Card />
            </div>


            {/* Calendar + Right Column */}
            <div className="grid md:grid-cols-[1fr_320px] gap-4 md:gap-4">
                {/* Calendar */}
                <div>
                    <Calendar
                        appointments={appointments}
                        onAppointmentsChange={setAppointments}
                    />
                </div>

                {/* Right column: two scrollable halves */}
                <div className="grid gap-4 md:grid-rows-2">
                    <TodaySchedule
                        appointments={appointments}
                        onItemClick={handleTodayItemClick}   // ← open modal from list
                        className="h-[50vh]"
                    />
                    <UpcomingEvents
                        events={events}
                        onItemClick={(evt) => console.log("Clicked Upcoming:", evt)}
                        className="h-[50vh]"
                    />
                </div>
            </div>

            {/* ViewAppointmentModal for TodaySchedule clicks */}
            <ViewAppointmentModal
                isOpen={viewOpen}
                onClose={() => setViewOpen(false)}
                appointment={viewAppt}
                onUpdate={(updated) => {
                    setAppointments(prev => prev.map(a => (a.id === updated.id ? { ...a, ...updated } : a)));
                    setViewOpen(false);
                }}
                fetchAvailableTimes={fetchAvailableTimes}
            />
        </div>
    );
}

/* local helper (HH:mm list) */
function mockGenerateTimes(startHHmm = "08:00", endHHmm = "17:30", everyMin = 30) {
    const [sh, sm] = startHHmm.split(":").map(Number);
    const [eh, em] = endHHmm.split(":").map(Number);
    const out = [];
    let h = sh, m = sm;
    while (h < eh || (h === eh && m <= em)) {
        out.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
        m += everyMin;
        while (m >= 60) { m -= 60; h += 1; }
    }
    return out;
}
