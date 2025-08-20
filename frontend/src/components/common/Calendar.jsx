// src/components/common/Calendar.jsx
"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { ChevronLeft, ChevronRight, Filter, ChevronDown, Plus } from "lucide-react";
import CreateAppointmentModal from "../common/modal/CreateAppointmentModal";
import { useSidebar } from "../../context/admin/SidebarContext";

const serviceTypes = ["All Services", "Wedding", "Baptism", "Counseling", "Confirmation", "Funeral"];

const viewOptions = [
    { value: "dayGridMonth", label: "Month" },
    { value: "timeGridWeek", label: "Week" },
    { value: "timeGridDay", label: "Day" },
];

export default function CalendarComponent() {
    const [currentView, setCurrentView] = useState("dayGridMonth");
    const [selectedService, setSelectedService] = useState("All Services");
    const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);
    const [appointments, setAppointments] = useState([]);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);

    const calendarRef = useRef(null);
    const containerRef = useRef(null);
    const { isExpanded, isHovered } = useSidebar();

    // Resize handling (sidebar + container + window)
    useEffect(() => {
        if (!calendarRef.current) return;
        const api = calendarRef.current.getApi();
        const t = setTimeout(() => { try { api.updateSize(); api.render(); } catch { } }, 100);
        return () => clearTimeout(t);
    }, [isExpanded, isHovered]);

    useEffect(() => {
        const handleResize = () => {
            if (!calendarRef.current) return;
            const api = calendarRef.current.getApi();
            clearTimeout(calendarRef.current.resizeTimer);
            calendarRef.current.resizeTimer = setTimeout(() => { try { api.updateSize(); api.render(); } catch { } }, 150);
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

    const filteredAppointments = useMemo(
        () => (selectedService === "All Services" ? appointments : appointments.filter(a => a.serviceType === selectedService)),
        [appointments, selectedService]
    );

    const handleDateClick = useCallback((arg) => {
        setSelectedDate(arg.date);
        setIsCreateOpen(true);
    }, []);

    // Reserve for future "View Details" modal
    const handleEventClick = useCallback((clickInfo) => {
        console.log("View details for:", clickInfo.event.id);
    }, []);

    const handleSaveAppointment = useCallback((data) => {
        const id = `TXN-${String(appointments.length + 1).padStart(3, "0")}`;
        const color = getServiceColor(data.serviceType);
        setAppointments(prev => [
            ...prev,
            {
                id,
                title: `${data.serviceType} - ${data.clientName}`,
                clientName: data.clientName,
                serviceType: data.serviceType,
                status: data.status,
                date: data.date,
                time: data.time,
                phone: data.phone,
                purpose: data.purpose,
                notes: data.notes,
                allDay: !!data.allDay,
                start: data.start,
                end: data.end,
                backgroundColor: color,
                borderColor: color,
            },
        ]);
    }, [appointments.length]);

    const fetchAvailableTimes = async (dateISO, serviceType) => {
        // Replace with your backend availability endpoint:
        // const res = await fetch(`/api/availability?date=${dateISO}&service=${serviceType}`);
        // return await res.json(); // e.g., ['09:00','09:30',...]
        return mockGenerateTimes("08:00", "17:30", 30);
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6 relative">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <button onClick={() => calendarRef.current?.getApi().prev()} className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button onClick={() => calendarRef.current?.getApi().next()} className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                        <button onClick={() => calendarRef.current?.getApi().today()} className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
                            Today
                        </button>
                    </div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        {calendarRef.current ? calendarRef.current.getApi().view.title : "Calendar"}
                    </h2>
                </div>

                <div className="flex items-center gap-3">
                    {/* Service Filter */}
                    <div className="relative">
                        <button
                            onClick={() => setIsServiceDropdownOpen(!isServiceDropdownOpen)}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                        >
                            <Filter className="w-4 h-4" />
                            {selectedService}
                            <ChevronDown className="w-4 h-4" />
                        </button>
                        {isServiceDropdownOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setIsServiceDropdownOpen(false)} />
                                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 py-1">
                                    {serviceTypes.map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => { setSelectedService(s); setIsServiceDropdownOpen(false); }}
                                            className={`w-full text-left px-3 py-2 text-sm ${selectedService === s ? "bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-400" : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
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
                        {viewOptions.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => { setCurrentView(opt.value); calendarRef.current?.getApi().changeView(opt.value); }}
                                className={`px-3 py-2 text-sm font-medium rounded-lg ${currentView === opt.value ? "bg-red-600 text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
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
                    eventClick={handleEventClick} // reserved for future view modal
                    editable={true}
                    droppable={true}
                    height="600px"
                    dayMaxEvents={false}
                    moreLinkClick="popover"
                    eventDisplay="block"
                    dayHeaderFormat={{ weekday: "short" }}
                    slotMinTime="08:00:00"
                    slotMaxTime="18:00:00"
                    allDaySlot={false}
                    timeZone="local"
                    eventTimeFormat={{ hour: "numeric", minute: "2-digit", meridiem: "short" }}
                    eventClassNames="cursor-pointer hover:opacity-80 transition-opacity duration-200"
                    selectMirror={true}
                    dayMaxEventRows={false}
                    weekends={true}
                    nowIndicator={true}
                    businessHours={{ daysOfWeek: [0, 1, 2, 3, 4, 5, 6], startTime: "08:00", endTime: "18:00" }}
                    eventMinHeight={30}
                    eventShortHeight={30}
                    expandRows={true}
                    viewDidMount={() => {
                        setTimeout(() => {
                            try {
                                const api = calendarRef.current?.getApi();
                                api?.updateSize();
                                api?.render();
                            } catch { }
                        }, 50);
                    }}
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

            {/* Floating Create */}
            <button
                onClick={() => { setSelectedDate(new Date()); setIsCreateOpen(true); }}
                className="fixed bottom-6 right-6 w-14 h-14 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-40 group"
                title="Create Appointment"
            >
                <Plus className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </button>
        </div>
    );
}

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
    let h = sh, m = sm;
    while (h < eh || (h === eh && m <= em)) {
        out.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
        m += everyMin;
        while (m >= 60) { m -= 60; h += 1; }
    }
    return out;
}
