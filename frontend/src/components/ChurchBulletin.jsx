"use client"

import { useMemo, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { Megaphone, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react"

// FullCalendar
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import interactionPlugin from "@fullcalendar/interaction"

// --- Demo data (replace or pass via props) ---
const demoAnnouncements = [
    {
        id: "a1",
        title: "Tawag ng Kasal (Marriage Banns)",
        category: "Parish Advisory",
        date: "2025-08-14",
        text: "Ipinapaalam sa sambayanan ang nalalapit na pag-iisang dibdib nina Juan at Maria. Ipanalangin po natin sila.",
        link: "/announcements/tawag-ng-kasal-aug14",
    },
    {
        id: "a2",
        title: "Kasalang Bayan – Registration Opens",
        category: "Community",
        date: "2025-08-12",
        text: "Bukas na ang pagpaparehistro para sa Kasalang Bayan. Makipag-ugnayan sa parish office para sa requirements.",
        link: "/announcements/kasalang-bayan-registration",
    },
    {
        id: "a3",
        title: "Parish Outreach Drive",
        category: "Outreach",
        date: "2025-08-10",
        text: "Tumatanggap tayo ng donasyon para sa feeding program. Salamat sa inyong bukas-palad na suporta.",
        link: "/announcements/outreach-drive",
    },
    {
        id: "a4",
        title: "Choir Recruitment",
        category: "Music Ministry",
        date: "2025-08-08",
        text: "Inaanyayahan ang mga may hilig sa pag-awit na sumali sa choir. Auditions tuwing Sabado, 3 PM.",
        link: "/announcements/choir-recruitment",
    },
]

// Helpers
const toDate = (d) => (d instanceof Date ? d : new Date(d))
const monthYear = (d) => d.toLocaleString(undefined, { month: "long", year: "numeric" })
const fmtMonth = (d) => toDate(d).toLocaleString("en-US", { month: "short" })
const fmtDay = (d) => toDate(d).toLocaleString("en-US", { day: "2-digit" })
const fmtYear = (d) => toDate(d).getFullYear()
const ymd = (d) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    return `${y}-${m}-${day}`
}

export default function ChurchBulletin({ announcements = demoAnnouncements, title = "Church Bulletin" }) {
    // Change this one line to adjust the calendar and announcements height
    const PANEL_H = "h-[28rem]" // e.g. "h-[30rem]" or "h-[24rem]"

    const [currentLabel, setCurrentLabel] = useState(monthYear(new Date()))
    const latest = useMemo(() => [...announcements].sort((a, b) => toDate(b.date) - toDate(a.date)), [announcements])

    // Map events by date -> for dot indicator on dates with events
    const eventsByDate = useMemo(() => {
        const map = new Map()
        for (const a of announcements) {
            const key = (a.date && a.date.slice(0, 10)) || ""
            const arr = map.get(key) || []
            arr.push(a)
            map.set(key, arr)
        }
        return map
    }, [announcements])

    // FullCalendar ref for programmatic navigation
    const calendarRef = useRef(null)

    // Convert announcements to FullCalendar events (we hide them visually; we only show dots)
    const calendarEvents = useMemo(
        () =>
            announcements.map((a) => ({
                id: a.id,
                title: a.title,
                start: a.date,
                url: a.link || undefined,
            })),
        [announcements],
    )

    function handlePrev() {
        const api = calendarRef.current?.getApi()
        api?.prev()
    }

    function handleNext() {
        const api = calendarRef.current?.getApi()
        api?.next()
    }

    return (
        <section className="w-full">
            {/* Parent wrapper ONLY */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                {/* Header */}
                <div className="px-6 py-6 border-b w-full border-gray-200 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-4">
                        <div className="hidden md:block" />
                        <div className="text-center">
                            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">{title}</h2>
                            <p className="text-sm text-gray-600">
                                Stay updated with our church calendar and important announcements.
                            </p>
                        </div>
                        <div className="justify-self-end">
                            <Link
                                to="/announcements"
                                className="text-sm font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg transition-colors"
                            >
                                {"View all →"}
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Body grid */}
                <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        {/* Left: Calendar - refactored design */}
                        {/* Left: Calendar (now in a matching container) */}
                        <div className="lg:col-span-4">
                            <div className={`min-h-0 h-122 border border-gray-200 rounded-lg overflow-hidden flex flex-col`}>
                                {/* Compact header with chevrons + centered month label */}
                                <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                                    <button
                                        type="button"
                                        onClick={handlePrev}
                                        aria-label="Previous month"
                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </button>

                                    <div className="text-sm font-semibold text-gray-900">
                                        {currentLabel}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleNext}
                                        aria-label="Next month"
                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>

                                {/* Calendar body */}
                                <div className="p-3 flex-1">
                                    <FullCalendar
                                        ref={calendarRef}
                                        plugins={[dayGridPlugin, interactionPlugin]}
                                        initialView="dayGridMonth"
                                        headerToolbar={false}
                                        height="100%"
                                        expandRows
                                        fixedWeekCount={false}     // 👈 only weeks that cover the month
                                        showNonCurrentDates={true} // 👈 keep leading/trailing days (muted)
                                        firstDay={0}
                                        dayHeaderFormat={{ weekday: "long" }}
                                        dayHeaderContent={(arg) => arg.text.slice(0, 2)} // Su, Mo, ...
                                        eventDisplay="none"
                                        displayEventTime={false}
                                        events={calendarEvents}
                                        datesSet={(arg) => setCurrentLabel(monthYear(arg.view.currentStart))}
                                        dayCellDidMount={(arg) => {
                                            const key = ymd(arg.date)
                                            if (eventsByDate.has(key)) arg.el.classList.add("cb-has-events")
                                        }}
                                    />

                                </div>
                            </div>
                        </div>


                        {/* Right: Announcements */}
                        <div className="lg:col-span-8 lg:pl-6 lg:border-l lg:border-gray-200 min-h-0">
                            {/* Section title */}
                            <div className="flex items-center justify-center gap-2">
                                <Megaphone className="h-5 w-5 text-red-600" />
                                <h3 className="text-lg font-semibold text-gray-900">Announcements</h3>
                            </div>

                            <div className={`min-h-0 ${PANEL_H} border border-gray-200 mt-3 rounded-lg`}>
                                <div className="h-full overflow-y-auto scroll-thin">
                                    <ul className="divide-y divide-gray-200">
                                        {latest.map((item) => (
                                            <li key={item.id} className="px-3 md:px-4 py-4 md:py-5">
                                                <div className="grid grid-cols-[48px_1fr] md:grid-cols-[90px_1fr] gap-4 items-start">
                                                    {/* Date block */}
                                                    <div className="text-gray-600 flex flex-col h-full items-start md:items-center justify-center">
                                                        <div className="uppercase tracking-wide text-[11px] md:text-xs text-gray-500">
                                                            {fmtMonth(item.date)}
                                                        </div>
                                                        <div className="text-xl md:text-2xl font-bold leading-none text-gray-900">
                                                            {fmtDay(item.date)}
                                                        </div>
                                                        <div className="text-[11px] md:text-xs text-gray-500 mt-0.5">{fmtYear(item.date)}</div>
                                                    </div>

                                                    {/* Content */}
                                                    <div className="min-w-0">
                                                        {item.link ? (
                                                            <Link
                                                                to={item.link}
                                                                className="text-base md:text-lg font-semibold text-gray-900 hover:text-red-700 transition-colors"
                                                            >
                                                                {item.title}
                                                            </Link>
                                                        ) : (
                                                            <h4 className="text-base md:text-lg font-semibold text-gray-900">{item.title}</h4>
                                                        )}
                                                        {item.category && (
                                                            <div className="mt-0.5 text-xs font-medium text-gray-500">{item.category}</div>
                                                        )}
                                                        {item.text && (
                                                            <p className="mt-1.5 text-sm text-gray-600 leading-5 md:leading-relaxed line-clamp-3">
                                                                {item.text}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                        {latest.length === 0 && (
                                            <li className="px-6 py-16 text-center text-gray-500">
                                                {"No announcements yet. Please check back soon."}
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            </div>
                        </div>
                        {/* End right */}
                    </div>
                </div>
            </div>
        </section>
    )
}
