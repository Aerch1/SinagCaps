"use client";

import { useEffect, useState } from "react";
import HeroBanner from "../../components/section/HeroBanner.jsx";
import api from "@/api/api";
import { CalendarDays, Clock } from "lucide-react";
import { formatDate, to12h } from "@/utils/availabilityUtils";

const HERO_IMG = "/forgot.jpg";

export default function Events() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    // Pagination
    const [page, setPage] = useState(1);
    const perPage = 5;

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await api.get("/admin/events");
                const data = res.data?.data || [];

                // filter and sort
                const filtered = data.filter((e) => e.status !== "Inactive");
                const sorted = [...filtered].sort(
                    (a, b) => new Date(b.date) - new Date(a.date)
                );

                setEvents(sorted);
            } catch (err) {
                console.error("Failed to fetch events:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, []);

    // Pagination logic
    const total = events.length;
    const totalPages = Math.ceil(total / perPage);
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    const visibleEvents = events.slice(startIndex, endIndex);

    // Generate pagination numbers like DataTable
    const pages = [];
    if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (page <= 4) {
        pages.push(1, 2, 3, 4, 5, "…", totalPages);
    } else if (page >= totalPages - 3) {
        pages.push(
            1,
            "…",
            totalPages - 4,
            totalPages - 3,
            totalPages - 2,
            totalPages - 1,
            totalPages
        );
    } else {
        pages.push(1, "…", page - 1, page, page + 1, "…", totalPages);
    }

    if (loading)
        return (
            <main className="bg-white">
                <HeroBanner title="Events" imageSrc={HERO_IMG} />
                <section className="py-16 text-center text-gray-500">
                    Loading events...
                </section>
            </main>
        );

    if (!events.length)
        return (
            <main className="bg-white">
                <HeroBanner title="Events" imageSrc={HERO_IMG} />
                <section className="py-16 text-center text-gray-500">
                    No parish news or events available yet.
                </section>
            </main>
        );

    return (
        <main className="bg-white">
            <HeroBanner title="Events & News" imageSrc={HERO_IMG} />

            <section className="mx-auto max-w-4xl px-6 lg:px-8 py-10">
                <div className="text-center">
                    <p className="text-amber-500 italic">Parish Events & News</p>
                    <h2 className="mt-2 text-2xl sm:text-3xl font-semibold text-gray-900">
                        Stay connected with parish updates and upcoming activities.
                    </h2>
                    <p className="mt-2 text-gray-600 max-w-2xl mx-auto">
                        Browse through our latest events and announcements. Click an item to
                        read more details.
                    </p>
                </div>
            </section>

            <section className="mx-auto max-w-4xl px-6 lg:px-8 pb-16 pt-10">
                <ul className="space-y-4">
                    {visibleEvents.map((e) => {
                        const optimizedImg = e.image_url?.includes("/upload/")
                            ? e.image_url.replace("/upload/", "/upload/f_auto,q_auto,w_600/")
                            : e.image_url;
                        const badgeMonth = new Date(e.date).toLocaleString("en-US", {
                            month: "short",
                        });
                        const badgeDay = new Date(e.date).getDate();

                        return (
                            <li key={e.id}>
                                <a
                                    href={`/updates/${e.id}`}
                                    className="group block bg-white ring-1 ring-gray-200 shadow-sm hover:shadow-md hover:ring-gray-300 transition rounded-lg overflow-hidden"
                                >
                                    <div className="flex gap-6 p-4">
                                        {/* Thumbnail */}
                                        <div className="relative h-24 w-40 shrink-0 overflow-hidden bg-gray-100 rounded-md">
                                            {optimizedImg && (
                                                <img
                                                    src={optimizedImg}
                                                    alt={e.title}
                                                    className="h-full w-full object-cover"
                                                />
                                            )}

                                            {/* Date badge */}
                                            <div className="absolute left-2 top-2 rounded-md bg-white/95 px-2 py-1 text-center shadow-sm ring-1 ring-gray-200">
                                                <div className="text-[10px] font-medium text-gray-500 leading-none">
                                                    {badgeMonth}
                                                </div>
                                                <div className="text-base font-semibold text-gray-900 leading-tight -mt-0.5">
                                                    {badgeDay}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Details */}
                                        <div className="min-w-0 flex-1">
                                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 transition-colors group-hover:text-red-700">
                                                {e.title}
                                            </h3>

                                            <div className="mt-1 text-xs sm:text-sm text-gray-500 flex flex-wrap items-center gap-2">
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="h-3.5 w-3.5 text-gray-400" />
                                                    <span>{to12h(e.time)}</span>
                                                </div>
                                                <span className="mx-1">•</span>
                                                <div className="flex items-center gap-1.5">
                                                    <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
                                                    <span>{formatDate(e.date)}</span>
                                                </div>
                                            </div>

                                            <span
                                                className={`mt-2 inline-block text-xs font-medium px-2 py-0.5 rounded-full ${e.type === "event"
                                                        ? "bg-emerald-50 text-emerald-700"
                                                        : "bg-blue-50 text-blue-700"
                                                    }`}
                                            >
                                                {e.type === "event" ? "Event" : "News"}
                                            </span>

                                            <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                                                {e.description}
                                            </p>
                                        </div>
                                    </div>
                                </a>
                            </li>
                        );
                    })}
                </ul>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="mt-8 border-t pt-6 flex justify-center items-center gap-2">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            className="h-9 w-9 rounded-md border bg-white text-sm hover:bg-gray-50 disabled:opacity-50"
                        >
                            ‹
                        </button>

                        {pages.map((n, i) =>
                            n === "…" ? (
                                <span
                                    key={`dots-${i}`}
                                    className="h-9 w-9 flex items-center justify-center"
                                >
                                    …
                                </span>
                            ) : (
                                <button
                                    key={`page-${n}`}
                                    onClick={() => setPage(n)}
                                    className={`h-9 w-9 rounded-md border text-sm ${n === page
                                            ? "bg-secondary text-white"
                                            : "bg-white hover:bg-gray-50"
                                        }`}
                                >
                                    {n}
                                </button>
                            )
                        )}

                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                            className="h-9 w-9 rounded-md border bg-white text-sm hover:bg-gray-50 disabled:opacity-50"
                        >
                            ›
                        </button>
                    </div>
                )}
            </section>
        </main>
    );
}
