"use client";

import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { CalendarDays, Clock, Share2, CalendarPlus } from "lucide-react";
import api from "@/api/api";
import { formatDate, to12h } from "@/utils/availabilityUtils";
import HeroBanner from "@/components/section/HeroBanner";

export default function EventDetail() {
    const { id } = useParams();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const res = await api.get(`/admin/events`);
                const data = res.data?.data || [];
                const found = data.find((e) => String(e.id) === String(id));
                setEvent(found || null);
            } catch (err) {
                console.error("Failed to fetch event:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchEvent();
    }, [id]);

    if (loading)
        return (
            <main className="bg-white py-16 text-center text-gray-500">
                Loading event details...
            </main>
        );

    if (!event)
        return (
            <main className="bg-white py-16 text-center text-gray-500">
                Event not found.
            </main>
        );

    const optimizedImg = event.image_url?.includes("/upload/")
        ? event.image_url.replace("/upload/", "/upload/f_auto,q_auto,w_1200/")
        : event.image_url;

    const eventDate = formatDate(event.date);
    const eventTime = to12h(event.time);

    return (
        <main className="bg-white">

            <section className="max-w-3xl mx-auto px-6 lg:px-8 py-10">
                {/* Back link */}
                <Link
                    to="/event"
                    className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 mb-8"
                >
                    <span className="text-lg">←</span> Back to events
                </Link>

                {/* Image section */}
                {optimizedImg && (
                    <div className="w-full overflow-hidden rounded-lg shadow-sm mb-8">
                        <img
                            src={optimizedImg}
                            alt={event.title}
                            className="w-full object-contain max-h-[450px] bg-black"
                        />
                    </div>
                )}

                {/* Event title + info */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <span
                            className={`px-3 py-1 text-xs font-semibold rounded-full ${event.type === "event"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-blue-50 text-blue-700"
                                }`}
                        >
                            {event.type === "event" ? "Event" : "News"}
                        </span>
                    </div>

                    <h1 className="text-3xl font-bold text-gray-900 leading-tight">
                        {event.title}
                    </h1>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1.5">
                            <CalendarDays className="h-4 w-4 text-gray-400" />
                            <span>{eventDate}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span>{eventTime}</span>
                        </div>
                    </div>
                </div>

                {/* Description */}
                {event.description && (
                    <div className="mt-8">
                        <p className="text-gray-700 whitespace-pre-line leading-relaxed text-base">
                            {event.description}
                        </p>
                    </div>
                )}

                
            </section>
        </main>
    );
}
