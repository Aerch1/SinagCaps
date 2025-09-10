// src/components/common/DataTable.jsx
"use client"

import React, { useMemo, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search, MoreHorizontal } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox" // assuming you already have shadcn/ui checkbox

/* ---------------- utils ---------------- */

const statusClass = (s) => {
    const v = String(s || "").toLowerCase()
    if (v === "activated")
        return "bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full px-3 py-1 text-xs font-medium"
    if (v === "deactivated")
        return "bg-gray-50 text-gray-600 border border-gray-200 rounded-full px-3 py-1 text-xs font-medium"
    if (v === "mute" || v === "muted")
        return "bg-red-50 text-red-600 border border-red-200 rounded-full px-3 py-1 text-xs font-medium"
    return "bg-gray-50 text-gray-600 border border-gray-200 rounded-full px-3 py-1 text-xs font-medium"
}

/* --------------- component --------------- */

export default function DataTable({
    rows = [],
    onView,
}) {
    const [query, setQuery] = useState("")
    const [selected, setSelected] = useState([])

    const filtered = useMemo(() => {
        if (!query.trim()) return rows
        const q = query.toLowerCase()
        return rows.filter(
            (r) =>
                r.firstName?.toLowerCase().includes(q) ||
                r.lastName?.toLowerCase().includes(q) ||
                r.email?.toLowerCase().includes(q)
        )
    }, [rows, query])

    const allSelected = filtered.length > 0 && selected.length === filtered.length

    const toggleAll = () => {
        if (allSelected) setSelected([])
        else setSelected(filtered.map((r) => r.id))
    }

    const toggleOne = (id) => {
        setSelected((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        )
    }

    return (
        <div className="rounded-lg border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-800">
            {/* Header with Search */}
            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                    User List
                </h2>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search user..."
                        className="h-9 w-64 rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0 focus:border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="px-4 w-10">
                                <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                            </TableHead>
                            <TableHead className="px-6 py-3">First Name</TableHead>
                            <TableHead className="px-6 py-3">Last Name</TableHead>
                            <TableHead className="px-6 py-3">Email</TableHead>
                            <TableHead className="px-6 py-3">Status</TableHead>
                            <TableHead className="px-6 py-3">Last Access</TableHead>
                            <TableHead className="px-6 py-3 text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="px-6 py-10 text-center text-gray-500">
                                    No users found
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((r, idx) => (
                                <TableRow key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                    <TableCell className="px-4">
                                        <Checkbox
                                            checked={selected.includes(r.id)}
                                            onCheckedChange={() => toggleOne(r.id)}
                                        />
                                    </TableCell>
                                    <TableCell className="px-6 py-3">{r.firstName}</TableCell>
                                    <TableCell className="px-6 py-3">{r.lastName}</TableCell>
                                    <TableCell className="px-6 py-3 text-blue-600">{r.email}</TableCell>
                                    <TableCell className="px-6 py-3">
                                        <Badge className={statusClass(r.status)}>{r.status}</Badge>
                                    </TableCell>
                                    <TableCell className="px-6 py-3 text-sm text-gray-500">
                                        {r.lastAccess}
                                    </TableCell>
                                    <TableCell className="px-6 py-3 text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-gray-800"
                                                >
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            {/* 👇 z-index fix applied */}
                                            <DropdownMenuContent
                                                align="end"
                                                className="z-[9999] w-48 bg-white border border-gray-200 shadow-lg dark:bg-gray-800 dark:border-gray-700"
                                            >
                                                <DropdownMenuItem onClick={() => onView?.(r)}>
                                                    View Details
                                                </DropdownMenuItem>
                                                {/* ⚠️ No Edit/Delete (illegal for personal data) */}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
