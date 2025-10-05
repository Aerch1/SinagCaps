"use client";

import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { CalendarDays, User, Tag, ArrowLeft } from "lucide-react";
import api from "@/api/api";
import { formatDate } from "@/utils/availabilityUtils";
import HeroBanner from "@/components/section/HeroBanner";

const HERO_IMG = "/forgot.jpg"; // optional placeholder

export default function AnnouncementDetail() {
    const { id } = useParams();
    const [announcement, setAnnouncement] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnnouncement = async () => {
            try {
                const res = await api.get(`/admin/announcements/${id}`);
                if (res.data?.success) {
                    setAnnouncement(res.data.data);
                } else {
                    setAnnouncement(null);
                }
            } catch (err) {
                console.error("❌ Error fetching announcement:", err);
                setAnnouncement(null);
            } finally {
                setLoading(false);
            }
        };
        fetchAnnouncement();
    }, [id]);

    if (loading)
        return (
            <main className="bg-white py-16 text-center text-gray-500">
                Loading announcement details...
            </main>
        );

    if (!announcement)
        return (
            <main className="bg-white py-16 text-center text-gray-500">
                Announcement not found.
            </main>
        );

    return (
        <main className="bg-white">
            <HeroBanner title="Announcement Details" imageSrc={HERO_IMG} />

            <section className="max-w-3xl mx-auto px-6 lg:px-8 py-10">
                {/* Back link */}
                <Link
                    to="/announcements"
                    className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 mb-8"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Announcements
                </Link>

                {/* Title and Metadata */}
                <div className="space-y-3">
                    <h1 className="text-3xl font-bold text-gray-900 leading-tight">
                        {announcement.title}
                    </h1>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1.5">
                            <CalendarDays className="h-4 w-4 text-gray-400" />
                            <span>{formatDate(announcement.date)}</span>
                        </div>

                        {announcement.author && (
                            <div className="flex items-center gap-1.5">
                                <User className="h-4 w-4 text-gray-400" />
                                <span>By {announcement.author}</span>
                            </div>
                        )}

                        {announcement.category && (
                            <div className="flex items-center gap-1.5">
                                <Tag className="h-4 w-4 text-gray-400" />
                                <span>{announcement.category}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="mt-8">
                    <p className="text-gray-700 whitespace-pre-line leading-relaxed text-base">
                        {announcement.text}
                    </p>
                </div>
            </section>
        </main>
    );
}
