"use client";

import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import {
    getAppointments,
    filterAppointments,
    exportAppointments,
} from "../../api/appointments.js";
import {
    Search,
    Maximize2,
    FileDown,
    X,
    Eye,
    CheckCircle,
    Trash2,
    ChevronsUpDown,
} from "lucide-react";
import FilterDropdown from "../ui/FilterDropdown.jsx";

/* ----------- Status badge classes ----------- */
const statusClass = (s) => {
    const v = String(s || "").toLowerCase();

    // Pick ONE: fixed width (exactly aligned) or min width (can grow)
    // Fixed width (perfect column alignment):
    const BASE = "inline-flex items-center justify-center whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium w-28 text-center";


    if (v === "approved")
        return `${BASE} bg-emerald-50 text-emerald-700 border-emerald-200`;
    if (v === "completed")
        return `${BASE} bg-blue-50 text-blue-700 border-blue-200`;
    if (v === "pending")
        return `${BASE} bg-amber-50 text-amber-700 border-amber-200`;
    if (["cancelled", "canceled", "failed"].includes(v))
        return `${BASE} bg-red-50 text-red-700 border-red-200`;
    return `${BASE} bg-gray-50 text-gray-600 border-gray-200`;
};

/* ----------- Time format (MySQL TIME -> readable) ----------- */
const formatDate = (v) => {
    if (!v) return "";
    if (typeof v === "string") {
        // "YYYY-MM-DD" => display nice
        const m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (m) {
            const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
            return d.toLocaleDateString("en-PH", {
                year: "numeric",
                month: "short",
                day: "numeric",
                timeZone: "Asia/Manila",
            });
        }
        // ISO string
        const d = new Date(v);
        if (!isNaN(d)) {
            return d.toLocaleDateString("en-PH", {
                year: "numeric",
                month: "short",
                day: "numeric",
                timeZone: "Asia/Manila",
            });
        }
        return v; // fallback as-is
    }
    if (v instanceof Date && !isNaN(v)) {
        return v.toLocaleDateString("en-PH", {
            year: "numeric",
            month: "short",
            day: "numeric",
            timeZone: "Asia/Manila",
        });
    }
    return String(v);
};

// Accepts "HH:mm" or "HH:mm:ss" or Date
const formatTime = (v) => {
    if (!v) return "";
    if (typeof v === "string") {
        // 12h format like '03:00 PM'
        const m12 = v.match(/^(\d{1,2}):(\d{2})\s*([AP]M)$/i);
        if (m12) {
            let hh = Number(m12[1]);
            const mm = Number(m12[2]);
            const ap = m12[3].toUpperCase();
            if (ap === "PM" && hh < 12) hh += 12;
            if (ap === "AM" && hh === 12) hh = 0;
            const d = new Date();
            d.setHours(hh, mm, 0, 0);
            return d.toLocaleTimeString("en-PH", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
                timeZone: "Asia/Manila",
            });
        }
        // 24h 'HH:mm' or 'HH:mm:ss'
        const m24 = v.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
        if (m24) {
            const d = new Date();
            d.setHours(Number(m24[1]), Number(m24[2]), Number(m24[3] || 0), 0);
            return d.toLocaleTimeString("en-PH", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
                timeZone: "Asia/Manila",
            });
        }
        // ISO fallback
        const d = new Date(v);
        if (!isNaN(d)) {
            return d.toLocaleTimeString("en-PH", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
                timeZone: "Asia/Manila",
            });
        }
        return v;
    }
    if (v instanceof Date && !isNaN(v)) {
        return v.toLocaleTimeString("en-PH", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
            timeZone: "Asia/Manila",
        });
    }
    return String(v);
};
/* ----------- Helpers for "Show" range ---------- */


const pad = (n) => String(n).padStart(2, "0");
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const computeRange = (key) => {
    const today = new Date();
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (key === "7d") {
        const s = new Date(end); s.setDate(s.getDate() - 6);
        return { startDate: ymd(s), endDate: ymd(end) };
    }
    if (key === "month") {
        const s = new Date(end.getFullYear(), end.getMonth(), 1);
        const e = new Date(end.getFullYear(), end.getMonth() + 1, 0);
        return { startDate: ymd(s), endDate: ymd(e) };
    }
    if (key === "year") {
        const s = new Date(end.getFullYear(), 0, 1);
        const e = new Date(end.getFullYear(), 11, 31);
        return { startDate: ymd(s), endDate: ymd(e) };
    }
    return { startDate: null, endDate: null };
};



const monthName = (d) =>
    d.toLocaleString("en-US", { month: "long" });
const fmtRangeLabel = (s, e) => {
    if (!s || !e) return "All";
    const sd = new Date(s), ed = new Date(e);
    // Same month/year -> "September 1–30, 2025"
    if (sd.getFullYear() === ed.getFullYear() && sd.getMonth() === ed.getMonth()) {
        return `${monthName(sd)} ${sd.getDate()}–${ed.getDate()}, ${sd.getFullYear()}`;
    }
    // Same year diff months -> "Sep 28 – Oct 4, 2025"
    if (sd.getFullYear() === ed.getFullYear()) {
        const sm = sd.toLocaleString("en-US", { month: "short" });
        const em = ed.toLocaleString("en-US", { month: "short" });
        return `${sm} ${sd.getDate()}–${em} ${ed.getDate()}, ${sd.getFullYear()}`;
    }
    // Diff years -> "Dec 30, 2025 – Jan 5, 2026"
    const sFull = sd.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const eFull = ed.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric" });
    return `${sFull} – ${eFull}`;
};


export default function DataTable({
    manageHref = "/admin/appointments",
    initialPageSize = 5,
    activeTab = "all",
    onView,
    onApprove,
    onDelete,
}) {
    const location = useLocation();
    const onDashboard = /^\/admin\/?$/.test(location.pathname);
    const containerRef = useRef(null);
    const headerRef = useRef(null); // for "Show" dropdown outside-click handling

    const [rows, setRows] = useState([]);
    const [searchInput, setSearchInput] = useState("");
    const [query, setQuery] = useState("");

    // split dropdown filters
    const [selectedServices, setSelectedServices] = useState([]);
    const [selectedStatuses, setSelectedStatuses] = useState([]);
    const [serviceOptions, setServiceOptions] = useState([]);
    const [statusOptions, setStatusOptions] = useState([]);


    // sorting
    const [sort, setSort] = useState({ key: null, dir: null });

    // pagination
    const [page, setPage] = useState(1);
    const [pageSize] = useState(initialPageSize);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    // "Show" preset range
    const [showRangeKey, setShowRangeKey] = useState("all"); // all | 7d | month | year
    const [{ startDate, endDate }, setRange] = useState({ startDate: null, endDate: null });

    /* ---------- Sync active tab ---------- */
    useEffect(() => {
        if (activeTab === "all") setSelectedStatuses([]);
        else setSelectedStatuses([activeTab]);
        setPage(1);
    }, [activeTab]);

    /* ---------- Apply range on change ---------- */
    useEffect(() => {
        setRange(computeRange(showRangeKey));
        setPage(1);
    }, [showRangeKey]);

    /* ---------- Fetch data ---------- */
    useEffect(() => {
        const load = async () => {
            try {
                const hasFilters =
                    query || selectedServices.length || selectedStatuses.length || sort.key || startDate || endDate;

                let res;
                if (hasFilters) {
                    const payload = {
                        page,
                        pageSize,
                        query,
                        status: selectedStatuses,
                        serviceType: selectedServices,
                        sortBy: sort.key,
                        sortDir: sort.dir,
                    };
                    if (startDate && endDate) {
                        payload.startDate = startDate;
                        payload.endDate = endDate;
                    }
                    res = await filterAppointments(payload);
                } else {
                    res = await getAppointments({ page, pageSize });
                }

                setRows(res.data || []);
                setTotalPages(res.totalPages || 1);
                setTotal(res.total || 0);
                setServiceOptions(res.meta?.serviceTypes || []);
                setStatusOptions(res.meta?.statuses || []);
            } catch (err) {
                console.error("❌ fetch error:", err);
                setRows([]);
            }
        };
        load();
    }, [page, pageSize, query, selectedServices, selectedStatuses, sort, startDate, endDate]);

    /* ---------- Debounce search ---------- */
    useEffect(() => {
        const delay = setTimeout(() => {
            setQuery(searchInput);
            setPage(1);
        }, 300);
        return () => clearTimeout(delay);
    }, [searchInput]);

    /* ---------- Sorting (ID & Client only) ---------- */
    const cycleSort = (key) => {
        setSort((prev) =>
            prev.key === key
                ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } // toggle
                : { key, dir: "asc" }                               // new column -> asc
        );
    };

    const renderSortHeader = (label, key) => {
        const isActive = sort.key === key;
        const dir = isActive ? sort.dir : null;

        return (
            <th
                className="px-6 py-4 text-left  text-sm font-semibold cursor-pointer select-none"
                aria-sort={isActive ? (dir === "asc" ? "ascending" : "descending") : "none"}
                onClick={() => cycleSort(key)}
            >
                <span className="inline-flex  items-center gap-1">
                    {label}
                    {/* same icon always; just tint when active */}
                    <ChevronsUpDown className={`h-4 w-4 ${isActive ? "text-gray-600" : "text-gray-400"}`} />
                    {/* a11y-only hint of direction */}
                    {isActive && (
                        <span className="sr-only ">{dir === "asc" ? "ascending" : "descending"}</span>
                    )}
                </span>
            </th>
        );
    };


    /* ---------- Pagination helpers ---------- */
    const pages = [];
    if (totalPages <= 7) for (let i = 1; i <= totalPages; i++) pages.push(i);
    else if (page <= 4) pages.push(1, 2, 3, 4, 5, "…", totalPages);
    else if (page >= totalPages - 3) pages.push(1, "…", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    else pages.push(1, "…", page - 1, page, page + 1, "…", totalPages);

    return (
        <div ref={containerRef} className="flex flex-col gap-5">
            {/* ===== Section 1: Filters ===== */}
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-6">
                <div className="grid grid-cols-12 gap-4 items-end">
                    {/* Search (8/12) */}
                    <div className="col-span-12 md:col-span-6">
                        <div className="text-xs font-semibold text-gray-500 uppercase mb-1">
                            What are you looking for?
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder="Search name, email, id…"
                                className="h-10 w-full rounded-lg border border-gray-200 pl-10 pr-10 text-sm focus:outline-1 outline-gray-300"
                            />
                            {query && (
                                <button
                                    onClick={() => { setSearchInput(""); setQuery(""); setPage(1); }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Category (2/12) */}
                    <div className="col-span-6 md:col-span-2">
                        <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Category</div>
                        <FilterDropdown
                            mode="service"
                            selectionMode="multi"
                            serviceOptions={serviceOptions}
                            selectedServices={selectedServices}
                            onChange={({ services }) => { setSelectedServices(services); setPage(1); }}
                            onClear={() => { setSelectedServices([]); setPage(1); }}
                        />
                    </div>

                    {/* Status (1/12) */}
                    <div className="col-span-4 md:col-span-2">
                        <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Status</div>
                        <FilterDropdown
                            mode="status"
                            selectionMode="multi"
                            statusOptions={statusOptions}
                            selectedStatuses={selectedStatuses}
                            onChange={({ statuses }) => { setSelectedStatuses(statuses); setPage(1); }}
                            onClear={() => { setSelectedStatuses([]); setPage(1); }}
                        />
                    </div>

                    {/* Search button (1/12) */}
                    <div className="col-span-2 md:col-span-2 flex">
                        <button
                            onClick={() => { setQuery(searchInput); setPage(1); }}
                            className="h-10 px-4 w-full rounded-lg border bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
                        >
                            Search
                        </button>
                    </div>
                </div>
            </div>

            {/* ===== Section 2: Table with header controls ===== */}
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-x-auto">
                {/* Top controls bar */}
                <div
                    ref={headerRef}
                    className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3"
                >
                    <div className="text-sm font-semibold text-gray-800">Appointment Transactions</div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Show</span>
                            <div className="min-w-[220px]">
                                <FilterDropdown
                                    mode="range"
                                    selectionMode="single"
                                    // dynamic button text here:
                                    displayLabel={fmtRangeLabel(startDate, endDate)}
                                    options={[
                                        { value: "all", label: "All" },
                                        { value: "7d", label: "Last 7 days" },
                                        { value: "month", label: "This month" },
                                        { value: "year", label: "This year" },
                                    ]}
                                    value={showRangeKey}
                                    onValueChange={setShowRangeKey}
                                />
                            </div>
                        </div>

                        <button
                            onClick={exportAppointments}
                            className="h-9 px-3 rounded-md border border-gray-300 bg-white text-sm hover:bg-gray-50 flex items-center gap-2"
                        >
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
                            Export
                        </button>

                        {onDashboard && (
                            <Link to={manageHref}>
                                <button className="h-9 px-3 rounded-md border border-gray-300 bg-white text-sm hover:bg-gray-50 flex items-center gap-2">
                                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M8 3H5a2 2 0 0 0-2 2v3m0 4v5a2 2 0 0 0 2 2h3m4 0h5a2 2 0 0 0 2-2v-5m0-4V5a2 2 0 0 0-2-2h-5" /></svg>
                                    Manage
                                </button>
                            </Link>
                        )}
                    </div>
                </div>


                {/* Table */}
                <table className="min-w-full border-collapse table-fixed">
                    <thead className="bg-gray-50">
                        <tr>
                            
                          {renderSortHeader("ID", "id")}
                            {renderSortHeader("Client", "name")}
                            <th className="px-6 py-4 text-left text-sm font-semibold">Contact</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold">Service</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold">Date</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold">Time</th>
                            <th className="px-6 py-4 text-right text-sm font-semibold">Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {rows.map((r) => (
                            <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50 select-text">
                                <td className="px-6 py-4 font-mono text-gray-500">#{r.id}</td>
                                <td className="px-6 py-4">
                                    <div className="text-sm font-medium">{r.name}</div>
                                    <div className="text-xs text-gray-500">{r.email}</div>
                                </td>
                                <td className="px-6 py-4">{r.contactNumber || "—"}</td>
                                <td className="px-6 py-4">{r.serviceType}</td>
                                <td className="px-6 py-4">
                                    <span className={statusClass(r.status)}>{r.status}</span>
                                </td>
                                <td className="px-6 py-4">{formatDate(r.date)}</td>
                                <td className="px-6 py-4">{formatTime(r.time)}</td>

                                {/* ✅ Actions: real buttons (no placeholders) */}
                                <td className="px-6 py-4 text-right">
                                    <div className="inline-flex items-center gap-1.5">
                                        <button
                                            type="button"
                                            className="inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-gray-100"
                                            title="View details"
                                            onClick={() => onView?.(r)}
                                        >
                                            <Eye className="h-4 w-4" />
                                        </button>

                                        {!(r.status === "approved" || r.status === "completed") && (
                                            <button
                                                type="button"
                                                className="inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-gray-100 text-emerald-600"
                                                title="Mark as Approved"
                                                onClick={() => onApprove?.(r)}
                                            >
                                                <CheckCircle className="h-4 w-4" />
                                            </button>
                                        )}

                                        <button
                                            type="button"
                                            className="inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-gray-100 text-red-600"
                                            title="Delete appointment"
                                            onClick={() => onDelete?.(r)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>


                {/* Footer / Pagination */}
                {total > 0 && (
                    <div className="border-t px-6 py-6 flex justify-between items-center">
                        <div className="text-sm text-gray-600">
                            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total} results
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page <= 1}
                                className="h-9 w-9 rounded-md border bg-white text-sm hover:bg-gray-50 disabled:opacity-50"
                            >
                                ‹
                            </button>
                            {pages.map((n, i) =>
                                n === "…" ? (
                                    <span key={`dots-${i}`} className="h-9 w-9 flex items-center justify-center">…</span>
                                ) : (
                                    <button
                                        key={`page-${n}`}
                                        onClick={() => setPage(n)}
                                        className={`h-9 w-9 rounded-md border text-sm ${n === page ? "bg-blue-600 text-white" : "bg-white hover:bg-gray-50"
                                            }`}
                                    >
                                        {n}
                                    </button>
                                )
                            )}
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages}
                                className="h-9 w-9 rounded-md border bg-white text-sm hover:bg-gray-50 disabled:opacity-50"
                            >
                                ›
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
}
