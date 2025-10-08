import { useState, useMemo, useEffect, useRef } from "react";
import { Search, ArrowLeft, Send, Archive, Trash2, MoreVertical, Mail } from "lucide-react";

const seedInquiries = [
    {
        id: "inq1",
        name: "John Doe",
        email: "john@example.com",
        subject: "Question about baptism schedule",
        preview: "Hi, I would like to know the available dates for baptism this month...",
        messages: [
            {
                id: "m1",
                from: "John Doe",
                email: "john@example.com",
                text: "Hi, I would like to know the available dates for baptism this month. Could you please provide me with the schedule?",
                timestamp: "2025-10-07T09:30:00",
                isReply: false,
            },
        ],
        time: "09:30 AM",
        status: "unread",
    },
    {
        id: "inq2",
        name: "Maria Santos",
        email: "maria.santos@example.com",
        subject: "Wedding ceremony inquiry",
        preview: "Good morning, my fiancé and I are planning our wedding...",
        messages: [
            {
                id: "m2",
                from: "Maria Santos",
                email: "maria.santos@example.com",
                text: "Good morning, my fiancé and I are planning our wedding for next year. We would love to have the ceremony at your church. What are the requirements and available dates?",
                timestamp: "2025-10-07T08:15:00",
                isReply: false,
            },
            {
                id: "m3",
                from: "Admin",
                email: "admin@church.com",
                text: "Thank you for your interest! Please visit our parish office to discuss requirements and scheduling. We're open Monday to Friday, 9 AM to 5 PM.",
                timestamp: "2025-10-07T10:20:00",
                isReply: true,
            },
        ],
        time: "10:20 AM",
        status: "replied",
    },
    {
        id: "inq3",
        name: "Robert Chen",
        email: "robert.chen@example.com",
        subject: "Mass schedule information",
        preview: "Hello, I'm new to the area and would like to know the mass schedules...",
        messages: [
            {
                id: "m4",
                from: "Robert Chen",
                email: "robert.chen@example.com",
                text: "Hello, I'm new to the area and would like to know the mass schedules for weekdays and weekends. Thank you!",
                timestamp: "2025-10-06T16:45:00",
                isReply: false,
            },
        ],
        time: "Yesterday",
        status: "unread",
    },
];

function Avatar({ name }) {
    const initials = name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    return (
        <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-700">
            {initials}
        </div>
    );
}

function InquiryList({ inquiries, selectedId, onSelect, searchQuery, onSearchChange }) {
    const filtered = useMemo(() => {
        const q = searchQuery.toLowerCase().trim();
        if (!q) return inquiries;
        return inquiries.filter(
            (inq) =>
                inq.name.toLowerCase().includes(q) ||
                inq.email.toLowerCase().includes(q) ||
                inq.subject.toLowerCase().includes(q) ||
                inq.preview.toLowerCase().includes(q)
        );
    }, [inquiries, searchQuery]);

    return (
        <div className="w-80 border-r border-slate-200 flex flex-col bg-white">
            <div className="p-5 border-b border-slate-200">
                <h2 className="text-base font-semibold text-slate-900 mb-3">Inquiries</h2>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search inquiries..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-colors"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center">
                        <Mail className="w-12 h-12 text-slate-300 mb-3" />
                        <p className="text-sm text-slate-500">
                            {searchQuery ? "No inquiries found" : "No inquiries yet"}
                        </p>
                    </div>
                ) : (
                    filtered.map((inq) => (
                        <button
                            key={inq.id}
                            onClick={() => onSelect(inq.id)}
                            className={`w-full p-4 border-b border-slate-100 text-left hover:bg-slate-50 transition-colors ${selectedId === inq.id ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                <Avatar name={inq.name} />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <span
                                            className={`text-sm font-medium truncate ${inq.status === "unread" ? "text-slate-900" : "text-slate-700"
                                                }`}
                                        >
                                            {inq.name}
                                        </span>
                                        <span className="text-xs text-slate-500 ml-2 shrink-0">{inq.time}</span>
                                    </div>
                                    <div
                                        className={`text-sm mb-1 truncate ${inq.status === "unread" ? "font-semibold text-slate-900" : "text-slate-700"
                                            }`}
                                    >
                                        {inq.subject}
                                    </div>
                                    <div className="text-xs text-slate-500 truncate">{inq.preview}</div>
                                    {inq.status === "unread" && (
                                        <div className="mt-2">
                                            <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium text-blue-700 bg-blue-100 rounded">
                                                New
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </button>
                    ))
                )}
            </div>
        </div>
    );
}

function MessageBubble({ message }) {
    const time = new Date(message.timestamp).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
    });

    return (
        <div className={`flex ${message.isReply ? "justify-end" : "justify-start"} mb-6`}>
            <div className={`max-w-2xl ${message.isReply ? "ml-12" : "mr-12"}`}>
                <div className="flex items-start gap-3 mb-2">
                    {!message.isReply && <Avatar name={message.from} />}
                    <div className="flex-1">
                        <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-sm font-medium text-slate-900">{message.from}</span>
                            <span className="text-xs text-slate-500">{time}</span>
                        </div>
                        <div className="text-xs text-slate-600">{message.email}</div>
                    </div>
                </div>
                <div
                    className={`rounded-lg p-4 ${message.isReply
                        ? "bg-blue-50 border border-blue-100"
                        : "bg-slate-50 border border-slate-200"
                        }`}
                >
                    <p className="text-sm text-slate-900 leading-relaxed whitespace-pre-wrap">
                        {message.text}
                    </p>
                </div>
            </div>
        </div>
    );
}

function InquiryDetail({ inquiry, onBack, onReply, onArchive, onDelete }) {
    const [replyText, setReplyText] = useState("");
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [inquiry?.messages]);

    if (!inquiry) {
        return (
            <div className="flex-1 flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <Mail className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-base font-medium text-slate-900 mb-2">No inquiry selected</h3>
                    <p className="text-sm text-slate-500 max-w-sm">
                        Select an inquiry from the list to view details and respond
                    </p>
                </div>
            </div>
        );
    }

    const handleSubmit = () => {
        if (replyText.trim()) {
            onReply(replyText.trim());
            setReplyText("");
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div className="flex-1 flex flex-col bg-white">
            <div className="border-b border-slate-200 bg-white px-6 py-3">
                <div className="flex items-center justify-between py-2">
                    {/* Left: Back + Subject + Sender Info */}
                    <div className="flex items-start gap-3 min-w-0">
                        <button
                            onClick={onBack}
                            className="lg:hidden p-2 -ml-2 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
                        >
                            <ArrowLeft className="w-5 h-5 text-slate-600" />
                        </button>

                        <div className="flex flex-col min-w-0">
                            <h2 className="text-base font-semibold text-slate-900 truncate">
                                {inquiry.subject}
                            </h2>
                            <div className="flex items-center gap-1.5 text-sm text-slate-600 mt-0.5 truncate">
                                <span className="font-medium">{inquiry.name}</span>
                                <span className="text-slate-400">•</span>
                                <span className="truncate">{inquiry.email}</span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Action Buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                        <button
                            onClick={onArchive}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors group"
                            title="Archive"
                        >
                            <Archive className="w-4 h-4 text-slate-600 group-hover:text-slate-900" />
                        </button>
                        <button
                            onClick={onDelete}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors group"
                            title="Delete"
                        >
                            <Trash2 className="w-4 h-4 text-slate-600 group-hover:text-red-600" />
                        </button>
                        <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                            <MoreVertical className="w-4 h-4 text-slate-600" />
                        </button>
                    </div>
                </div>
            </div>



            {/* 🔹 Scrollable message area with height cap */}
            <div className="flex-1 bg-slate-50 p-6 overflow-y-auto max-h-[calc(100vh-20rem)]">
                {inquiry.messages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} />
                ))}
                <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-slate-200 bg-white p-5">
                <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your reply... (Ctrl+Enter to send)"
                    rows={4}
                    className="w-full p-3 text-sm border border-slate-300 rounded-lg bg-slate-50 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-colors"
                />
                <div className="flex items-center justify-between mt-3">
                    <p className="text-xs text-slate-500">Press Ctrl+Enter to send</p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setReplyText("")}
                            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            Discard
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={!replyText.trim()}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
                        >
                            <Send className="w-4 h-4" />
                            Send Reply
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function AdminInquiriesPage() {
    const [inquiries, setInquiries] = useState(seedInquiries);
    const [selectedId, setSelectedId] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [showMobile, setShowMobile] = useState(false);

    const selectedInquiry = useMemo(
        () => inquiries.find((inq) => inq.id === selectedId),
        [inquiries, selectedId]
    );

    const handleSelect = (id) => {
        setSelectedId(id);
        setShowMobile(true);
        setInquiries((prev) =>
            prev.map((inq) => (inq.id === id ? { ...inq, status: "read" } : inq))
        );
    };

    const handleReply = (text) => {
        const newMessage = {
            id: `m${Date.now()}`,
            from: "Admin",
            email: "admin@church.com",
            text,
            timestamp: new Date().toISOString(),
            isReply: true,
        };

        setInquiries((prev) =>
            prev.map((inq) =>
                inq.id === selectedId
                    ? {
                        ...inq,
                        messages: [...inq.messages, newMessage],
                        status: "replied",
                        time: new Date().toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                        }),
                    }
                    : inq
            )
        );
    };

    const handleArchive = () => {
        setInquiries((prev) => prev.filter((inq) => inq.id !== selectedId));
        setSelectedId(null);
        setShowMobile(false);
    };

    const handleDelete = () => {
        if (confirm("Are you sure you want to delete this inquiry?")) {
            setInquiries((prev) => prev.filter((inq) => inq.id !== selectedId));
            setSelectedId(null);
            setShowMobile(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-slate-50">
            <div className="px-6 pt-6 pb-4">
                <h1 className="text-2xl font-semibold text-slate-900">Public Inquiries</h1>
                <p className="text-sm text-slate-600 mt-1">
                    Manage and respond to inquiries from the public
                </p>
            </div>

            <div className="flex-1 px-6 pb-6">
                {/* 🔹 Fixed full-height container */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex overflow-hidden min-h-[calc(100vh-9rem)]">
                    <div className={`${showMobile ? "hidden lg:flex" : "flex"} flex-col`}>
                        <InquiryList
                            inquiries={inquiries}
                            selectedId={selectedId}
                            onSelect={handleSelect}
                            searchQuery={searchQuery}
                            onSearchChange={setSearchQuery}
                        />
                    </div>
                    <div className={`flex-1 ${showMobile ? "flex" : "hidden lg:flex"}`}>
                        <InquiryDetail
                            inquiry={selectedInquiry}
                            onBack={() => setShowMobile(false)}
                            onReply={handleReply}
                            onArchive={handleArchive}
                            onDelete={handleDelete}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
