"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MoreHorizontal, Trash2, Paperclip, Send } from "lucide-react";

function Avatar({ name = "", src, size = 44 }) {
    if (src) return <img src={src} alt={name} className="rounded-full object-cover" style={{ width: size, height: size }} />;
    const initials = name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
    return (
        <div className="rounded-full bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-200 flex items-center justify-center font-medium"
            style={{ width: size, height: size }}>
            {initials || "?"}
        </div>
    );
}

function Bubble({ me, text, time }) {
    return (
        <div className={`flex ${me ? "justify-end" : "justify-start"} px-6`}>
            <div className="max-w-[75%]">
                <div className={`rounded-2xl px-4 py-3 shadow-sm ${me
                    ? "bg-blue-600 text-white rounded-br-md ml-auto"
                    : "bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 border border-gray-100 dark:border-slate-700 rounded-bl-md"}`}>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{text}</p>
                </div>
                <div className={`mt-1 px-1 text-[10px] opacity-70 ${me ? "text-right text-gray-500" : "text-gray-400"}`}>{time}</div>
            </div>
        </div>
    );
}

export default function MessageThread({ thread, messages = [], onSend, onClear }) {
    const [draft, setDraft] = useState("");
    const endRef = useRef(null);

    const title = thread?.name || "Select a conversation";

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [messages.length]);

    const disabled = !thread;
    const canSend = useMemo(() => draft.trim().length > 0 && !disabled, [draft, disabled]);

    const handleSend = () => {
        if (!canSend) return;
        onSend?.(draft.trim());
        setDraft("");
    };

    return (
        <section className="min-w-0 flex-1 flex flex-col bg-white dark:bg-slate-900">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-700 px-6 py-4">
                <div className="flex items-center gap-4 min-w-0">
                    {thread ? <Avatar name={thread.name} src={thread.avatar} /> : <div className="h-11 w-11 rounded-full bg-gray-200 dark:bg-slate-700" />}
                    <div className="min-w-0">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">{title}</h2>
                        {!!thread && <p className="text-xs text-gray-500 dark:text-gray-400">Chat</p>}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onClear?.()}
                        disabled={disabled || messages.length === 0}
                        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-[#CA141D] hover:bg-[#B01219] disabled:bg-gray-300 disabled:text-gray-600 rounded-lg transition-colors"
                        title="Clear chat"
                    >
                        <Trash2 className="h-4 w-4" />
                        Clear
                    </button>
                    <button
                        disabled={disabled}
                        className="inline-flex items-center justify-center w-9 h-9 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
                        title="More options"
                    >
                        <MoreHorizontal className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-900">
                {disabled ? (
                    <div className="h-full flex flex-col items-center justify-center text-center px-8">
                        <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-slate-700 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No conversation selected</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">Choose a conversation from the sidebar to start messaging</p>
                    </div>
                ) : (
                    <div className="py-6 space-y-4">
                        {messages.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-sm text-gray-500 dark:text-gray-400">Start the conversation with {thread.name}</p>
                            </div>
                        ) : (
                            messages.map((m) => <Bubble key={m.id} me={m.me} text={m.text} time={m.timeLabel} />)
                        )}
                        <div ref={endRef} />
                    </div>
                )}
            </div>

            {/* Composer */}
            <div className="border-t border-gray-200 dark:border-slate-700 px-6 py-4">
                <div className="flex items-end gap-3">
                    <button
                        disabled={disabled}
                        className="flex items-center justify-center w-10 h-10 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50"
                        title="Attach file"
                    >
                        <Paperclip className="h-4 w-4" />
                    </button>

                    <textarea
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        placeholder={disabled ? "Select a conversation to start typing..." : "Type your message..."}
                        rows={1}
                        disabled={disabled}
                        className="flex-1 resize-none rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 px-4 py-3 pr-12 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{ minHeight: "44px", maxHeight: "120px" }}
                    />

                    <button
                        onClick={handleSend}
                        disabled={!canSend}
                        className="inline-flex items-center gap-2 px-4 py-3 text-sm font-medium text-white bg-[#CA141D] hover:bg-[#B01219] disabled:bg-gray-300 disabled:text-gray-600 rounded-xl transition-colors shadow-sm"
                    >
                        <Send className="h-4 w-4" />
                        Send
                    </button>
                </div>
            </div>
        </section>
    );
}
