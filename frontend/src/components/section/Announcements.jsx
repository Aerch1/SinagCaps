"use client";

import { useEffect, useState } from "react";
import HeroBanner from "@/components/section/HeroBanner.jsx";
import api from "@/api/api";
import { CalendarDays, Tag } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

/* ==================================================
   🎨 Category Color Helper
================================================== */
const categoryColor = (category) => {
    const map = {
        "Parish Advisory": "border-gray-900 text-gray-900 bg-gray-50",
        Community: "border-blue-600 text-blue-700 bg-blue-50",
        Outreach: "border-green-600 text-green-700 bg-green-50",
        "Music Ministry": "border-purple-600 text-purple-700 bg-purple-50",
        General: "border-amber-500 text-amber-700 bg-amber-50",
    };
    return map[category] || "border-gray-400 text-gray-600 bg-gray-50";
};

/* ==================================================
   🕒 Local Utility Function
================================================== */
export function formatDate(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString("en-PH", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

const HERO_IMG = "/annoucement.jpg";

/* ==================================================
   📜 Announcements Page
================================================== */
export default function Announcements() {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const perPage = 8;

    /* ---------- Fetch Data ---------- */
    useEffect(() => {
        const fetchAnnouncements = async () => {
            try {
                const res = await api.get("/admin/announcements");
                if (res.data?.success) {
                    const data = res.data.data || [];
                    const sorted = [...data].sort(
                        (a, b) => new Date(b.date) - new Date(a.date)
                    );
                    setAnnouncements(sorted);
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

    /* ---------- Pagination ---------- */
    const total = announcements.length;
    const totalPages = Math.ceil(total / perPage);
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    const visibleAnnouncements = announcements.slice(startIndex, endIndex);

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

    /* ---------- Loading State ---------- */
    if (loading)
        return (
            <main className="bg-white">
                <HeroBanner title="Announcements" imageSrc={HERO_IMG} />
                <section className="py-14 text-center">
                    <div className="text-gray-400 text-base sm:text-lg">Loading...</div>
                </section>
            </main>
        );

    /* ---------- Empty State ---------- */
    if (!announcements.length)
        return (
            <main className="bg-white">
                <HeroBanner title="Announcements" imageSrc={HERO_IMG} />
                <section className="py-14 text-center">
                    <div className="text-gray-400 text-base sm:text-lg">
                        No announcements available yet.
                    </div>
                </section>
            </main>
        );

    /* ---------- Main UI ---------- */
    return (
        <main className="bg-white">
            <HeroBanner title="Parish Announcements" imageSrc={HERO_IMG} />

            {/* Intro Section */}
            <section className="mx-auto max-w-4xl px-6 lg:px-8 py-8">
                <div className="text-center">
                    <p className="text-amber-500 italic text-sm sm:text-base">
                        Church Announcements & Updates
                    </p>
                    <h2 className="mt-1 text-2xl sm:text-3xl font-semibold text-gray-900">
                        Stay informed with the latest parish news and advisories.
                    </h2>
                    <p className="mt-2 text-gray-600 max-w-2xl mx-auto text-sm sm:text-base">
                        Browse through recent updates, parish advisories, and ministry
                        activities.
                    </p>
                </div>
            </section>

            {/* Announcements List */}
            <section className="mx-auto max-w-4xl px-6 lg:px-8 pb-10 pt-2">
                <div className="space-y-4">
                    {visibleAnnouncements.map((a) => {
                        const dateObj = new Date(a.date);
                        const badgeMonth = dateObj.toLocaleString("en-US", { month: "short" });
                        const badgeDay = dateObj.getDate();

                        return (
                            <Link
                                key={a.id}
                                to={`/announcements/${a.id}`}
                                className="group block border-b border-gray-200 pb-4 hover:border-gray-400 transition-colors"
                            >
                                <div className="flex gap-4">
                                    {/* Date Badge */}
                                    <div className="flex-shrink-0 text-center w-14">
                                        <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                                            {badgeMonth}
                                        </div>
                                        <div className="text-2xl font-light text-gray-900 leading-none mt-1">
                                            {badgeDay}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        {/* Category */}
                                        {a.category && (
                                            <div className="mb-1.5 flex items-center gap-2">
                                                <Tag className="h-3.5 w-3.5 text-gray-400" />
                                                <span
                                                    className={`text-xs font-medium px-2 py-0.5 rounded-full border ${categoryColor(
                                                        a.category
                                                    )}`}
                                                >
                                                    {a.category}
                                                </span>
                                            </div>
                                        )}

                                        {/* Title */}
                                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-0.5 group-hover:text-gray-600 transition-colors">
                                            {a.title}
                                        </h3>

                                        {/* Date */}
                                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 mb-1.5">
                                            <CalendarDays className="h-3.5 w-3.5" />
                                            <span>{formatDate(a.date)}</span>
                                        </div>

                                        {/* Description */}
                                        {a.text && (
                                            <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
                                                {a.text}
                                            </p>
                                        )}

                                        {/* Read More */}
                                        <div className="mt-1.5 flex items-center gap-2 text-sm text-gray-900 font-medium">
                                            <span className="group-hover:mr-2 transition-all">
                                                Read More
                                            </span>
                                            <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                →
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="mt-8 pt-4 border-t border-gray-200 flex justify-center items-center gap-2">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            className="h-9 w-9 flex items-center justify-center border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            ←
                        </button>

                        {pages.map((n, i) =>
                            n === "…" ? (
                                <span
                                    key={`dots-${i}`}
                                    className="h-9 w-9 flex items-center justify-center text-gray-400"
                                >
                                    …
                                </span>
                            ) : (
                                <button
                                    key={`page-${n}`}
                                    onClick={() => setPage(n)}
                                    className={`h-9 w-9 flex items-center justify-center transition-all ${n === page
                                            ? "bg-gray-900 text-white"
                                            : "border border-gray-300 text-gray-600 hover:bg-gray-50"
                                        }`}
                                >
                                    {n}
                                </button>
                            )
                        )}

                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                            className="h-9 w-9 flex items-center justify-center border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            →
                        </button>
                    </div>
                )}
            </section>
        </main>
    );
}
