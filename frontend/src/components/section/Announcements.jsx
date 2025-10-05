"use client";

import { useEffect, useState } from "react";
import HeroBanner from "@/components/section/HeroBanner.jsx";
import api from "@/api/api";
import { CalendarDays, Tag } from "lucide-react";
import { formatDate } from "@/utils/availabilityUtils";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

/* ---------- Category color helper ---------- */
const categoryColor = (category) => {
    const map = {
        "Parish Advisory": "bg-blue-50 text-blue-700",
        Community: "bg-green-50 text-green-700",
        Outreach: "bg-orange-50 text-orange-700",
        "Music Ministry": "bg-purple-50 text-purple-700",
        General: "bg-gray-100 text-gray-700",
    };
    return map[category] || "bg-gray-100 text-gray-700";
};

const HERO_IMG = "/forgot.jpg";

/* ==================================================
   📜 Announcements Page
================================================== */
export default function Announcements() {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const perPage = 5;

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
        pages.push(1, "…", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
        pages.push(1, "…", page - 1, page, page + 1, "…", totalPages);
    }

    /* ---------- UI ---------- */
    if (loading)
        return (
            <main className="bg-white">
                <HeroBanner title="Announcements" imageSrc={HERO_IMG} />
                <section className="py-16 text-center text-gray-500">
                    Loading announcements...
                </section>
            </main>
        );

    if (!announcements.length)
        return (
            <main className="bg-white">
                <HeroBanner title="Announcements" imageSrc={HERO_IMG} />
                <section className="py-16 text-center text-gray-500">
                    No announcements available yet.
                </section>
            </main>
        );

    return (
        <main className="bg-white">
            <HeroBanner title="Parish Announcements" imageSrc={HERO_IMG} />

            <section className="mx-auto max-w-4xl px-6 lg:px-8 py-10">
                <div className="text-center">
                    <p className="text-amber-500 italic">Church Announcements & Updates</p>
                    <h2 className="mt-2 text-2xl sm:text-3xl font-semibold text-gray-900">
                        Stay informed with the latest parish news and advisories.
                    </h2>
                    <p className="mt-2 text-gray-600 max-w-2xl mx-auto">
                        Browse through recent updates, parish advisories, and ministry
                        activities.
                    </p>
                </div>
            </section>

            <section className="mx-auto max-w-4xl px-6 lg:px-8 pb-16 pt-6">
                <ul className="space-y-4">
                    {visibleAnnouncements.map((a) => {
                        const dateObj = new Date(a.date);
                        const badgeMonth = dateObj.toLocaleString("en-US", {
                            month: "short",
                        });
                        const badgeDay = dateObj.getDate();

                        return (
                            <li key={a.id}>
                                <Link
                                    to={`/announcements/${a.id}`}
                                    className="group block bg-white ring-1 ring-gray-200 shadow-sm hover:shadow-md hover:ring-gray-300 transition rounded-lg overflow-hidden p-5"
                                >
                                    <div className="flex gap-5">
                                        {/* Date Badge */}
                                        <div className="flex flex-col items-center justify-center bg-gradient-to-br from-red-600 to-red-700 text-white rounded-lg px-3 py-2 w-16 shadow-sm">
                                            <div className="text-[10px] uppercase tracking-wider opacity-90">
                                                {new Date(a.date).toLocaleString("en-US", { month: "short" })}
                                            </div>
                                            <div className="text-xl font-bold leading-none">
                                                {new Date(a.date).getDate()}
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 group-hover:text-red-700 transition">
                                                {a.title}
                                            </h3>

                                            {/* Category */}
                                            {a.category && (
                                                <div className="mt-1 flex items-center gap-1.5">
                                                    <Tag className="h-3.5 w-3.5 text-gray-400" />
                                                    <span
                                                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${categoryColor(
                                                            a.category
                                                        )}`}
                                                    >
                                                        {a.category}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Date */}
                                            <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                                                <CalendarDays className="h-3.5 w-3.5" />
                                                <span>{formatDate(a.date)}</span>
                                            </div>

                                            {/* Text */}
                                            {a.text && (
                                                <p className="mt-2 line-clamp-3 text-sm text-gray-600 leading-relaxed">
                                                    {a.text}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </Link>
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
