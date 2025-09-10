"use client";

import { useMemo, useState } from "react";
import MessageListPanel from "../../components/messages/MessageListPanel";
import MessageThread from "../../components/messages/MessageThread";

const seedThreads = [
    { id: "t1", name: "John Doe", email: "john@example.com", avatar: null, lastSnippet: "Hi there, how are you?", timeLabel: "09:00", unread: 2 },
    { id: "t2", name: "Jessie Woo", email: "jessie@example.com", avatar: null, lastSnippet: "Working with you like dream!", timeLabel: "08:50", unread: 0 },
    { id: "t3", name: "Amelia Nelson", email: "amelia@example.com", avatar: null, lastSnippet: "Can I ask about baptism schedule?", timeLabel: "08:30", unread: 1 },
];

const seedMessages = {
    t1: [
        { id: "m1", me: false, text: "Hi there, How are you?", timeLabel: "09:00" },
        { id: "m2", me: false, text: "Waiting for your reply.", timeLabel: "09:01" },
        { id: "m3", me: true, text: "Hi! Coming there in a few minutes.", timeLabel: "09:05" },
    ],
    t2: [
        { id: "m4", me: false, text: "Hello! Ready to start working on the project?", timeLabel: "08:45" },
        { id: "m5", me: true, text: "Absolutely! Let's make something amazing together.", timeLabel: "08:47" },
    ],
    t3: [{ id: "m6", me: false, text: "Inquiry about schedules.", timeLabel: "08:28" }],
};

export default function MessagesPage() {
    const [threads, setThreads] = useState(seedThreads);
    const [messagesById, setMessagesById] = useState(seedMessages);
    const [activeId, setActiveId] = useState(threads[0]?.id ?? null);

    const activeThread = useMemo(() => threads.find((t) => t.id === activeId), [threads, activeId]);
    const activeMessages = messagesById[activeId] ?? [];

    const handleSelect = (id) => {
        setActiveId(id);
        setThreads((prev) => prev.map((t) => (t.id === id ? { ...t, unread: 0 } : t)));
    };

    const handleSend = (text) => {
        const timeLabel = new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date());
        setMessagesById((prev) => ({
            ...prev,
            [activeId]: [...(prev[activeId] ?? []), { id: (crypto?.randomUUID?.() || String(Math.random())), me: true, text, timeLabel }],
        }));
        setThreads((prev) => prev.map((t) => (t.id === activeId ? { ...t, lastSnippet: text, timeLabel } : t)));
    };

    const handleClear = () => {
        if (!activeId) return;
        setMessagesById((prev) => ({ ...prev, [activeId]: [] }));
        setThreads((prev) => prev.map((t) => (t.id === activeId ? { ...t, lastSnippet: "Chat cleared", timeLabel: "" } : t)));
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="mx-auto max-w-7xl  ">
                {/* Page title (matches ReportsPage) */}
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Messages</h1>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        Respond to parishioners’ inquiries in real time.
                    </p>
                </div>

                {/* Content — no outer border/rounded, just the two panels */}
                <div className="flex h-[72vh] bg-white dark:bg-slate-900">
                    <MessageListPanel
                        threads={threads}
                        activeId={activeId}
                        onSelect={handleSelect}
                        showTitle={false}  // hide sidebar's internal title
                    />
                    <MessageThread
                        thread={activeThread}
                        messages={activeMessages}
                        onSend={handleSend}
                        onClear={handleClear}
                    />
                </div>
            </div>
        </div>
    );
}