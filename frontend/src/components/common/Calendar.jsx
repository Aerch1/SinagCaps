"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { ChevronLeft, ChevronRight, Filter, ChevronDown, Plus } from "lucide-react";
import CreateAppointmentModal from "@/components/common/modal/CreateAppointmentModal";
import ViewAppointmentModal from "@/components/common/modal/ViewAppointmentModal";
import { useSidebar } from "@/context/admin/SidebarContext";

/* ---------- constants ---------- */
const SERVICE_TYPES = ["All Services", "Wedding", "Baptism", "Counseling", "Confirmation", "Funeral"];
const VIEW_OPTIONS = [
    { value: "dayGridMonth", label: "Month" },
    { value: "timeGridWeek", label: "Week" },
    { value: "timeGridDay", label: "Day" },
];

export default function CalendarComponent({ appointments: externalAppointments, onAppointmentsChange }) {
    const [currentView, setCurrentView] = useState("dayGridMonth");
    const [selectedService, setSelectedService] = useState("All Services");
    const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);
    const [internalAppointments, setInternalAppointments] = useState([]);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [viewOpen, setViewOpen] = useState(false);
    const [viewAppt, setViewAppt] = useState(null);

    const appointments = externalAppointments ?? internalAppointments;
    const setAppointments = onAppointmentsChange ?? setInternalAppointments;

    const calendarRef = useRef(null);
    const containerRef = useRef(null);
    const { isExpanded, isHovered } = useSidebar?.() || { isExpanded: true, isHovered: false };

    /* ---------- layout / resize ---------- */
    useEffect(() => {
        if (!calendarRef.current) return;
        const api = calendarRef.current.getApi();
        const t = setTimeout(() => {
            try {
                api.updateSize();
                api.render();
            } catch { }
        }, 100);
        return () => clearTimeout(t);
    }, [isExpanded, isHovered]);

    useEffect(() => {
        const handleResize = () => {
            if (!calendarRef.current) return;
            const api = calendarRef.current.getApi();
            clearTimeout(calendarRef.current.resizeTimer);
            calendarRef.current.resizeTimer = setTimeout(() => {
                try {
                    api.updateSize();
                    api.render();
                } catch { }
            }, 150);
        };
        let ro;
        if (containerRef.current && window.ResizeObserver) {
            ro = new ResizeObserver(handleResize);
            ro.observe(containerRef.current);
        }
        window.addEventListener("resize", handleResize);
        return () => {
            window.removeEventListener("resize", handleResize);
            ro?.disconnect();
            if (calendarRef.current?.resizeTimer) clearTimeout(calendarRef.current.resizeTimer);
        };
    }, []);

    /* ---------- data ---------- */
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
        const ext = evt.extendedProps || {};
        const start = evt.start || null;
        const end = evt.end || null;

        const dateISO = start ? toDateISO(start) : ext.date || "";
        const time24 = start ? toHHmm(start) : ext.time || null;

        const appt = {
            id: evt.id,
            title: evt.title,
            start,
            end,
            date: dateISO,
            time: ext.allDay ? null : time24,
            serviceType: ext.serviceType,
            status: ext.status,
            clientName: ext.clientName,
            backgroundColor: evt.backgroundColor,
            borderColor: evt.borderColor,
            ...ext,
        };
        setViewAppt(appt);
        setViewOpen(true);
    }, []);

    const handleSaveAppointment = useCallback(
        (data) => {
            if (!data.serviceType) {
                console.warn("⚠ Missing serviceType in saved appointment:", data);
                return;
            }
            const id = `TXN-${String(appointments.length + 1).padStart(3, "0")}`;
            const color = getServiceColor(data.serviceType);
            setAppointments((prev) => [
                ...prev,
                {
                    id,
                    title: `${data.serviceType} - ${data.clientName}`,
                    clientName: data.clientName,
                    serviceType: data.serviceType,
                    status: data.status,
                    date: data.date,
                    time: data.time,
                    notes: data.notes,
                    allDay: !!data.allDay,
                    start: data.start || data.date,
                    end: data.end || data.date,
                    backgroundColor: color,
                    borderColor: color,
                },
            ]);
        },
        [appointments.length, setAppointments]
    );

    const fetchAvailableTimes = async () => {
        return mockGenerateTimes("08:00", "17:30", 30);
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6 relative">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <button onClick={() => calendarRef.current?.getApi().prev()} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button onClick={() => calendarRef.current?.getApi().next()} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                        <button onClick={() => calendarRef.current?.getApi().today()} className="px-3 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">
                            Today
                        </button>
                    </div>
                    <h2 className="text-lg font-semibold text-slate-900">
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
                                <div className="fixed inset-0 z-10" onClick={() => setIsServiceDropdownOpen(false)} />
                                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                                    {SERVICE_TYPES.map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => {
                                                setSelectedService(s);
                                                setIsServiceDropdownOpen(false);
                                            }}
                                            className={`w-full text-left px-3 py-2 text-sm ${selectedService === s ? "bg-blue-50 text-red-600" : "text-gray-700 hover:bg-gray-50"
                                                }`}
                                        >
                                            {s}
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
                                className={`px-3 py-2 text-sm font-medium rounded-lg ${currentView === opt.value ? "bg-red-600 text-white" : "text-gray-600 hover:bg-gray-100"
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Calendar */}
            <div ref={containerRef} className="calendar-container fullcalendar-container admin-calendar">
                <FullCalendar
                    ref={calendarRef}
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView={currentView}
                    headerToolbar={false}
                    events={filteredAppointments}
                    dateClick={handleDateClick}
                    eventClick={handleEventClick}
                    editable
                    droppable
                    height="600px"
                    slotMinTime="08:00:00"
                    slotMaxTime="18:00:00"
                    allDaySlot={false}
                    timeZone="local"
                    eventTimeFormat={{ hour: "2-digit", minute: "2-digit", meridiem: false }}
                    eventClassNames="cursor-pointer hover:opacity-80 transition-opacity duration-200"
                    weekends
                    nowIndicator
                />
            </div>

            {/* Create Modal */}
            <CreateAppointmentModal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onSave={handleSaveAppointment}
                selectedDate={selectedDate}
                fetchAvailableTimes={fetchAvailableTimes}
            />

            {/* View Modal */}
            <ViewAppointmentModal
                isOpen={viewOpen}
                onClose={() => setViewOpen(false)}
                appointment={viewAppt}
                onUpdate={(updated) => {
                    setAppointments((prev) => prev.map((a) => (a.id === updated.id ? { ...a, ...updated } : a)));
                    setViewOpen(false);
                }}
                fetchAvailableTimes={fetchAvailableTimes}
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
function getServiceColor(serviceType) {
    const colors = {
        Wedding: "#dc2626",
        Baptism: "#2563eb",
        Counseling: "#d97706",
        Confirmation: "#059669",
        Funeral: "#7c3aed",
    };
    return colors[serviceType] || "#6b7280";
}
function mockGenerateTimes(startHHmm = "08:00", endHHmm = "17:30", everyMin = 30) {
    const [sh, sm] = startHHmm.split(":").map(Number);
    const [eh, em] = endHHmm.split(":").map(Number);
    const out = [];
    let h = sh,
        m = sm;
    while (h < eh || (h === eh && m <= em)) {
        out.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
        m += everyMin;
        if (m >= 60) {
            m -= 60;
            h++;
        }
    }
    return out;
}
function pad2(n) {
    return String(n).padStart(2, "0");
}
function toDateISO(d) {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function toHHmm(d) {
    return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
