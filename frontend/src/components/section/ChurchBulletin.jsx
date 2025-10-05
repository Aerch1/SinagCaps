"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Tag,
  ArrowRight,
} from "lucide-react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import "@/styles/public-fullcalendar.css";
import api from "@/api/api";
import toast from "react-hot-toast";
import { formatDate } from "@/utils/availabilityUtils";

/* ---------- Category Color Helper ---------- */
const categoryColor = (category) => {
  const map = {
    "Parish Advisory": "bg-blue-100 text-blue-700 border border-blue-200",
    Community: "bg-green-100 text-green-700 border border-green-200",
    Outreach: "bg-orange-100 text-orange-700 border border-orange-200",
    "Music Ministry": "bg-purple-100 text-purple-700 border border-purple-200",
    General: "bg-gray-100 text-gray-700 border border-gray-200",
  };
  return map[category] || "bg-gray-100 text-gray-700 border border-gray-200";
};

export default function ChurchBulletin({ title = "Church Bulletin" }) {
  const PANEL_H = "h-[28rem]";
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentLabel, setCurrentLabel] = useState("");
  const calendarRef = useRef(null);
  const navigate = useNavigate();

  const monthYear = (d) =>
    new Date(d).toLocaleString("en-US", { month: "long", year: "numeric" });

  /* ---------- Fetch Announcements ---------- */
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await api.get("/admin/announcements");
        if (res.data?.success) {
          const sorted = [...(res.data.data || [])].sort(
            (a, b) => new Date(b.date) - new Date(a.date)
          );
          setAnnouncements(sorted);
          setCurrentLabel(monthYear(new Date()));
        } else toast.error("Failed to load announcements");
      } catch (err) {
        console.error("❌ Error fetching announcements:", err);
        toast.error("Unable to connect to the server");
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncements();
  }, []);

  /* ---------- Group by date ---------- */
  const eventsByDate = useMemo(() => {
    const map = new Map();
    for (const a of announcements) {
      const dateKey = formatDate(a.date);
      const arr = map.get(dateKey) || [];
      arr.push(a);
      map.set(dateKey, arr);
    }
    return map;
  }, [announcements]);

  const calendarEvents = useMemo(
    () =>
      announcements.map((a) => ({
        id: a.id,
        title: a.title,
        start: a.date,
      })),
    [announcements]
  );

  /* ---------- Fix: force reapply calendar marks ---------- */
  const markCalendarDays = () => {
    const api = calendarRef.current?.getApi();
    if (!api) return;
    const dayEls = api.el.querySelectorAll(".fc-daygrid-day");
    dayEls.forEach((el) => {
      const dateStr = el.getAttribute("data-date");
      if (!dateStr) return;
      if (eventsByDate.has(dateStr)) {
        el.classList.add("cb-has-events");
      } else {
        el.classList.remove("cb-has-events");
      }
    });
  };

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(markCalendarDays, 100);
      return () => clearTimeout(timer);
    }
  }, [announcements, currentLabel, loading]);

  const handlePrev = () => calendarRef.current?.getApi()?.prev();
  const handleNext = () => calendarRef.current?.getApi()?.next();

  /* ==================================================
     🧱 Render
  ================================================== */
  return (
    <section className="w-full bg-white public-calendar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          {/* Header */}
          <div className="px-6 py-6 border-b border-gray-200 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
              {title}
            </h2>
            <p className="text-sm text-gray-600">
              Stay updated with our church calendar and important announcements.
            </p>
          </div>

          {/* Body */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Calendar Section */}
              <div className="lg:col-span-5">
                <div className="h-[480px] border border-gray-200 rounded-lg overflow-hidden flex flex-col shadow-sm">
                  <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                    <button
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
                      onClick={handleNext}
                      aria-label="Next month"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="p-3 flex-1">
                    <FullCalendar
                      ref={calendarRef}
                      plugins={[dayGridPlugin, interactionPlugin]}
                      initialView="dayGridMonth"
                      headerToolbar={false}
                      height="100%"
                      expandRows
                      fixedWeekCount={false}
                      showNonCurrentDates
                      firstDay={0}
                      dayHeaderFormat={{ weekday: "long" }}
                      dayHeaderContent={(arg) => arg.text.slice(0, 2)}
                      eventDisplay="none"
                      displayEventTime={false}
                      events={calendarEvents}
                      datesSet={(arg) => {
                        setCurrentLabel(monthYear(arg.view.currentStart));
                        setTimeout(markCalendarDays, 100);
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* 🌟 Announcements Section */}
              <div className="lg:col-span-7">
                {/* 🔗 View All Button on top-right */}
                <div className="flex justify-end mb-3">
                  <button
                    onClick={() => navigate("/announcements")}
                    className="inline-flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
                  >
                    View All Announcements
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <div
                  className={`bg-white border-2 border-slate-200 rounded-xl ${PANEL_H} shadow-sm hover:shadow-md transition-shadow duration-300`}
                >
                  <div className="h-full overflow-y-auto scroll-thin">
                    {loading ? (
                      <div className="flex flex-col items-center justify-center h-full px-6 py-16 text-center">
                        <div className="w-12 h-12 border-4 border-slate-200 border-t-red-600 rounded-full animate-spin mb-4"></div>
                        <p className="text-slate-600 font-medium">
                          Loading announcements...
                        </p>
                      </div>
                    ) : announcements.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full px-6 py-16 text-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                          <CalendarDays className="w-8 h-8 text-slate-400" />
                        </div>
                        <p className="text-slate-600 font-medium">
                          No announcements yet
                        </p>
                        <p className="text-sm text-slate-500 mt-1">
                          Check back soon for updates
                        </p>
                      </div>
                    ) : (
                      <ul className="divide-y divide-slate-100">
                        {announcements.map((item) => {
                          const d = new Date(item.date);
                          const badgeMonth = d.toLocaleString("en-US", { month: "short" });
                          const badgeDay = d.getDate();
                          const badgeYear = d.getFullYear();

                          return (
                            <li
                              key={item.id}
                              onClick={() => navigate(`/announcements/${item.id}`)}
                              className="px-5 py-5 hover:bg-slate-50 cursor-pointer transition-colors duration-200"
                            >
                              <div className="grid grid-cols-[70px_1fr] md:grid-cols-[85px_1fr] gap-5 items-start">
                                {/* Date Badge */}
                                <div className="bg-gradient-to-br from-red-600 to-red-700 text-white rounded-xl p-3 flex flex-col items-center justify-center shadow-md">
                                  <div className="uppercase tracking-wider text-[10px] font-semibold opacity-90">
                                    {badgeMonth}
                                  </div>
                                  <div className="text-2xl md:text-3xl font-bold leading-none my-1">
                                    {badgeDay}
                                  </div>
                                  <div className="text-[10px] font-medium opacity-90">
                                    {badgeYear}
                                  </div>
                                </div>

                                {/* Content */}
                                <div className="min-w-0 space-y-2">
                                  <h4 className="text-base md:text-lg font-bold text-slate-900 hover:text-red-600 transition-colors duration-200">
                                    {item.title}
                                  </h4>

                                  {item.category && (
                                    <div className="flex items-center gap-1.5">
                                      <Tag className="w-3 h-3 text-slate-400" />
                                      <span
                                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${categoryColor(
                                          item.category
                                        )}`}
                                      >
                                        {item.category}
                                      </span>
                                    </div>
                                  )}

                                  {item.text && (
                                    <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
                                      {item.text}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ul>

                    )}
                  </div>
                </div>
              </div>
              {/* End announcements */}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
