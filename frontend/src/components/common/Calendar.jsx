"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { ChevronLeft, ChevronRight, Filter, ChevronDown, Plus } from "lucide-react";
import CreateAppointmentModal from "@/components/common/modal/CreateAppointmentModal";
import ViewAppointmentModal from "@/components/common/modal/ViewAppointmentModal";
import api from "@/api/api";

/* ---------- view options ---------- */
const VIEW_OPTIONS = [
    { value: "dayGridMonth", label: "Month" },
    { value: "timeGridWeek", label: "Week" },
    { value: "timeGridDay", label: "Day" },
];

export default function CalendarComponent() {
    const [currentView, setCurrentView] = useState("dayGridMonth");
    const [selectedService, setSelectedService] = useState("All Services");
    const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);

    const [services, setServices] = useState([]);
    const [appointments, setAppointments] = useState([]);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [viewOpen, setViewOpen] = useState(false);
    const [viewAppt, setViewAppt] = useState(null);

    const calendarRef = useRef(null);

    /* ---------- fetch services ---------- */
    useEffect(() => {
        api.get("/admin/services")
            .then(res => {
                if (res.data.success) {
                    setServices(res.data.services || []);
                }
            })
            .catch(err => console.error("❌ Failed to fetch services:", err));
    }, []);

    /* ---------- fetch appointments ---------- */
    useEffect(() => {
        api.get("/admin/appointments")
            .then(res => {
                if (res.data.data) {
                    const events = res.data.data.map(a => ({
                        id: a.id,
                        serviceType: a.serviceName,
                        clientName: a.name,
                        status: a.status,
                        start: `${a.date}T${a.time}`, // Combine date+time
                        backgroundColor: getStatusColor(a.status),
                        borderColor: getStatusColor(a.status),
                    }));
                    setAppointments(events);
                }
            })
            .catch(err => console.error("❌ Failed to fetch appointments:", err));
    }, []);

    /* ---------- filter by service ---------- */
    const filteredAppointments = useMemo(
        () =>
            selectedService === "All Services"
                ? appointments
                : appointments.filter((a) => a.serviceType === selectedService),
        [appointments, selectedService]
    );

    const handleDateClick = useCallback((arg) => {
        setSelectedDate(arg.date);
        setIsCreateOpen(true);
    }, []);

    const handleEventClick = useCallback((clickInfo) => {
        const evt = clickInfo.event;
        setViewAppt({
            id: evt.id,
            serviceType: evt.extendedProps.serviceType,
            clientName: evt.extendedProps.clientName,
            status: evt.extendedProps.status,
            start: evt.start,
        });
        setViewOpen(true);
    }, []);

    /* ---------- custom event renderer ---------- */
    const renderEventContent = (eventInfo) => {
        const { serviceType, clientName, status } = eventInfo.event.extendedProps;
        const time = eventInfo.timeText;

        // dot colors for statuses
        const statusColors = {
            pending: "bg-yellow-500",
            approved: "bg-green-500",
            completed: "bg-blue-500",
            cancelled: "bg-red-500",
            rejected: "bg-red-500",
            archived: "bg-gray-400",
        };

        return (
            <div className="flex flex-col text-xs leading-tight p-1">
                <div className="flex items-center gap-1">
                    {/* colored dot */}
                    <span
                        className={`w-2 h-2 rounded-full ${statusColors[status] || "bg-gray-400"}`}
                    />
                    <span className="font-medium text-slate-900">{serviceType}</span>
                </div>
                <span className="text-gray-600 truncate">{clientName}</span>
                <span className="text-[11px] text-gray-500">{time}</span>
            </div>
        );
    };

    return (
        <div className="w-full">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4 px-4">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => calendarRef.current?.getApi().prev()}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => calendarRef.current?.getApi().next()}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => calendarRef.current?.getApi().today()}
                        className="px-3 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                        Today
                    </button>
                    <h2 className="ml-3 text-lg font-semibold text-slate-900">
                        {calendarRef.current ? calendarRef.current.getApi().view.title : "Calendar"}
                    </h2>
                </div>
                <div className="flex items-center gap-3">
                    {/* Service Filter */}
                    <div className="relative">
                        <button
                            onClick={() => setIsServiceDropdownOpen(!isServiceDropdownOpen)}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg"
                        >
                            <Filter className="w-4 h-4" />
                            {selectedService}
                            <ChevronDown className="w-4 h-4" />
                        </button>
                        {isServiceDropdownOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setIsServiceDropdownOpen(false)}
                                />
                                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                                    <button
                                        onClick={() => {
                                            setSelectedService("All Services");
                                            setIsServiceDropdownOpen(false);
                                        }}
                                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                                    >
                                        All Services
                                    </button>
                                    {services.map((s) => (
                                        <button
                                            key={s.id}
                                            onClick={() => {
                                                setSelectedService(s.name);
                                                setIsServiceDropdownOpen(false);
                                            }}
                                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                                        >
                                            {s.name}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* View Controls */}
                    <div className="flex items-center gap-1">
                        {VIEW_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => {
                                    setCurrentView(opt.value);
                                    calendarRef.current?.getApi().changeView(opt.value);
                                }}
                                className={`px-3 py-2 text-sm font-medium rounded-lg ${currentView === opt.value
                                    ? "bg-red-600 text-white"
                                    : "text-gray-600 hover:bg-gray-100"
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>


            {/* Calendar Body */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 relative">
                <FullCalendar
                    ref={calendarRef}
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView={currentView}
                    headerToolbar={false}
                    events={filteredAppointments}
                    dateClick={handleDateClick}
                    eventClick={handleEventClick}
                    eventContent={renderEventContent}
                    height="600px"
                    slotMinTime="08:00:00"
                    slotMaxTime="18:00:00"
                    allDaySlot={false}
                    timeZone="local"
                    weekends
                    nowIndicator
                    slotLabelFormat={{
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                    }}
                    eventTimeFormat={{
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                    }}
                />
            </div>

            {/* Modals */}
            <CreateAppointmentModal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onSave={() => { }}
                selectedDate={selectedDate}
            />
            <ViewAppointmentModal
                isOpen={viewOpen}
                onClose={() => setViewOpen(false)}
                appointment={viewAppt}
            />

            {/* Floating Create */}
            <button
                onClick={() => {
                    setSelectedDate(null);
                    setIsCreateOpen(true);
                }}
                className="fixed bottom-6 right-6 w-14 h-14 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg flex items-center justify-center z-40 group"
                title="Create Appointment"
            >
                <Plus className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </button>
        </div>
    );
}

/* ---------- helpers ---------- */
function getStatusColor(status) {
    switch (status) {
        case "pending":
            return "#fbbf24"; // amber
        case "approved":
            return "#22c55e"; // green
        case "completed":
            return "#3b82f6"; // blue
        case "cancelled":
        case "rejected":
            return "#ef4444"; // red
        case "archived":
            return "#6b7280"; // gray
        default:
            return "#9ca3af"; // neutral gray
    }
}
