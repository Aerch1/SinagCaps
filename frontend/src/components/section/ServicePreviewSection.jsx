"use client";

import { useEffect, useState } from "react";
import api from "@/api/api";
import toast from "react-hot-toast";
import { format } from "date-fns";

function format12h(time) {
    if (!time) return "";
    const [h, m] = time.split(":").map(Number);
    const suffix = h >= 12 ? "PM" : "AM";
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

export default function ServicePreviewSection({ serviceId, serviceName }) {
    const [availability, setAvailability] = useState({});
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);

    const today = new Date();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();

    // Load month availability for that service
    useEffect(() => {
        const fetchMonth = async () => {
            try {
                const res = await api.get(`/availability/${serviceId}/month/${year}/${month}`);
                setAvailability(res.data.days || {});
            } catch (err) {
                console.error("❌ Preview availability error:", err);
                toast.error("Failed to load availability preview");
            }
        };
        fetchMonth();
    }, [serviceId]);

    // Load today’s slots
    useEffect(() => {
        const fetchSlots = async () => {
            try {
                const iso = today.toISOString().split("T")[0];
                const res = await api.get(`/availability/${serviceId}/${iso}`);
                setSlots(res.data.slots || []);
            } catch (err) {
                console.error("❌ Preview slots error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchSlots();
    }, [serviceId]);

    return (
        <section className="bg-gray-50 py-12">
            <div className="max-w-6xl mx-auto px-6">
                <div className="text-center mb-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                        {serviceName} Availability
                    </h2>
                    <p className="text-gray-600 text-sm">
                        Quick preview of upcoming slots for this month.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Calendar Summary */}
                    <div className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm">
                        <h4 className="font-semibold text-gray-800 mb-3">
                            {format(today, "MMMM yyyy")}
                        </h4>
                        <div className="grid grid-cols-7 gap-1 text-xs text-gray-600">
                            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((w) => (
                                <div key={w} className="text-center font-medium">{w}</div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-1 mt-1">
                            {Array.from({ length: 30 }, (_, i) => {
                                const day = i + 1;
                                const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                                const data = availability[iso];
                                let bg = "bg-gray-50";
                                if (data?.status === "available") bg = "bg-green-100";
                                if (data?.status === "full") bg = "bg-red-100";
                                if (data?.status === "blocked") bg = "bg-gray-200";

                                return (
                                    <div
                                        key={iso}
                                        className={`h-8 w-full rounded text-[11px] grid place-items-center ${bg} border border-gray-200`}
                                    >
                                        {day}
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex justify-center gap-4 text-xs text-gray-500 mt-4">
                            <div className="flex items-center gap-1">
                                <span className="w-3 h-3 bg-green-200 border border-green-500 rounded" /> Available
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="w-3 h-3 bg-red-200 border border-red-500 rounded" /> Full
                            </div>
                        </div>
                    </div>

                    {/* Timeslot Preview */}
                    <div className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm">
                        <h4 className="font-semibold text-gray-800 mb-3">
                            Today’s Available Times
                        </h4>

                        {loading ? (
                            <div className="text-gray-500 text-sm">Loading...</div>
                        ) : slots.length === 0 ? (
                            <p className="text-gray-500 text-sm">No available times today.</p>
                        ) : (
                            <div className="space-y-2 max-h-72 overflow-y-auto">
                                {slots.map((slot) => {
                                    const isFull = slot.remaining === 0;
                                    return (
                                        <div
                                            key={slot.time}
                                            className={`p-3 rounded border text-sm flex justify-between ${isFull
                                                    ? "bg-gray-100 text-gray-400 border-gray-300"
                                                    : "bg-green-50 text-green-800 border-green-200"
                                                }`}
                                        >
                                            <span>{format12h(slot.time)}</span>
                                            <span className="text-xs font-medium">
                                                {isFull ? "Full" : `${slot.remaining} left`}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <div className="text-right mt-4">
                            <a
                                href="/services/appointments/terms"
                                className="inline-block px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition"
                            >
                                Book a Slot →
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
