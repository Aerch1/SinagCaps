"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import api from "@/api/api";
import FilterDropdown from "@/components/ui/FilterDropdown.jsx";
import CreateAppointmentModal from "@/components/common/modal/CreateAppointmentModal.jsx";
import ViewAppointmentModal from "@/components/common/modal/ViewAppointmentModal.jsx";

const VIEW_OPTIONS = [
  { value: "dayGridMonth", label: "Month" },
  { value: "timeGridWeek", label: "Week" },
  { value: "timeGridDay", label: "Day" },
];

export default function CalendarComponent() {
  const [currentView, setCurrentView] = useState("dayGridMonth");
  const [selectedService, setSelectedService] = useState("All Services");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [services, setServices] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [todayLabel, setTodayLabel] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  // 🔹 View Details modal
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);

  const calendarRef = useRef(null);

  /* =====================================================
     🔹 Fetch Services & Appointments
  ===================================================== */
  const fetchData = async () => {
    try {
      const [servicesRes, appointmentsRes] = await Promise.all([
        api.get("/admin/services"),
        api.get("/admin/appointments"),
      ]);

      if (servicesRes.data.success)
        setServices(servicesRes.data.services || []);

      if (appointmentsRes.data.success)
        setAppointments(appointmentsRes.data.data || []);
    } catch (err) {
      console.error("❌ Error fetching data:", err);
    }
  };

  useEffect(() => {
    fetchData();
    const today = new Date();
    const formatted = today.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    setTodayLabel(formatted);
  }, []);

  /* =====================================================
     🔹 Filters
  ===================================================== */
  const filteredAppointments = useMemo(() => {
    return appointments.filter((a) => {
      const serviceMatch =
        selectedService === "All Services" || a.serviceName === selectedService;
      const statusMatch =
        selectedStatus === "All Status" ||
        a.status?.toLowerCase() === selectedStatus.toLowerCase();
      return serviceMatch && statusMatch;
    });
  }, [appointments, selectedService, selectedStatus]);

  /* =====================================================
     🔹 Event Handlers
  ===================================================== */
  const handleDateClick = useCallback((arg) => {
    setSelectedDate(arg.date);
    setIsCreateModalOpen(true);
  }, []);

  const handleEventClick = useCallback((clickInfo) => {
    const appointmentId = clickInfo.event.id;
    setSelectedAppointmentId(appointmentId);
    setViewOpen(true);
  }, []);

  const handleModalClose = () => {
    setIsCreateModalOpen(false);
    setSelectedDate(null);
  };

  const handleAppointmentSaved = () => {
    fetchData();
  };

  /* =====================================================
     🔹 Render Event
  ===================================================== */
  const renderEventContent = (eventInfo) => {
    const { serviceName, name, status } = eventInfo.event.extendedProps;
    const time = eventInfo.timeText;
    const isShort =
      eventInfo.event.end &&
      eventInfo.event.start &&
      eventInfo.event.end - eventInfo.event.start < 3600000;

    const statusColors = {
      pending: "#f59e0b",
      approved: "#3b82f6",
      completed: "#22c55e",
      cancelled: "#ef4444",
      rejected: "#e2e8f0",
      archived: "#94a3b8",
    };

    const bgColor = statusColors[status?.toLowerCase()] || "#64748b";

    return (
      <div
        className="flex flex-col h-full w-full px-2 py-1.5 overflow-hidden rounded-md"
        style={{ backgroundColor: bgColor }}
      >
        <div className="flex items-start gap-1.5 min-w-0">
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-white text-xs leading-tight truncate">
              {serviceName}
            </div>
            {!isShort && name && (
              <div className="text-white/90 text-[0.6875rem] leading-tight truncate mt-0.5">
                {name}
              </div>
            )}
            {!isShort && time && (
              <div className="text-white/70 text-[0.625rem] leading-tight mt-0.5">
                {time}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  /* =====================================================
     🔹 Render Calendar
  ===================================================== */
  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Header Section */}
      <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 sm:p-5 mb-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          {/* Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => calendarRef.current?.getApi().prev()}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => calendarRef.current?.getApi().today()}
              className="px-4 py-2 text-sm font-medium bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => calendarRef.current?.getApi().next()}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Calendar Title */}
          <h2 className="text-base font-semibold text-slate-900 flex-1 text-center min-w-0 truncate">
            {calendarRef.current
              ? calendarRef.current.getApi().view.title
              : todayLabel}
          </h2>

          {/* Filters */}
          <div className="flex items-center gap-3">
            <FilterDropdown
              mode="service"
              selectionMode="single"
              options={[
                { value: "All Services", label: "All Services" },
                ...services.map((s) => ({ value: s.name, label: s.name })),
              ]}
              value={selectedService}
              onChange={setSelectedService}
              buttonLabel="Service"
            />
            <FilterDropdown
              mode="status"
              selectionMode="single"
              options={[
                { value: "All Status", label: "All Status" },
                { value: "Pending", label: "Pending" },
                { value: "Approved", label: "Approved" },
                { value: "Completed", label: "Completed" },
                { value: "Cancelled", label: "Cancelled" },
              ]}
              value={selectedStatus}
              onChange={setSelectedStatus}
              buttonLabel="Status"
            />
          </div>
        </div>

        {/* View Switch */}
        <div className="grid grid-cols-3 gap-1 bg-slate-100 rounded-lg p-1">
          {VIEW_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                setCurrentView(opt.value);
                calendarRef.current?.getApi().changeView(opt.value);
              }}
              className={`w-full px-3 py-1.5 text-sm font-semibold rounded-md transition-all ${
                currentView === opt.value
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      {/* Calendar Container */}
      <div className="bg-white rounded-xl border border-slate-200 p-2 sm:p-4 shadow-sm">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={currentView}
          headerToolbar={false}
          events={filteredAppointments.map((a) => ({
            id: a.id,
            title: a.serviceName,
            start: `${a.date}T${a.time}`,
            extendedProps: a,
          }))}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          eventContent={renderEventContent}
          height="auto"
          nowIndicator
          timeZone="local"
          slotMinTime="08:00:00"
          slotMaxTime="18:00:00"
          allDaySlot={false}
          dayMaxEvents={3}
          eventOverlap={false}
          eventTimeFormat={{ hour: "numeric", minute: "2-digit", hour12: true }}
          slotLabelFormat={{ hour: "numeric", minute: "2-digit", hour12: true }}
        />
      </div>

      {/* Floating Create Button */}
      <button
        onClick={() => setIsCreateModalOpen(true)}
        className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 w-12 h-12 sm:w-14 sm:h-14 bg-secondary hover:bg-secondary/90 text-white rounded-full shadow-lg flex items-center justify-center z-40 transition-all hover:scale-105 active:scale-95"
        aria-label="Create Appointment"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Create Appointment Modal */}
      <CreateAppointmentModal
        isOpen={isCreateModalOpen}
        onClose={handleModalClose}
        onSave={handleAppointmentSaved}
        selectedDate={selectedDate}
      />

      {/* View Appointment Modal */}
      <ViewAppointmentModal
        isOpen={viewOpen}
        onClose={() => setViewOpen(false)}
        appointmentId={selectedAppointmentId}
        onUpdate={handleAppointmentSaved}
      />
    </div>
  );
}
