// src/pages/Admin/ReportsPage.jsx
"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { Calendar as CalendarIcon, FileDown, ChevronDown, CheckCircle2 } from "lucide-react";

/* -------------------- demo data -------------------- */
const DEMO_APPOINTMENTS = [
    { id: 1, txn: "TXN-001", clientName: "Shawn Robertson", email: "shawn@example.com", serviceType: "Baptism", status: "Approved", date: "2025-08-20", time: "09:00" },
    { id: 2, txn: "TXN-002", clientName: "Eduardo Cooper", email: "eduardo@example.com", serviceType: "Marriage", status: "Completed", date: "2025-08-10", time: "14:00" },
    { id: 3, txn: "TXN-003", clientName: "Marjorie Miles", email: "marjorie@example.com", serviceType: "Document Request", status: "Pending", date: "2025-08-22", time: "10:30" },
];

/* ------------------------------ helpers ------------------------------ */
const PERIODS = ["Last 7 days", "This Month", "This Year", "Custom"];
const toDate = (s) => (s ? (isNaN(new Date(s)) ? null : new Date(s)) : null);

function startEndForPeriod(period, today = new Date()) {
    const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (period === "Last 7 days") { const s = new Date(t); s.setDate(t.getDate() - 6); return { start: s, end: t }; }
    if (period === "This Month") return { start: new Date(t.getFullYear(), t.getMonth(), 1), end: new Date(t.getFullYear(), t.getMonth() + 1, 0) };
    if (period === "This Year") return { start: new Date(t.getFullYear(), 0, 1), end: t };
    return { start: null, end: null };
}
function withinRange(isoYmd, start, end) {
    const d = toDate(isoYmd); if (!d) return false;
    if (start && d < start) return false;
    if (end && d > end) return false;
    return true;
}
function csvEscape(v) { return `"${String(v ?? "").replace(/"/g, '""')}"`; }
function makeCSV(rows) {
    const headers = ["Transaction ID", "Client", "Email", "Service", "Status", "Date", "Time"];
    const body = rows.map(r => [r.txn, r.clientName, r.email, r.serviceType, r.status, r.date, r.time || ""].map(csvEscape).join(","));
    return [headers.join(","), ...body].join("\n");
}
function formatRangeLabel({ start, end }) {
    if (!start || !end) return "All time";
    const sameYear = start.getFullYear() === end.getFullYear();
    const sameMonth = sameYear && start.getMonth() === end.getMonth();
    const day = (d) => d.toLocaleDateString(undefined, { day: "2-digit", month: "short" });
    const full = (d) => d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
    return sameMonth ? `${day(start)} – ${day(end)}` : `${full(start)} – ${full(end)}`;
}
function printableHTML(title, rows, rangeText) {
    const rowsHtml = rows.map(r => (
        `<tr>
      <td style="padding:6px;border:1px solid #e5e7eb;">${r.txn}</td>
      <td style="padding:6px;border:1px solid #e5e7eb;">${r.clientName}</td>
      <td style="padding:6px;border:1px solid #e5e7eb;">${r.email}</td>
      <td style="padding:6px;border:1px solid #e5e7eb;">${r.serviceType}</td>
      <td style="padding:6px;border:1px solid #e5e7eb;">${r.status}</td>
      <td style="padding:6px;border:1px solid #e5e7eb;">${r.date}</td>
      <td style="padding:6px;border:1px solid #e5e7eb;">${r.time ?? ""}</td>
    </tr>`
    )).join("");
    return `<!doctype html>
  <html><head><meta charset="utf-8">
  <title>${title}</title>
  <style>
    body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,'Helvetica Neue',Arial,'Noto Sans',sans-serif;color:#111827}
    h1{font-size:18px;margin:0 0 4px}
    .muted{color:#6b7280;font-size:12px;margin-bottom:12px}
    table{border-collapse:collapse;width:100%;font-size:12px}
    th{background:#f3f4f6;border:1px solid #e5e7eb;text-align:left;padding:6px}
  </style></head>
  <body>
    <h1>${title}</h1>
    <div class="muted">${rangeText}</div>
    <table>
      <thead><tr>
        <th>Transaction ID</th><th>Client</th><th>Email</th><th>Service</th><th>Status</th><th>Date</th><th>Time</th>
      </tr></thead>
      <tbody>${rowsHtml || `<tr><td colspan="7" style="padding:10px;border:1px solid #e5e7eb;">No data</td></tr>`}</tbody>
    </table>
    <script>window.print();</script>
  </body></html>`;
}

/* -------------------------------- page -------------------------------- */
export default function ReportsPage({
    appointments = DEMO_APPOINTMENTS,
    events = [],
    documents = [],
}) {
    // report type
    const [type, setType] = useState("appointments"); // appointments | events | documents

    // scope (driven by radio)
    const [scope, setScope] = useState("all"); // appointments: all | pending; others: all|upcoming|completed / all|pending|completed

    // date + export
    const [period, setPeriod] = useState("Last 7 days");
    const [customStart, setCustomStart] = useState("");
    const [customEnd, setCustomEnd] = useState("");
    const [format, setFormat] = useState("CSV"); // CSV | Excel | PDF

    // recent exports
    const [recent, setRecent] = useState([]);
    const urlBucket = useRef([]);

    /* ---------- filtering (appointments only) ---------- */
    const range = useMemo(() => {
        if (period !== "Custom") return startEndForPeriod(period);
        return { start: customStart ? toDate(customStart) : null, end: customEnd ? toDate(customEnd) : null };
    }, [period, customStart, customEnd]);

    const filteredAppointments = useMemo(() => {
        const { start, end } = range;
        let base = appointments.filter(a => withinRange(a.date, start, end));
        if (scope === "pending" && type === "appointments") {
            base = base.filter(a => String(a.status).toLowerCase().includes("pending"));
        }
        return base;
    }, [appointments, range, scope, type]);

    /* ---------- export (appointments only) ---------- */
    const handleGenerate = () => {
        if (type !== "appointments") return;

        const title = `Appointments Report — ${period}${scope === "pending" ? " (Pending)" : ""}`;
        const rangeText = formatRangeLabel(range);

        if (format === "PDF") {
            const w = window.open("", "_blank", "noopener,noreferrer");
            if (w) {
                w.document.write(printableHTML(title, filteredAppointments, rangeText));
                w.document.close();
            }
            setRecent(prev => [{ id: Date.now().toString(), title, date: new Date(), status: "Completed", url: "", filename: "" }, ...prev].slice(0, 8));
            return;
        }

        const csv = makeCSV(filteredAppointments);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        urlBucket.current.push(url);

        const a = document.createElement("a");
        a.href = url;
        a.download = `appointments-${period.replace(/\s+/g, "_").toLowerCase()}${scope === "pending" ? "-pending" : ""}.csv`;
        a.click();

        setRecent(prev => [{ id: Date.now().toString(), title, date: new Date(), status: "Completed", url, filename: a.download }, ...prev].slice(0, 8));
    };

    useEffect(() => () => { urlBucket.current.forEach(u => URL.revokeObjectURL(u)); urlBucket.current = []; }, []);

    /* ---------- UI helpers ---------- */
    const typeCard = (k, title, desc) => {
        const selected = type === k;
        return (
            <button
                type="button"
                onClick={() => { setType(k); setScope("all"); }}
                className={`text-left rounded-lg border p-4 transition-colors
          ${selected
                        ? "border-blue-300 bg-blue-50 dark:border-blue-400/50 dark:bg-blue-500/10"
                        : "border-gray-300 bg-white hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700"}
        `}
            >
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{title}</div>
                <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{desc}</div>
            </button>
        );
    };

    const radioWrap = (value, label, disabled = false) => {
        const active = scope === value && !disabled;
        return (
            <label
                className={`flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs transition
          ${active
                        ? "border-blue-300 bg-blue-50 text-gray-900 dark:border-blue-400/60 dark:bg-blue-500/10 dark:text-gray-100"
                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"}
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
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
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Title */}
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Reports</h1>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Generate appointment reports by range and export as CSV/Excel/PDF.</p>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                    {/* Builder */}
                    <section className="lg:col-span-8 space-y-6">
                        {/* Select Report Type */}
                        <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                            <div className="border-b border-gray-100 px-5 py-3 text-sm font-medium text-gray-800 dark:border-gray-700 dark:text-gray-200">
                                Select Report Type
                            </div>
                            <div className="p-5 space-y-5">
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    {typeCard("appointments", "Appointment Reports", "Overview of appointments by date & status.")}
                                    {typeCard("events", "Event Reports", "Attendance & status (coming soon).")}
                                    {typeCard("documents", "Document Requests", "Requests & fulfillment (coming soon).")}
                                </div>

                                {/* Scope Radios (no counts) */}
                                <div className="flex flex-wrap items-center gap-2">
                                    {type === "appointments" && (
                                        <>
                                            {radioWrap("all", "All appointments")}
                                            {radioWrap("pending", "Pending only")}
                                        </>
                                    )}

                                    {type === "events" && (
                                        <>
                                            {radioWrap("all", "All events", true)}
                                            {radioWrap("upcoming", "Upcoming", true)}
                                            {radioWrap("completed", "Completed", true)}
                                        </>
                                    )}

                                    {type === "documents" && (
                                        <>
                                            {radioWrap("all", "All requests", true)}
                                            {radioWrap("pending", "Pending", true)}
                                            {radioWrap("completed", "Completed", true)}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Parameters */}
                        <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                            <div className="border-b border-gray-100 px-5 py-3 text-sm font-medium text-gray-800 dark:border-gray-700 dark:text-gray-200">
                                Report Parameters
                            </div>

                            <div className="p-5 space-y-6">
                                {/* Date Range */}
                                <div>
                                    <label className="mb-2 block text-xs font-medium text-gray-600 dark:text-gray-300">Date Range</label>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <div className="relative">
                                            <select
                                                value={period}
                                                onChange={(e) => setPeriod(e.target.value)}
                                                className="h-9 appearance-none rounded-md border border-gray-300 bg-white pl-3 pr-8 text-sm text-gray-900 focus:outline-none focus:ring-0 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                            >
                                                {PERIODS.map((p) => (<option key={p} value={p}>{p}</option>))}
                                            </select>
                                            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                        </div>

                                        {period !== "Custom" && (
                                            <div className="inline-flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs text-gray-800 dark:border-blue-400/50 dark:bg-blue-500/10 dark:text-gray-100">
                                                <CalendarIcon className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
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
                                                className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-0 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                            />
                                            <span className="text-xs text-gray-500 dark:text-gray-400">to</span>
                                            <input
                                                type="date"
                                                value={customEnd}
                                                onChange={(e) => setCustomEnd(e.target.value)}
                                                className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-0 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Export Format */}
                                <div>
                                    <label className="mb-2 block text-xs font-medium text-gray-600 dark:text-gray-300">Export Format</label>
                                    <div className="flex flex-wrap gap-4 text-sm">
                                        {["CSV", "Excel", "PDF"].map((f) => (
                                            <label key={f} className="inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200">
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

                            <div className="border-t border-gray-100 p-5 dark:border-gray-700">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {type !== "appointments" ? "Export is available for Appointments. Events & Documents: coming soon." : ""}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleGenerate}
                                        className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 focus:outline-none disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                                        disabled={
                                            type !== "appointments" ||
                                            (period === "Custom" && (!customStart || !customEnd || toDate(customStart) > toDate(customEnd)))
                                        }
                                    >
                                        <FileDown className="h-4 w-4" />
                                        Generate Report
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Recent Reports */}
                    <aside className="lg:col-span-4">
                        <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                            <div className="border-b border-gray-100 px-5 py-3 text-sm font-medium text-gray-800 dark:border-gray-700 dark:text-gray-200">
                                Recent Reports
                            </div>
                            <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                                {recent.length === 0 ? (
                                    <li className="px-5 py-6 text-sm text-gray-500 dark:text-gray-400">No generated reports yet.</li>
                                ) : (
                                    recent.map((r) => (
                                        <li key={r.id} className="px-5 py-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <div className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{r.title}</div>
                                                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">Type: Appointments</div>
                                                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                        Date: {r.date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                                                    </div>
                                                    <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700 dark:border-green-700/40 dark:bg-green-900/20 dark:text-green-300">
                                                        <CheckCircle2 className="h-3 w-3" /> Completed
                                                    </span>
                                                </div>
                                                {r.url ? (
                                                    <a
                                                        href={r.url}
                                                        download={r.filename}
                                                        className="shrink-0 rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                                                    >
                                                        Download
                                                    </a>
                                                ) : (
                                                    <span className="shrink-0 rounded-md border border-gray-200 px-2.5 py-1.5 text-xs text-gray-400 dark:border-gray-700">
                                                        Printed
                                                    </span>
                                                )}
                                            </div>
                                        </li>
                                    ))
                                )}
                            </ul>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}
