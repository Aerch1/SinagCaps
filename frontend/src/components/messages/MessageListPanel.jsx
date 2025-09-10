"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

function Avatar({ name = "", src, size = 48 }) {
    if (src) return <img src={src} alt={name} className="rounded-full object-cover" style={{ width: size, height: size }} />;
    const initials = name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
    return (
        <div className="rounded-full bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-200 flex items-center justify-center font-semibold"
            style={{ width: size, height: size }}>
            {initials || "?"}
        </div>
    );
}

export default function MessageListPanel({ threads = [], activeId, onSelect, className = "" }) {
    const [query, setQuery] = useState("");
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return threads;
        return threads.filter(
            (t) => t.name?.toLowerCase().includes(q) || t.lastSnippet?.toLowerCase().includes(q) || t.email?.toLowerCase().includes(q),
        );
    }, [threads, query]);

    return (
        <aside className={`w-full lg:w-80 flex-shrink-0 border-r border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 ${className}`}>
            {/* Search */}
            <div className="p-6 border-b border-gray-200 dark:border-slate-700">
                <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Messages</h1>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search conversations..."
                        className="h-10 w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 pl-10 pr-3 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto h-[calc(100dvh-180px)] p-3">
                {filtered.length === 0 ? (
                    <p className="px-3 py-10 text-sm text-gray-500 dark:text-gray-400 text-center">
                        {query ? "No matching conversations" : "No conversations yet"}
                    </p>
                ) : (
                    <ul className="space-y-1">
                        {filtered.map((t) => {
                            const active = t.id === activeId;
                            return (
                                <li key={t.id}>
                                    <button
                                        type="button"
                                        onClick={() => onSelect?.(t.id)}
                                        className={`w-full rounded-xl p-4 text-left transition ${active
                                            ? "bg-blue-50 dark:bg-slate-800 ring-1 ring-blue-200 dark:ring-slate-600"
                                            : "hover:bg-gray-50 dark:hover:bg-slate-800/60"}`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <Avatar name={t.name} src={t.avatar} />
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className="truncate font-medium text-gray-900 dark:text-gray-100">{t.name}</p>
                                                    <div className="shrink-0 flex items-center gap-2">
                                                        {!!t.timeLabel && <span className="text-xs text-gray-500">{t.timeLabel}</span>}
                                                        {t.unread > 0 && (
                                                            <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#CA141D] px-1.5 text-[10px] font-semibold text-white">
                                                                {t.unread > 99 ? "99+" : t.unread}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <p className="truncate text-sm text-gray-500 dark:text-gray-400">{t.lastSnippet || "No messages yet"}</p>
                                            </div>
                                        </div>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </aside>
    );
}
