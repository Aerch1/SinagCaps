"use client";

import { useEffect, useState, useRef } from "react";
import { Megaphone, Bell } from "lucide-react";
import api from "@/api/api";

const ROTATE_INTERVAL = 7000; // 7 seconds

export default function PublicAdvisory() {
    const [advisories, setAdvisories] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [paused, setPaused] = useState(false);
    const intervalRef = useRef(null);

    /* -------------------------------------------
       Fetch all active advisories
    ------------------------------------------- */
    useEffect(() => {
        const fetchAdvisories = async () => {
            try {
                const res = await api.get("/admin/advisories");
                const active = res.data?.data?.filter((a) => a.status === "active") || [];
                setAdvisories(active);
            } catch (err) {
                console.error("❌ Failed to fetch advisories:", err);
            }
        };
        fetchAdvisories();
    }, []);

    /* -------------------------------------------
       Auto-rotate every few seconds
    ------------------------------------------- */
    useEffect(() => {
        if (!advisories.length) return;

        intervalRef.current = setInterval(() => {
            if (!paused) {
                setCurrentIndex((i) => (i + 1) % advisories.length);
            }
        }, 5000); // rotate every 5s

        return () => clearInterval(intervalRef.current);
    }, [advisories, paused]);

    if (!advisories.length) return null;

    const advisory = advisories[currentIndex];
    const Icon = advisory.type === "announcement" ? Megaphone : Bell;
    const bannerClasses =
        advisory.type === "announcement"
            ? "bg-gray-900 text-white"
            : "bg-primary text-gray-900";

    return (
        <section
            className={`relative w-full select-none transition-all duration-500 ease-in-out ${bannerClasses}`}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
        >
            <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 animate-fade-in-up">
                    <span className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                        {advisory.title}
                    </span>
                    <p className="text-base/6 text-current/90 tracking-tight">
                        {advisory.message}
                    </p>
                </div>
            </div>

            {/* Indicator dots */}
            {advisories.length > 1 && (
                <div className="absolute right-4 bottom-2 flex gap-1">
                    {advisories.map((_, idx) => (
                        <div
                            key={idx}
                            className={`h-1.5 w-1.5 rounded-full transition-colors ${idx === currentIndex
                                    ? "bg-white"
                                    : "bg-white/40 hover:bg-white/60"
                                }`}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}
