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
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const calendarRef = useRef(null);

  /* =====================================================
     🔹 Fetch Services & Appointments
  ===================================================== */
  const fetchData = async () => {
    try {
      const [servicesRes, appointmentsRes] = await Promise.all([
        api.get("/admin/services"),
        api.get("/admin/appointments?status=pending,approved,completed"),
      ]);

      if (servicesRes.data.success) setServices(servicesRes.data.services || []);
      if (appointmentsRes.data.success)
        setAppointments(appointmentsRes.data.data || []);
    } catch (err) {
      console.error("❌ Error fetching data:", err);
    }
  };

  useEffect(() => {
    fetchData();
    setTodayLabel(
      new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    );
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
     🔹 Handlers
  ===================================================== */
  const handleDateClick = useCallback((arg) => {
    setSelectedDate(arg.date);
    setIsCreateModalOpen(true);
  }, []);

  const handleEventClick = useCallback((clickInfo) => {
    setSelectedAppointmentId(clickInfo.event.id);
    setViewOpen(true);
  }, []);

  const handleAppointmentSaved = () => fetchData();

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
    };

    const bgColor = statusColors[status?.toLowerCase()] || "#64748b";

    return (
      <div
        className="flex flex-col h-full w-full px-2 py-1.5 overflow-hidden rounded-md"
        style={{ backgroundColor: bgColor }}
      >
        <div className="font-semibold text-white text-xs truncate">
          {serviceName}
        </div>
        {!isShort && name && (
          <div className="text-white/90 text-[0.6875rem] truncate mt-0.5">
            {name}
          </div>
        )}
        {!isShort && time && (
          <div className="text-white/70 text-[0.625rem] mt-0.5">{time}</div>
        )}
      </div>
    );
  };

  /* =====================================================
     🔹 Render Calendar
  ===================================================== */
  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Header */}
      <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 sm:p-5 mb-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          {/* Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => calendarRef.current?.getApi().prev()}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => calendarRef.current?.getApi().today()}
              className="px-4 py-2 text-sm font-medium bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
            >
              Today
            </button>
            <button
              onClick={() => calendarRef.current?.getApi().next()}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Calendar Title */}
          <h2 className="text-base font-semibold text-slate-900 flex-1 text-center truncate">
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
                {
                  value: "Pending",
                  label: (
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
                      Pending
                    </div>
                  ),
                },
                {
                  value: "Approved",
                  label: (
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                      Approved
                    </div>
                  ),
                },
                {
                  value: "Completed",
                  label: (
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                      Completed
                    </div>
                  ),
                },
                {
                  value: "Cancelled",
                  label: (
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                      Cancelled
                    </div>
                  ),
                },
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
              className={`w-full px-3 py-1.5 text-sm font-semibold rounded-md ${currentView === opt.value
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      {/* Calendar */}
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

      {/* Modals */}
      <CreateAppointmentModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setSelectedDate(null);
        }}
        onSave={handleAppointmentSaved}
        selectedDate={selectedDate}
      />

      <ViewAppointmentModal
        isOpen={viewOpen}
        onClose={() => setViewOpen(false)}
        appointmentId={selectedAppointmentId}
        onUpdate={(updated) => {
          handleAppointmentSaved(); // always refresh calendar

          // ✅ Only refresh TodaySchedule if the appointment is approved AND the date is today
          const isToday = (() => {
            if (!updated?.date) return false;
            const today = new Date();
            const apptDate = new Date(updated.date);
            return (
              apptDate.getFullYear() === today.getFullYear() &&
              apptDate.getMonth() === today.getMonth() &&
              apptDate.getDate() === today.getDate()
            );
          })();

          if (updated?.status?.toLowerCase() === "approved" && isToday) {
            setRefreshKey((k) => k + 1);
          }
        }}
      />

    </div>
  );
}
