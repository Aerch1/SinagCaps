// src/components/common/DataTable.jsx
"use client"

import React, { useMemo, useState, useCallback } from "react"
import { Link, useLocation } from "react-router-dom"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Filter,
    Search,
    Maximize2,
    MoreHorizontal,
    ChevronsUpDown,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Calendar as CalendarIcon,
    FileDown,
} from "lucide-react"

/* ---------------- utils ---------------- */

const statusClass = (s) => {
    const v = String(s || "").toLowerCase()
    if (["success", "completed", "approved", "confirmed"].includes(v))
        return "bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full px-3 py-1 text-xs font-medium dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30"
    if (["failed", "canceled", "cancelled", "rejected"].includes(v))
        return "bg-red-50 text-red-600 border border-red-200 rounded-full px-3 py-1 text-xs font-medium dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/30"
    if (["pending", "scheduled", "in process"].includes(v))
        return "bg-amber-50 text-amber-600 border border-amber-200 rounded-full px-3 py-1 text-xs font-medium dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30"
    return "bg-gray-50 text-gray-600 border border-gray-200 rounded-full px-3 py-1 text-xs font-medium dark:bg-gray-500/10 dark:text-gray-400 dark:border-gray-500/30"
}

const toDateObj = (row) => {
    const d = new Date(row?.date || "")
    return isNaN(d) ? null : d
}

const fmtDate = (isoYmd) => {
    if (!isoYmd) return ""
    const d = new Date(isoYmd)
    return isNaN(d)
        ? isoYmd
        : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(d)
}

const fmtTime = (hhmm) => {
    if (!hhmm) return ""
    const d = new Date(`1970-01-01T${hhmm}`)
    return isNaN(d)
        ? hhmm
        : new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(d)
}

const pageList = (page, total) => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
    const items = new Set([1, 2, total - 1, total, page - 1, page, page + 1])
    return [...items].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b)
}

/* ---------- period helpers ---------- */

const PERIODS = ["Last 7 days", "This Month", "This Year"];

function startEndForPeriod(period, today = new Date()) {
    // strip time from "today"
    const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    switch (period) {
        case "Last 7 days": {
            const start = new Date(t);
            start.setDate(t.getDate() - 6);
            const end = new Date(t.getFullYear(), t.getMonth(), t.getDate(), 23, 59, 59, 999);
            return { start, end };
        }

        case "This Month": {
            const start = new Date(t.getFullYear(), t.getMonth(), 1);
            const end = new Date(t.getFullYear(), t.getMonth() + 1, 0, 23, 59, 59, 999); // end of month (EOD)
            return { start, end };
        }

        case "This Year": {
            const start = new Date(t.getFullYear(), 0, 1);
            const end = new Date(t.getFullYear(), 11, 31, 23, 59, 59, 999); // Dec 31 (EOD)
            return { start, end };
        }

        default:
            return { start: null, end: null };
    }
}

function fmtRangeLabel(range) {
    const { start, end } = range
    if (!start || !end) return "All time"
    const sameYear = start.getFullYear() === end.getFullYear()
    const sameMonth = sameYear && start.getMonth() === end.getMonth()
    const f = (d, withYear = false) =>
        new Intl.DateTimeFormat(undefined, { day: "2-digit", month: "short", ...(withYear ? { year: "numeric" } : {}) }).format(d)
    return sameMonth ? `${f(start)} – ${f(end)}` : `${f(start, true)} – ${f(end, true)}`
}

/* --------------- component --------------- */

export default function DataTable({
    rows = [],
    manageHref = "/admin/appointments",
    initialPageSize = 5,
    onView,
    onEdit,
    onDelete,
}) {
    const location = useLocation()
    const onDashboard = /^\/admin\/?$/.test(location.pathname)

    // Period
    const [period, setPeriod] = useState("Last 7 days")
    const range = useMemo(() => startEndForPeriod(period), [period])
    const rangeLabel = useMemo(() => fmtRangeLabel(range), [range])
    const [periodOpen, setPeriodOpen] = useState(false)

    // top controls
    const [query, setQuery] = useState("")
    const [selectedServices, setSelectedServices] = useState(new Set())
    const [selectedStatuses, setSelectedStatuses] = useState(new Set())

    // sorting
    const [sort, setSort] = useState({ key: null, dir: "asc" })

    // pagination
    const [pageSize, setPageSize] = useState(initialPageSize)
    const [page, setPage] = useState(1)

    // options
    const serviceOptions = useMemo(
        () => Array.from(new Set(rows.map((r) => r.serviceType).filter(Boolean))).sort(),
        [rows],
    )
    const statusOptions = useMemo(
        () => Array.from(new Set(rows.map((r) => r.status).filter(Boolean))).sort(),
        [rows],
    )

    // filter + search + sort + period date filter
    const filtered = useMemo(() => {
        let data = rows
        if (range.start && range.end) {
            data = data.filter((r) => {
                const d = toDateObj(r)
                return d && d >= range.start && d <= range.end
            })
        }
        if (query.trim()) {
            const q = query.toLowerCase()
            data = data.filter((r) => (r.name || "").toLowerCase().includes(q) || (r.email || "").toLowerCase().includes(q))
        }
        if (selectedServices.size) data = data.filter((r) => selectedServices.has(r.serviceType))
        if (selectedStatuses.size) data = data.filter((r) => selectedStatuses.has(r.status))

        if (sort.key === "date") {
            data = [...data].sort((a, b) => {
                const da = toDateObj(a) || new Date(0)
                const db = toDateObj(b) || new Date(0)
                return sort.dir === "asc" ? da - db : db - da
            })
        } else if (sort.key === "time") {
            const toTime = (t) => {
                const d = new Date(`1970-01-01T${t || "00:00"}`)
                return isNaN(d) ? 0 : d.getTime()
            }
            data = [...data].sort((a, b) => (sort.dir === "asc" ? toTime(a.time) - toTime(b.time) : toTime(b.time) - toTime(a.time)))
        }

        return data
    }, [rows, range, query, selectedServices, selectedStatuses, sort])

    // pagination slice
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
    const safePage = Math.min(page, totalPages)
    const startIndex = (safePage - 1) * pageSize
    const paged = useMemo(() => filtered.slice(startIndex, startIndex + pageSize), [filtered, startIndex, pageSize])

    const toggleSort = (key) => setSort((s) => (s.key !== key ? { key, dir: "asc" } : { key, dir: s.dir === "asc" ? "desc" : "asc" }))

    const toggleService = (value) =>
        setSelectedServices((prev) => { const n = new Set(prev); n.has(value) ? n.delete(value) : n.add(value); setPage(1); return n })

    const toggleStatus = (value) =>
        setSelectedStatuses((prev) => { const n = new Set(prev); n.has(value) ? n.delete(value) : n.add(value); setPage(1); return n })

    const clearFilters = () => { setSelectedServices(new Set()); setSelectedStatuses(new Set()); setPage(1) }

    // export (filtered data)
    const handleExport = useCallback(() => {
        const data = filtered
        const headers = ["id", "name", "email", "serviceType", "status", "date", "time"]
        const rowsCsv = data.map((r) => headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(","))
        const csv = [headers.join(","), ...rowsCsv].join("\n")
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "appointments.csv"
        a.click()
        URL.revokeObjectURL(url)
    }, [filtered])

    // neutral gray button base (no rings/outlines)
    const btnNeutral =
        "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900/10 dark:text-gray-300 dark:hover:bg-gray-800 focus:outline-none focus-visible:ring-0"

    return (
        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
            {/* Header */}
            <div className="border-b border-gray-100 dark:border-gray-800 p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    {/* Left: period + range pill */}
                    <div className="flex items-center gap-3">
                        <DropdownMenu onOpenChange={setPeriodOpen}>
                            <DropdownMenuTrigger asChild>
                                <Button size="sm" className={`gap-2 ${btnNeutral}`}>
                                    <span className="text-sm">{period}</span>
                                    <ChevronDown
                                        className={`h-4 w-4 transition-transform ${periodOpen ? "rotate-180" : ""}`}
                                        aria-hidden="true"
                                    />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className="w-48 bg-white border border-gray-200 shadow-lg dark:bg-gray-800 dark:border-gray-700"
                                align="start"
                            >
                                <DropdownMenuLabel className="text-xs text-gray-500 dark:text-gray-400">Time Period</DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-gray-100 dark:bg-gray-700" />
                                {PERIODS.map((p) => (
                                    <DropdownMenuItem
                                        key={p}
                                        onClick={() => { setPeriod(p); setPage(1) }}
                                        className="text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700"
                                    >
                                        {p}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Range pill */}
                        <div className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300">
                            <CalendarIcon className="h-3.5 w-3.5" />
                            <span>{rangeLabel}</span>
                        </div>
                    </div>

                    {/* Right: Search / Filter / Export / Manage */}
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Search (no ring) */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                value={query}
                                onChange={(e) => { setQuery(e.target.value); setPage(1) }}
                                placeholder="Search clients..."
                                className="h-9 w-64 rounded-lg border border-gray-200 bg-white pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400
                           focus:outline-none focus:ring-0 focus:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
                            />
                        </div>

                        {/* Filter (no count badge) */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button size="sm" className={`gap-2 ${btnNeutral}`}>
                                    <Filter className="h-4 w-4" />
                                    Filter
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                className="w-64 max-h-80 overflow-y-auto bg-white border border-gray-200 shadow-lg dark:bg-gray-800 dark:border-gray-700"
                            >
                                <DropdownMenuLabel className="text-gray-700 dark:text-gray-200">Service Type</DropdownMenuLabel>
                                {serviceOptions.length ? (
                                    serviceOptions.map((s) => (
                                        <DropdownMenuCheckboxItem
                                            key={s}
                                            checked={selectedServices.has(s)}
                                            onCheckedChange={() => toggleService(s)}
                                            className="text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700"
                                        >
                                            {s}
                                        </DropdownMenuCheckboxItem>
                                    ))
                                ) : (
                                    <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">No services</div>
                                )}
                                <DropdownMenuSeparator className="bg-gray-100 dark:bg-gray-700" />
                                <DropdownMenuLabel className="text-gray-700 dark:text-gray-200">Status</DropdownMenuLabel>
                                {statusOptions.length ? (
                                    statusOptions.map((s) => (
                                        <DropdownMenuCheckboxItem
                                            key={s}
                                            checked={selectedStatuses.has(s)}
                                            onCheckedChange={() => toggleStatus(s)}
                                            className="text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700"
                                        >
                                            {s}
                                        </DropdownMenuCheckboxItem>
                                    ))
                                ) : (
                                    <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">No statuses</div>
                                )}
                                {(selectedServices.size + selectedStatuses.size) > 0 && (
                                    <>
                                        <DropdownMenuSeparator className="bg-gray-100 dark:bg-gray-700" />
                                        <DropdownMenuItem
                                            onClick={clearFilters}
                                            className="text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700"
                                        >
                                            Clear all filters
                                        </DropdownMenuItem>
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button size="sm" onClick={handleExport} className={`gap-2 ${btnNeutral}`}>
                            <FileDown className="h-4 w-4" />
                            Export
                        </Button>

                        {onDashboard && (
                            <Link to={manageHref}>
                                <Button size="sm" className={`gap-2 ${btnNeutral}`}>
                                    <Maximize2 className="h-4 w-4" />
                                    Manage
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="border-gray-100 hover:bg-transparent dark:border-gray-800">
                            <TableHead className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                                ID
                            </TableHead>
                            <TableHead className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                                Client
                            </TableHead>
                            <TableHead className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                                Service
                            </TableHead>
                            <TableHead className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                                Status
                            </TableHead>
                            <TableHead
                                className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                onClick={() => toggleSort("date")}
                            >
                                <span className="inline-flex items-center gap-1">
                                    Date
                                    <ChevronsUpDown className="h-3 w-3" />
                                </span>
                            </TableHead>
                            <TableHead
                                className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                onClick={() => toggleSort("time")}
                            >
                                <span className="inline-flex items-center gap-1">
                                    Time
                                    <ChevronsUpDown className="h-3 w-3" />
                                </span>
                            </TableHead>
                            <TableHead className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider text-right dark:text-gray-400">
                                Actions
                            </TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {paged.length === 0 ? (
                            <TableRow className="border-gray-100 dark:border-gray-800">
                                <TableCell colSpan={7} className="px-6 py-16 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center dark:bg-gray-800">
                                            <Search className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">No appointments found</p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500">Try adjusting your search or filters</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            paged.map((r, idx) => (
                                <TableRow
                                    key={`${r.id ?? "row"}-${startIndex + idx}`}
                                    className="border-gray-100 hover:bg-gray-50/50 transition-colors dark:border-gray-800 dark:hover:bg-gray-800/50"
                                >
                                    <TableCell className="px-6 py-4">
                                        <span className="text-sm font-mono text-gray-500 dark:text-gray-400">#{r.id ?? "—"}</span>
                                    </TableCell>

                                    <TableCell className="px-6 py-4">
                                        <div className="space-y-1">
                                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{r.name || "—"}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">{r.email || "—"}</div>
                                        </div>
                                    </TableCell>

                                    <TableCell className="px-6 py-4">
                                        <span className="text-sm text-gray-700 dark:text-gray-300">{r.serviceType || "—"}</span>
                                    </TableCell>

                                    <TableCell className="px-6 py-4">
                                        <Badge className={statusClass(r.status)}>{r.status || "—"}</Badge>
                                    </TableCell>

                                    <TableCell className="px-6 py-4">
                                        <span className="text-sm text-gray-700 dark:text-gray-300">{fmtDate(r.date) || "—"}</span>
                                    </TableCell>

                                    <TableCell className="px-6 py-4">
                                        <span className="text-sm text-gray-700 dark:text-gray-300">{fmtTime(r.time) || "—"}</span>
                                    </TableCell>

                                    <TableCell className="px-6 py-4 text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-gray-800 focus:outline-none focus-visible:ring-0"
                                                >
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent
                                                align="end"
                                                className="w-48 bg-white border border-gray-200 shadow-lg dark:bg-gray-800 dark:border-gray-700"
                                            >
                                                <DropdownMenuItem onClick={() => onView?.(r)} className="text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700">
                                                    View details
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => onEdit?.(r)} className="text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700">
                                                    Edit appointment
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator className="bg-gray-100 dark:bg-gray-700" />
                                                <DropdownMenuItem className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20" onClick={() => onDelete?.(r)}>
                                                    Delete appointment
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Footer (no “Showing X–Y of Z”) */}
            <div className="border-t border-gray-100 px-6 py-4 dark:border-gray-800">
                <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600 dark:text-gray-400">Rows per page:</span>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button size="sm" className={`h-8 w-12 ${btnNeutral}`}>
                                    {pageSize}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="start"
                                className="bg-white border border-gray-200 shadow-lg dark:bg-gray-800 dark:border-gray-700"
                            >
                                {[5, 10, 20, 50].map((n) => (
                                    <DropdownMenuItem
                                        key={n}
                                        onClick={() => { setPageSize(n); setPage(1) }}
                                        className="text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700"
                                    >
                                        {n}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center gap-1">
                        <Button
                            size="sm"
                            className={`gap-1 ${btnNeutral} disabled:opacity-50`}
                            disabled={safePage <= 1}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                        </Button>

                        <div className="flex items-center gap-1">
                            {pageList(safePage, totalPages).map((n, i, arr) => {
                                const prev = arr[i - 1]
                                const needsDots = prev && n - prev > 1
                                const isActive = n === safePage
                                return (
                                    <React.Fragment key={n}>
                                        {needsDots && <span className="px-2 text-gray-400 dark:text-gray-500">…</span>}
                                        <Button
                                            size="sm"
                                            className={`h-8 w-8 p-0 ${isActive
                                                ? "bg-gray-900 text-white hover:bg-black focus:outline-none focus-visible:ring-0"
                                                : btnNeutral
                                                }`}
                                            onClick={() => setPage(n)}
                                        >
                                            {n}
                                        </Button>
                                    </React.Fragment>
                                )
                            })}
                        </div>

                        <Button
                            size="sm"
                            className={`gap-1 ${btnNeutral} disabled:opacity-50`}
                            disabled={safePage >= totalPages}
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        >
                            Next
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
