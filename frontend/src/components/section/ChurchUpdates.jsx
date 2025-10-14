"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import api from "@/api/api";
import { CalendarDays, Clock } from "lucide-react";
import { formatDate, to12h } from "@/utils/availabilityUtils";

// 🪄 Animation variants
const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.2, ease: "easeOut" },
    },
};

const item = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

export default function ChurchUpdates() {
    const [updates, setUpdates] = useState([]);
    const [loading, setLoading] = useState(true);

    // ✅ Fetch active news & events only
    useEffect(() => {
        const fetchUpdates = async () => {
            try {
                const res = await api.get("/admin/events");
                const data = res.data?.data || [];

                // 🟢 Only keep active events/news
                const activeOnly = data.filter((e) => e.status === "Active");

                // Sort newest first
                const sorted = [...activeOnly].sort(
                    (a, b) => new Date(b.date) - new Date(a.date)
                );

                setUpdates(sorted);
            } catch (err) {
                console.error("Failed to fetch updates:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchUpdates();
    }, []);

    if (loading)
        return (
            <section className="w-full bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center text-gray-500">
                    Loading updates...
                </div>
            </section>
        );

    if (!updates.length)
        return (
            <section className="w-full bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center text-gray-500">
                    No news or events available yet.
                </div>
            </section>
        );

    return (
        <section className="w-full bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-bold tracking-tight">
                        Latest News & Events
                    </h2>
                    <Button
                        variant="outline"
                        asChild
                        className="border-secondary text-secondary hover:bg-secondary/10"
                    >
                        <Link to="/event">View All Updates</Link>
                    </Button>
                </div>

                {/* Animated Grid */}
                <motion.div
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
                    variants={container}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.2 }}
                >
                    {updates.slice(0, 3).map((u) => {
                        const optimizedImg = u.image_url?.includes("/upload/")
                            ? u.image_url.replace("/upload/", "/upload/f_auto,q_auto,w_800/")
                            : u.image_url;

                        return (
                            <motion.div key={u.id} variants={item}>
                                <Card className="overflow-hidden rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:scale-[1.02] transition-transform duration-300 flex flex-col h-full min-h-[460px]">
                                    {/* ✅ Image */}
                                    {optimizedImg && (
                                        <div className="w-full h-60 bg-gray-100 flex items-center justify-center overflow-hidden">
                                            <img
                                                src={optimizedImg}
                                                alt={u.title}
                                                loading="lazy"
                                                decoding="async"
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                    )}

                                    {/* ✅ Content */}
                                    <CardContent className="flex flex-col flex-1 p-5">
                                        <div className="flex-1 flex flex-col">
                                            <h3 className="text-lg font-semibold">{u.title}</h3>
                                            <div className="mt-1 flex flex-col gap-1 text-sm text-gray-500">
                                                <div className="flex items-center gap-2">
                                                    <CalendarDays className="h-4 w-4 text-gray-400" />
                                                    <span>{formatDate(u.date)}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Clock className="h-4 w-4 text-gray-400" />
                                                    <span>{to12h(u.time)}</span>
                                                </div>

                                                {/* 👇 Type indicator */}
                                                <span
                                                    className={`mt-1 inline-block text-xs font-medium px-2 py-0.5 rounded-full w-fit ${u.type === "event"
                                                            ? "bg-emerald-50 text-emerald-700"
                                                            : "bg-blue-50 text-blue-700"
                                                        }`}
                                                >
                                                    {u.type === "event" ? "Event" : "News"}
                                                </span>
                                            </div>

                                            {/* ✅ Description preview */}
                                            <p className="text-sm text-gray-700 mt-3 line-clamp-3 flex-1">
                                                {u.description}
                                            </p>
                                        </div>

                                        {/* ✅ Read more button (sticks to bottom) */}
                                        <Button
                                            asChild
                                            variant="outline"
                                            className="mt-6 w-full justify-center border-secondary text-secondary hover:bg-secondary/10"
                                        >
                                            <Link to={`/updates/${u.id}`}>Read More</Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>
        </section>
    );
}
