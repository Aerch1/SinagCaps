"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "@/api/api";

import AnnouncementsTable from "../../components/section/AnnouncementsTable";
import EventsGrid from "../../components/section/EventsGrid";
import ImportantReminders from "../../components/section/ImportantReminders";
import EventNewsModal from "../../components/common/modal/EventNewsModal";

const TABS = ["announcements", "events", "advisories"];
const LABEL = {
    announcements: "Announcements",
    events: "Events / News",
    advisories: "Public Advisories",
};

export default function ContentManagement() {
    const [sp, setSp] = useSearchParams();
    const tabParam = sp.get("tab");
    const [active, setActive] = useState(
        TABS.includes(tabParam) ? tabParam : "announcements"
    );

    // ✅ Local states
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [reminders, setReminders] = useState([]);

    // ✅ Fetch events/news from backend
    const fetchEvents = async () => {
        try {
            setLoading(true);
            const res = await api.get("/admin/events");
            setEvents(res.data.data || []);
        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch events/news");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (active === "events") fetchEvents();
    }, [active]);

    // ✅ Handle delete
    const handleDelete = async (item) => {
        try {
            await api.delete(`/admin/events/${item.id}`);
            toast.success(`Deleted "${item.title}"`);
            fetchEvents();
        } catch {
            toast.error("Delete failed");
        }
    };

    // ✅ Handle modal open for create/update
    const openModal = (item = null) => {
        setEditItem(item);
        setShowModal(true);
    };

    // ✅ Update tab in URL
    useEffect(() => {
        setSp((prev) => {
            const n = new URLSearchParams(prev);
            n.set("tab", active);
            return n;
        }, { replace: true });
    }, [active, setSp]);

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-900">
                    Content Management
                </h1>
                <p className="text-xs md:text-sm text-gray-500 mt-1">
                    Manage announcements, events/news, and reminders for your parish.
                </p>
            </div>

            {/* Tabs Navigation */}
            <div>
                <div className="border-b border-gray-200">
                    <nav className="flex space-x-6 text-sm font-medium">
                        {TABS.map((k) => {
                            const is = active === k;
                            return (
                                <button
                                    key={k}
                                    onClick={() => setActive(k)}
                                    className={`pb-3 border-b-2 transition-colors ${is
                                        ? "border-gray-900 text-gray-900"
                                        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                                        }`}
                                >
                                    {LABEL[k]}
                                </button>
                            );
                        })}
                    </nav>
                </div>
            </div>

            {/* Tab Content */}
            <div className="border rounded-lg bg-white shadow-sm p-4 md:p-6">
                {/* ANNOUNCEMENTS TAB */}
                {active === "announcements" && <AnnouncementsTable rows={[]} />}

                {/* EVENTS TAB */}
                {active === "events" && (
                    <>
                        {loading ? (
                            <div className="p-6 text-center text-gray-500">Loading...</div>
                        ) : (
                            <EventsGrid
                                events={events}
                                onEdit={(ev) => openModal(ev)}
                                onDelete={handleDelete}
                                onCreate={() => openModal(null)} // ✅ button now inside EventsGrid
                            />
                        )}
                    </>
                )}

                {/* REMINDERS TAB */}
                {active === "advisories" && (
                    <ImportantReminders
                       
                    />
                )}
            </div>

            {/* ✅ Modal for Create/Update */}
            <EventNewsModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSaved={fetchEvents}
                editItem={editItem}
            />
        </div>
    );
}
