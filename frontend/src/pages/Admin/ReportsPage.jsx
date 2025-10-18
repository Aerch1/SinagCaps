import { useMemo, useRef, useState, useEffect } from "react";
import { Calendar as CalendarIcon, FileDown, ChevronDown, CheckCircle2 } from "lucide-react";
import api from "@/api/api";
import { useAuthStore } from "../../store/authStore.js";
import toast from "react-hot-toast";

const PERIODS = ["Last 7 days", "This Month", "This Year", "Custom"];
const toDate = (s) => (s ? (isNaN(new Date(s)) ? null : new Date(s)) : null);

function startEndForPeriod(period, today = new Date()) {
    const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (period === "Last 7 days") {
        const s = new Date(t);
        s.setDate(t.getDate() - 6);
        return { start: s, end: t };
    }
    if (period === "This Month") {
        // ✅ Include the full last day of the month
        const start = new Date(t.getFullYear(), t.getMonth(), 1);
        const end = new Date(t.getFullYear(), t.getMonth() + 1, 0, 23, 59, 59);
        return { start, end };
    }
    if (period === "This Year") return { start: new Date(t.getFullYear(), 0, 1), end: t };
    return { start: null, end: null };
}


function formatRangeLabel({ start, end }) {
    if (!start || !end) return "All time";
    const sameYear = start.getFullYear() === end.getFullYear();
    const sameMonth = sameYear && start.getMonth() === end.getMonth();
    const day = (d) => d.toLocaleDateString(undefined, { day: "2-digit", month: "short" });
    const full = (d) => d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
    return sameMonth ? `${day(start)} – ${day(end)}` : `${full(start)} – ${full(end)}`;
}

/* -------------------------------- page -------------------------------- */
export default function ReportsPage() {
    const [type, setType] = useState("appointments");
    const [scope, setScope] = useState("all");
    const [period, setPeriod] = useState("Last 7 days");
    const [customStart, setCustomStart] = useState("");
    const [customEnd, setCustomEnd] = useState("");
    const [format, setFormat] = useState("Excel");
    const [recent, setRecent] = useState([]);
    const [loading, setLoading] = useState(false);

    const { user } = useAuthStore();

    /* ✅ Load recent reports from localStorage on mount */
    useEffect(() => {
        const saved = localStorage.getItem("recentReports");
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Restore URLs from base64 blobs
                const restored = parsed.map((r) => {
                    if (r.blobData) {
                        const byteArray = Uint8Array.from(atob(r.blobData), (c) => c.charCodeAt(0));
                        const blob = new Blob([byteArray], { type: r.mimeType });
                        const url = URL.createObjectURL(blob);
                        return { ...r, url };
                    }
                    return r;
                });
                setRecent(restored);
            } catch {
                localStorage.removeItem("recentReports");
            }
        }
    }, []);

    /* ✅ Save updated reports persistently */
    useEffect(() => {
        // Convert Blobs to base64 before saving
        const saveData = async () => {
            const prepared = await Promise.all(
                recent.map(async (r) => {
                    if (r.url && !r.blobData) {
                        const blob = await fetch(r.url).then((res) => res.blob());
                        const arrayBuffer = await blob.arrayBuffer();
                        const binary = String.fromCharCode(...new Uint8Array(arrayBuffer));
                        const blobData = btoa(binary);
                        return { ...r, blobData, mimeType: blob.type, url: undefined };
                    }
                    return r;
                })
            );
            localStorage.setItem("recentReports", JSON.stringify(prepared));
        };
        if (recent.length) saveData();
    }, [recent]);

    const range = useMemo(() => {
        if (period !== "Custom") return startEndForPeriod(period);
        return { start: customStart ? toDate(customStart) : null, end: customEnd ? toDate(customEnd) : null };
    }, [period, customStart, customEnd]);

    /* -------------------------------- handler -------------------------------- */
    const handleGenerate = async () => {
        if (!type) return;
        setLoading(true);
        try {
            const reportTypeTitle = type === "events" ? "Events & News" : type.charAt(0).toUpperCase() + type.slice(1);
            const title = `${reportTypeTitle} Report — ${period}`;
            const adminName = user?.name || "System";

            let startDate = null;
            let endDate = null;
            if (period === "Custom" && customStart && customEnd) {
                startDate = customStart;
                endDate = customEnd;
            } else if (range.start && range.end) {
                startDate = range.start.toISOString().split("T")[0];
                endDate = range.end.toISOString().split("T")[0];
            }

            const response = await api.get("/admin/reports/generate", {
                responseType: "blob",
                params: {
                    type,
                    scope,
                    startDate,
                    endDate,
                    format: format.toLowerCase(),
                    admin: adminName,
                },
            });

            // Create blob + download
            const blob = new Blob([response.data], {
                type:
                    format === "PDF"
                        ? "application/pdf"
                        : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });
            const url = URL.createObjectURL(blob);
            const fileExt = format.toLowerCase() === "pdf" ? "pdf" : "xlsx";
            const filename = `${type}-report-${Date.now()}.${fileExt}`;
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            a.click();

            // Convert blob to base64 for persistent storage
            const arrayBuffer = await blob.arrayBuffer();
            const binary = String.fromCharCode(...new Uint8Array(arrayBuffer));
            const blobData = btoa(binary);

            const newReport = {
                id: Date.now().toString(),
                title,
                type,
                date: new Date(),
                status: "Completed",
                url,
                filename,
                blobData, // ✅ store as base64 for re-creation later
                mimeType: blob.type,
            };

            const updated = [newReport, ...recent].slice(0, 8);
            setRecent(updated);
            localStorage.setItem("recentReports", JSON.stringify(updated));
        } catch (err) {
            console.error("❌ Report generation failed:", err);
            toast.error("Failed to generate report. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const typeCard = (k, title, desc) => {
        const selected = type === k;
        return (
            <button
                type="button"
                onClick={() => {
                    setType(k);
                    setScope("all");
                }}
                className={`text-left rounded-lg border p-4 transition-colors ${selected ? "border-blue-300 bg-blue-50" : "border-gray-300 bg-white hover:bg-gray-50"
                    }`}
            >
                <div className="text-sm font-medium text-gray-900">{title}</div>
                <div className="mt-0.5 text-xs text-gray-500">{desc}</div>
            </button>
        );
    };

    const radioWrap = (value, label, disabled = false) => {
        const active = scope === value && !disabled;
        return (
            <label
                className={`flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs transition ${active
                    ? "border-blue-300 bg-blue-50 text-gray-900"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
                <input
                    type="radio"
                    name="scope"
                    value={value}
                    checked={scope === value}
                    onChange={() => !disabled && setScope(value)}
                    disabled={disabled}
                    className="h-4 w-4 accent-blue-600"
                />
                <span>{label}</span>
            </label>
        );
    };
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="mx-auto max-w-7xl">
                {/* Title */}
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Generate reports for appointments, events & news, and document requests by range and export as CSV/Excel/PDF.
                    </p>

                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                    {/* Builder */}
                    <section className="lg:col-span-8 space-y-6">
                        {/* --- Type Section --- */}
                        <div className="rounded-lg border border-gray-200 bg-white">
                            <div className="border-b border-gray-100 px-5 py-3 text-sm font-medium text-gray-800">
                                Select Report Type
                            </div>
                            <div className="p-5 space-y-5">
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    {typeCard("appointments", "Appointment Reports", "Overview of appointments by date & status.")}
                                    {typeCard("events", "Events & News Reports", "Overview of events and news with status.")}
                                    {typeCard("documents", "Document Requests", "Requests & fulfillment.")}
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    {type === "appointments" && (
                                        <>
                                            {radioWrap("all", "All appointments")}
                                            {radioWrap("pending", "Pending only")}
                                        </>
                                    )}
                                    {type === "events" && (
                                        <>
                                            {radioWrap("all", "All events & news")}
                                            {radioWrap("upcoming", "Upcoming / Pending")}
                                            {radioWrap("past", "Past / Completed")}
                                        </>
                                    )}

                                    {type === "documents" && (
                                        <>
                                            {radioWrap("all", "All requests")}
                                            {radioWrap("pending", "Pending")}
                                            {radioWrap("completed", "Completed")}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* --- Parameters --- */}
                        <div className="rounded-lg border border-gray-200 bg-white">
                            <div className="border-b border-gray-100 px-5 py-3 text-sm font-medium text-gray-800">
                                Report Parameters
                            </div>
                            <div className="p-5 space-y-6">
                                {/* Date Range */}
                                <div>
                                    <label className="mb-2 block text-xs font-medium text-gray-600">Date Range</label>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <div className="relative">
                                            <select
                                                value={period}
                                                onChange={(e) => setPeriod(e.target.value)}
                                                className="h-9 appearance-none rounded-md border border-gray-300 bg-white pl-3 pr-8 text-sm text-gray-900 focus:outline-none focus:ring-0"
                                            >
                                                {PERIODS.map((p) => (
                                                    <option key={p} value={p}>
                                                        {p}
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                        </div>
                                        {period !== "Custom" && (
                                            <div className="inline-flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs text-gray-800">
                                                <CalendarIcon className="h-3.5 w-3.5 text-blue-600" />
                                                <span>{formatRangeLabel(range)}</span>
                                            </div>
                                        )}
                                    </div>
                                    {period === "Custom" && (
                                        <div className="mt-3 flex flex-wrap items-center gap-3">
                                            <input
                                                type="date"
                                                value={customStart}
                                                onChange={(e) => setCustomStart(e.target.value)}
                                                className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-0"
                                            />
                                            <span className="text-xs text-gray-500">to</span>
                                            <input
                                                type="date"
                                                value={customEnd}
                                                onChange={(e) => setCustomEnd(e.target.value)}
                                                className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-0"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Format */}
                                <div>
                                    <label className="mb-2 block text-xs font-medium text-gray-600">Export Format</label>
                                    <div className="flex flex-wrap gap-4 text-sm">
                                        {["CSV", "Excel", "PDF"].map((f) => (
                                            <label
                                                key={f}
                                                className="inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                                            >
                                                <input
                                                    type="radio"
                                                    name="format"
                                                    value={f}
                                                    checked={format === f}
                                                    onChange={(e) => setFormat(e.target.value)}
                                                    className="h-4 w-4 accent-blue-600"
                                                />
                                                <span>{f}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-gray-100 p-5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500">
                                        Generate reports for appointments, events, and document requests.
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleGenerate}
                                        disabled={loading}
                                        className="inline-flex items-center gap-2 rounded-md bg-secondary px-4 py-2 text-sm font-medium text-white hover:bg-secondary/90 focus:outline-none disabled:opacity-50"
                                    >
                                        <FileDown className="h-4 w-4" />
                                        {loading ? "Generating..." : "Generate Report"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* --- Recent Reports --- */}
                    <aside className="lg:col-span-4">
                        <div className="rounded-lg border border-gray-200 bg-white flex flex-col h-full">
                            <div className="border-b border-gray-100 px-5 py-3 text-sm font-medium text-gray-800">
                                Recent Reports
                            </div>
                            {/* ✅ Scrollable container (persistent) */}
                            <div className="flex-1 overflow-y-auto max-h-96">
                                <ul className="divide-y divide-gray-100">
                                    {recent.length === 0 ? (
                                        <li className="px-5 py-6 text-sm text-gray-500">No generated reports yet.</li>
                                    ) : (
                                        recent.map((r) => (
                                            <li key={r.id} className="px-5 py-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <div className="truncate text-sm font-medium text-gray-900">{r.title}</div>
                                                        <div className="mt-1 text-xs text-gray-500">Type: {r.type}</div>
                                                        <div className="mt-1 text-xs text-gray-500">
                                                            Date:{" "}
                                                            {new Date(r.date).toLocaleDateString(undefined, {
                                                                year: "numeric",
                                                                month: "short",
                                                                day: "numeric",
                                                            })}
                                                        </div>
                                                        <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700">
                                                            <CheckCircle2 className="h-3 w-3" /> Completed
                                                        </span>
                                                    </div>
                                                    {/* ✅ re-download directly from local Blob URL */}
                                                    <a
                                                        href={r.url}
                                                        download={r.filename}
                                                        className="shrink-0 rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                                                    >
                                                        Download
                                                    </a>
                                                </div>
                                            </li>
                                        ))
                                    )}
                                </ul>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}