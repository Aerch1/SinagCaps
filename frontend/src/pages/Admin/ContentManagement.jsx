// src/pages/Admin/ContentManagement.jsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import AnnouncementsTable from "../../components/section/AnnouncementsTable";
import EventsGrid from "../../components/section/EventsGrid"; // ← add
import { Plus } from "lucide-react";
import ImportantReminders from "../../components/section/ImportantReminders"; // ← add


const TABS = ["announcements", "events", "important"];
const LABEL = {
    announcements: "Announcements",
    events: "Events",
    important: "Important Reminders",
};

// demo data (announcements)
const DEMO_ANNOUNCEMENTS = [
    {
        id: "a1",
        title: "Sunday Service Schedule Change",
        excerpt: "Starting next week, Sunday service will begin at 10:00 AM…",
        author: "Father John",
        date: "2025-08-20",
        status: "Published",
    },
    {
        id: "a2",
        title: "Youth Group Meeting",
        excerpt: "All youth are invited to attend the monthly meeting…",
        author: "Sister Mary",
        date: "2025-08-18",
        status: "Published",
    },
    {
        id: "a3",
        title: "Church Renovation Update",
        excerpt: "The renovation project is on schedule and …",
        author: "Admin",
        date: "2025-08-15",
        status: "Draft",
    },
];

// demo data (events) — neutral/gray theme handled in EventsGrid
const DEMO_EVENTS = [
    {
        id: "e1",
        title: "Easter Celebration",
        status: "Upcoming",
        description:
            "Join us for our annual Easter celebration with special mass and community feast.",
        date: "2024-03-31",
        time: "09:00",
        location: "Main Church",
    },
    {
        id: "e2",
        title: "Community Outreach Program",
        status: "Upcoming",
        description:
            "Monthly outreach program to help families in need within our community.",
        date: "2024-02-15",
        time: "14:00",
        location: "Community Center",
    },
    {
        id: "e3",
        title: "Christmas Concert",
        status: "Completed",
        description:
            "Annual Christmas concert featuring the church choir and local musicians.",
        date: "2023-12-24",
        time: "19:00",
        location: "Main Church",
    },
];


const DEMO_REMINDERS = [
    {
        id: "r1",
        title: "Liturgical readings upload",
        description: "Prepare PDF for this Sunday and upload to drive.",
        type: "recurring",
        repeat: "Weekly",
        time: "17:00",
        status: "Active",
        createdAt: "2025-08-01",
    },
    {
        id: "r2",
        title: "Sanctuary flowers",
        description: "Confirm florist delivery schedule.",
        type: "one-time",
        date: "2025-08-25",
        time: "09:00",
        status: "Active",
        createdAt: "2025-08-12",
    },
    {
        id: "r3",
        title: "Newsletter deadline",
        type: "recurring",
        repeat: "Monthly",
        time: "16:00",
        status: "Paused",
        createdAt: "2025-07-10",
    },
];



export default function ContentManagement() {
    const [sp, setSp] = useSearchParams();
    const tabParam = sp.get("tab");
    const [active, setActive] = useState(
        TABS.includes(tabParam) ? tabParam : "announcements"
    );



    // local state for reminders (optional if you want interactions)
    const [reminders, setReminders] = useState(DEMO_REMINDERS);

    // handlers (simple local updates)
    const addReminder = (r) => setReminders((prev) => [r, ...prev]);
    const editReminder = (r) => setReminders((prev) => prev.map(x => x.id === r.id ? r : x));
    const deleteReminder = (r) => setReminders((prev) => prev.filter(x => x.id !== r.id));
    const togglePause = (r) => setReminders((prev) =>
        prev.map(x => x.id === r.id ? { ...x, status: x.status === "Paused" ? "Active" : "Paused" } : x)
    );
    const completeOneTime = (r) => setReminders((prev) =>
        prev.map(x => x.id === r.id ? { ...x, status: "Completed" } : x)
    );


    // keep URL in sync when active changes (useEffect = correct side-effect)
    useEffect(() => {
        setSp((prev) => {
            const n = new URLSearchParams(prev);
            n.set("tab", active);
            return n;
        }, { replace: true });
    }, [active, setSp]);

    // actions (stubs)
    const handleEdit = (row) => console.log("edit", row);
    const handleTogglePublish = (row) => console.log("toggle publish", row);
    const handleDelete = (row) => console.log("delete", row);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                                Content Management
                            </h1>
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                Manage announcements, events, and important reminders for your congregation.
                            </p>
                        </div>

                        <Link to="/admin/content/new">
                            <button className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 dark:focus:ring-white">
                                <Plus size={16} />
                                Create Content
                            </button>
                        </Link>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="mb-6">
                    <div className="border-b border-gray-200 dark:border-gray-700">
                        <nav className="-mb-px flex space-x-8">
                            {TABS.map((k) => {
                                const is = active === k;
                                return (
                                    <button
                                        key={k}
                                        onClick={() => setActive(k)}
                                        className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors ${is
                                            ? "border-gray-900 text-gray-900 dark:border-white dark:text-white"
                                            : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-500 dark:hover:text-gray-300"
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
                <div className="bg-white shadow-sm ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700 sm:rounded-lg">
                    {active === "announcements" && (
                        <AnnouncementsTable
                            rows={DEMO_ANNOUNCEMENTS}
                            onEdit={handleEdit}
                            onTogglePublish={handleTogglePublish}
                            onDelete={handleDelete}
                        />
                    )}

                    {active === "events" && (
                        <EventsGrid
                            events={DEMO_EVENTS}
                            onEdit={(ev) => console.log("edit event", ev)}
                            onDelete={(ev) => console.log("delete event", ev)}
                        />
                    )}

                    {active === "important" && (
                        <ImportantReminders
                            items={reminders}
                            onCreate={addReminder}
                            onEdit={editReminder}
                            onDelete={deleteReminder}
                            onTogglePause={togglePause}
                            onComplete={completeOneTime}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
