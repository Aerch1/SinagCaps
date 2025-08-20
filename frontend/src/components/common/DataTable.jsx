"use client"

import React, { useMemo, useState } from "react"
import { Link } from "react-router-dom"
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
import { Filter, Search, Maximize2, MoreHorizontal, ChevronsUpDown, ChevronLeft, ChevronRight } from "lucide-react"

/* ---------------- utils ---------------- */

const statusClass = (s) => {
    const v = String(s || "").toLowerCase()
    if (v === "success" || v === "completed" || v === "approved")
        return "bg-emerald-100 text-emerald-700 w-20 rounded-full uppercase px-2 py-1 text-xs font-medium dark:bg-emerald-500/20 dark:text-emerald-300"
    if (v === "failed" || v === "canceled" || v === "rejected")
        return "bg-red-100 text-red-700 w-20 rounded-full uppercase px-2 py-1 text-xs font-medium dark:bg-red-500/20 dark:text-red-300"
    if (v === "pending" || v === "scheduled")
        return "bg-amber-100 text-amber-700 w-20 rounded-full uppercase px-2 py-1 text-xs font-medium dark:bg-amber-500/20 dark:text-amber-300"
    return "bg-gray-100 text-gray-700 w-20 rounded-full uppercase px-2 py-1 text-xs font-medium dark:bg-slate-600/30 dark:text-slate-300"
}

const toDateObj = (row) => {
    const iso = row?.date && row?.time ? `${row.date}T${row.time}` : `${row?.date || ""} ${row?.time || ""}`
    const d = new Date(iso)
    return isNaN(d) ? new Date() : d
}

const fmtDate = (isoYmd) => {
    if (!isoYmd) return ""
    const d = new Date(isoYmd)
    if (!isNaN(d)) {
        return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(d)
    }
    return isoYmd
}

const fmtTime = (hhmm) => {
    if (!hhmm) return ""
    const d = new Date(`1970-01-01T${hhmm}`)
    if (!isNaN(d)) {
        return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(d)
    }
    return hhmm
}

const pageList = (page, total) => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
    const items = new Set([1, 2, total - 1, total, page - 1, page, page + 1])
    return [...items].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b)
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
    const statusOptions = useMemo(() => Array.from(new Set(rows.map((r) => r.status).filter(Boolean))).sort(), [rows])

    // filter + search + sort
    const filtered = useMemo(() => {
        let data = rows

        if (query.trim()) {
            const q = query.toLowerCase()
            data = data.filter((r) => (r.name || "").toLowerCase().includes(q) || (r.email || "").toLowerCase().includes(q))
        }

        if (selectedServices.size) data = data.filter((r) => selectedServices.has(r.serviceType))
        if (selectedStatuses.size) data = data.filter((r) => selectedStatuses.has(r.status))

        if (sort.key === "date") {
            data = [...data].sort((a, b) => (sort.dir === "asc" ? toDateObj(a) - toDateObj(b) : toDateObj(b) - toDateObj(a)))
        } else if (sort.key === "time") {
            data = [...data].sort((a, b) => {
                const da = toDateObj({ date: "1970-01-01", time: a.time })
                const db = toDateObj({ date: "1970-01-01", time: b.time })
                return sort.dir === "asc" ? da - db : db - da
            })
        }

        return data
    }, [rows, query, selectedServices, selectedStatuses, sort])

    // pagination slice
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
    const safePage = Math.min(page, totalPages)
    const startIndex = (safePage - 1) * pageSize
    const paged = useMemo(() => {
        const start = (safePage - 1) * pageSize
        return filtered.slice(start, start + pageSize)
    }, [filtered, safePage, pageSize])

    const toggleSort = (key) => {
        setSort((s) => (s.key !== key ? { key, dir: "asc" } : { key, dir: s.dir === "asc" ? "desc" : "asc" }))
    }

    const toggleService = (value) =>
        setSelectedServices((prev) => {
            const n = new Set(prev)
            n.has(value) ? n.delete(value) : n.add(value)
            setPage(1)
            return n
        })

    const toggleStatus = (value) =>
        setSelectedStatuses((prev) => {
            const n = new Set(prev)
            n.has(value) ? n.delete(value) : n.add(value)
            setPage(1)
            return n
        })

    const clearFilters = () => {
        setSelectedServices(new Set())
        setSelectedStatuses(new Set())
        setPage(1)
    }

    // consistent cell padding
    const cellPad = "px-4 py-3 md:px-6 md:py-4"

    return (
        <div className="h-full rounded-lg border border-gray-200 bg-white p-4 md:p-6 dark:border-slate-700 dark:bg-slate-800">
            {/* top controls */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Latest Appointments</div>

                {/* Right controls */}
                <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                    {/* Filter */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                className="h-9 gap-2 shrink-0 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-700 bg-transparent"
                            >
                                <Filter className="h-4 w-4" />
                                <span className="hidden sm:inline">Filter</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className="w-56 max-h-80 overflow-y-auto scroll-thin bg-white border border-gray-200 shadow-lg dark:bg-slate-800 dark:border-slate-600 dark:shadow-slate-900/20"
                        >
                            <DropdownMenuLabel className="text-slate-700 dark:text-slate-200">Service Type</DropdownMenuLabel>
                            {serviceOptions.length ? (
                                serviceOptions.map((s) => (
                                    <DropdownMenuCheckboxItem
                                        key={s}
                                        checked={selectedServices.has(s)}
                                        onCheckedChange={() => toggleService(s)}
                                        className="text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 focus:bg-slate-100 dark:focus:bg-slate-700"
                                    >
                                        {s}
                                    </DropdownMenuCheckboxItem>
                                ))
                            ) : (
                                <div className="px-2 py-1.5 text-xs text-gray-500 dark:text-slate-400">No services</div>
                            )}
                            <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-600" />
                            <DropdownMenuLabel className="text-slate-700 dark:text-slate-200">Status</DropdownMenuLabel>
                            {statusOptions.length ? (
                                statusOptions.map((s) => (
                                    <DropdownMenuCheckboxItem
                                        key={s}
                                        checked={selectedStatuses.has(s)}
                                        onCheckedChange={() => toggleStatus(s)}
                                        className="text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 focus:bg-slate-100 dark:focus:bg-slate-700"
                                    >
                                        {s}
                                    </DropdownMenuCheckboxItem>
                                ))
                            ) : (
                                <div className="px-2 py-1.5 text-xs text-gray-500 dark:text-slate-400">No statuses</div>
                            )}
                            <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-600" />
                            <DropdownMenuItem
                                onClick={clearFilters}
                                className="text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 focus:bg-slate-100 dark:focus:bg-slate-700"
                            >
                                Clear filters
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Search */}
                    <div className="relative order-last w-full min-w-0 sm:order-none sm:w-56">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                        <input
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value)
                                setPage(1)
                            }}
                            placeholder="Search client or email…"
                            className="h-9 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-blue-500/30 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus-visible:ring-blue-400/30"
                        />
                    </div>

                    {/* Manage */}
                    <Link to={manageHref} className="inline-flex shrink-0">
                        <Button
                            variant="outline"
                            className="h-9 w-9 p-0 sm:w-auto sm:px-3 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-700 bg-transparent"
                            title="Manage appointments"
                        >
                            <Maximize2 className="h-4 w-4" />
                            <span className="sr-only sm:not-sr-only sm:ml-2">Manage</span>
                        </Button>
                    </Link>
                </div>
            </div>

            {/* table */}
            <div className="overflow-x-auto scroll-thin">
                <Table>
                    <TableHeader>
                        <TableRow className="border-slate-200 dark:border-slate-700">
                            <TableHead className={`${cellPad} min-w-[200px] text-slate-500 dark:text-slate-400`}>
                                Client Name · Mail
                            </TableHead>
                            <TableHead className={`${cellPad} text-slate-500 dark:text-slate-400`}>Service Type</TableHead>
                            <TableHead className={`${cellPad} text-slate-500 dark:text-slate-400`}>Status</TableHead>
                            <TableHead
                                className={`${cellPad} cursor-pointer select-none text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200`}
                                onClick={() => toggleSort("date")}
                            >
                                <span className="inline-flex items-center gap-1">
                                    Date
                                    <ChevronsUpDown className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                                </span>
                            </TableHead>
                            <TableHead
                                className={`${cellPad} cursor-pointer select-none text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200`}
                                onClick={() => toggleSort("time")}
                            >
                                <span className="inline-flex items-center gap-1">
                                    Time
                                    <ChevronsUpDown className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                                </span>
                            </TableHead>
                            <TableHead className={`${cellPad} text-right text-slate-500 dark:text-slate-400`}>Actions</TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {paged.length === 0 ? (
                            <TableRow className="border-slate-200 dark:border-slate-700">
                                <TableCell
                                    colSpan={6}
                                    className={`${cellPad} py-10 text-center text-sm text-slate-500 dark:text-slate-400`}
                                >
                                    No results
                                </TableCell>
                            </TableRow>
                        ) : (
                            paged.map((r, idx) => (
                                <TableRow
                                    key={`${r.id ?? "row"}-${startIndex + idx}`}
                                    className="border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700/40"
                                >
                                    <TableCell className={cellPad}>
                                        <div className="font-medium text-slate-900 dark:text-slate-100">{r.name}</div>
                                        <div className="text-xs text-slate-700 dark:text-slate-400">{r.email}</div>
                                    </TableCell>

                                    <TableCell className={`${cellPad} whitespace-nowrap`}>
                                        <span className="text-sm text-slate-700 dark:text-slate-300">{r.serviceType}</span>
                                    </TableCell>

                                    <TableCell className={`${cellPad} whitespace-nowrap`}>
                                        <Badge className={statusClass(r.status)}>{r.status}</Badge>
                                    </TableCell>

                                    <TableCell className={`${cellPad} whitespace-nowrap text-slate-700 dark:text-slate-300`}>
                                        {fmtDate(r.date)}
                                    </TableCell>
                                    <TableCell className={`${cellPad} whitespace-nowrap text-slate-700 dark:text-slate-300`}>
                                        {fmtTime(r.time)}
                                    </TableCell>

                                    <TableCell className={`${cellPad} text-right`}>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100 dark:hover:bg-slate-700"
                                                >
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent
                                                align="end"
                                                className="w-40 bg-white border border-slate-200 shadow-lg dark:bg-slate-800 dark:border-slate-600 dark:shadow-slate-900/20"
                                            >
                                                <DropdownMenuItem
                                                    onClick={() => onView?.(r)}
                                                    className="text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 focus:bg-slate-100 dark:focus:bg-slate-700"
                                                >
                                                    View details
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => onEdit?.(r)}
                                                    className="text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 focus:bg-slate-100 dark:focus:bg-slate-700"
                                                >
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-600" />
                                                <DropdownMenuItem
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 focus:text-red-700 focus:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 dark:focus:text-red-300 dark:focus:bg-red-900/20"
                                                    onClick={() => onDelete?.(r)}
                                                >
                                                    Delete
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

            {/* footer */}
            <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <span>Result per page:</span>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                className="h-8 px-3 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-700 bg-transparent"
                            >
                                {pageSize}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="start"
                            className="bg-white border border-slate-200 shadow-lg dark:bg-slate-800 dark:border-slate-600 dark:shadow-slate-900/20"
                        >
                            {[5, 10, 20].map((n) => (
                                <DropdownMenuItem
                                    key={n}
                                    onClick={() => {
                                        setPageSize(n)
                                        setPage(1)
                                    }}
                                    className="text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 focus:bg-slate-100 dark:focus:bg-slate-700"
                                >
                                    {n}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="flex items-center gap-1">
                    <Button
                        variant="outline"
                        className="h-8 px-3 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed bg-transparent"
                        disabled={safePage <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                        <ChevronLeft className="mr-1 h-4 w-4" /> Previous
                    </Button>

                    {pageList(safePage, totalPages).map((n, i, arr) => {
                        const prev = arr[i - 1]
                        const needsDots = prev && n - prev > 1
                        const isActive = n === safePage

                        return (
                            <React.Fragment key={n}>
                                {needsDots && <span className="px-1 text-slate-500 dark:text-slate-400">…</span>}
                                <Button
                                    variant={isActive ? "default" : "outline"}
                                    className={`h-8 w-9 px-0 ${isActive
                                            ? "bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                                            : "text-slate-700 border-slate-300 hover:bg-slate-100 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700"
                                        }`}
                                    onClick={() => setPage(n)}
                                >
                                    {n}
                                </Button>
                            </React.Fragment>
                        )
                    })}

                    <Button
                        variant="outline"
                        className="h-8 px-3 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed bg-transparent"
                        disabled={safePage >= totalPages}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    >
                        Next <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
