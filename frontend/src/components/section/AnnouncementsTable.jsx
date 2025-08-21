"use client";

import React, { useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, ChevronDown, MoreHorizontal, Edit2, Eye, EyeOff, Trash2 } from "lucide-react";

const STATUS = ["All Status", "Published", "Draft"];

const badgeStyles = (status) => {
    const s = String(status || "").toLowerCase();
    if (s === "published")
        return "bg-green-50 text-green-700 ring-1 ring-green-600/20 dark:bg-green-400/10 dark:text-green-300 dark:ring-green-400/20";
    if (s === "draft")
        return "bg-yellow-50 text-yellow-800 ring-1 ring-yellow-600/20 dark:bg-yellow-400/10 dark:text-yellow-300 dark:ring-yellow-400/20";
    return "bg-gray-50 text-gray-600 ring-1 ring-gray-500/10 dark:bg-gray-400/10 dark:text-gray-300 dark:ring-gray-400/20";
};

export default function AnnouncementsTable({
    rows = [],
    onEdit,
    onTogglePublish,
    onDelete,
}) {
    const [query, setQuery] = useState("");
    const [status, setStatus] = useState(STATUS[0]);

    const filtered = useMemo(() => {
        let data = rows;

        if (status !== "All Status") {
            data = data.filter((r) => String(r.status).toLowerCase() === status.toLowerCase());
        }

        if (query.trim()) {
            const q = query.toLowerCase();
            data = data.filter(
                (r) =>
                    (r.title || "").toLowerCase().includes(q) ||
                    (r.author || "").toLowerCase().includes(q) ||
                    (r.excerpt || "").toLowerCase().includes(q)
            );
        }

        return [...data].sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [rows, status, query]);

    return (
        <div>
            {/* header */}
            <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h3 className="text-base font-medium text-gray-900 dark:text-white">Announcements</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {filtered.length} {filtered.length === 1 ? "announcement" : "announcements"}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* search – subtle gray focus */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search announcements..."
                            className="
                w-64 rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm
                text-gray-900 placeholder:text-gray-500
                focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300
                dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400
                dark:focus:ring-gray-500 dark:focus:border-gray-500
              "
                        />
                    </div>

                    {/* filter – NO outline/ring on focus */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="
                  gap-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50
                  dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600
                  focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0
                "
                            >
                                {status}
                                <ChevronDown className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className="
                w-40 bg-white border border-gray-200 shadow-md
                dark:bg-gray-800 dark:border-gray-700
              "
                        >
                            <DropdownMenuLabel className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                                Filter by status
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-gray-100 dark:bg-gray-700" />
                            {STATUS.map((s) => (
                                <DropdownMenuItem
                                    key={s}
                                    onClick={() => setStatus(s)}
                                    className="cursor-pointer px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700"
                                >
                                    {s}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* table */}
            <div className="overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-gray-200 hover:bg-transparent dark:border-gray-700">
                                <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                    Title
                                </TableHead>
                                <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                    Author
                                </TableHead>
                                <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                    Date
                                </TableHead>
                                <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                    Status
                                </TableHead>
                                <TableHead className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {filtered.length === 0 ? (
                                <TableRow className="border-gray-200 dark:border-gray-700">
                                    <TableCell colSpan={5} className="px-6 py-16 text-center">
                                        <div className="text-gray-500 dark:text-gray-400">
                                            <div className="text-sm font-medium">No announcements found</div>
                                            <div className="mt-1 text-xs">
                                                {query ? "Try adjusting your search terms" : "Get started by creating your first announcement"}
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filtered.map((row, index) => (
                                    <TableRow
                                        key={row.id}
                                        className={`border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/50 ${index === filtered.length - 1 ? "border-b-0" : ""
                                            }`}
                                    >
                                        <TableCell className="px-6 py-4">
                                            <div className="max-w-xs">
                                                <div className="font-medium text-gray-900 dark:text-white">{row.title}</div>
                                                {row.excerpt && (
                                                    <div className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                                                        {row.excerpt}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                                            {row.author || "—"}
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                                            {new Date(row.date).toLocaleDateString("en-US", {
                                                year: "numeric",
                                                month: "short",
                                                day: "numeric",
                                            })}
                                        </TableCell>
                                        <TableCell className="px-6 py-4">
                                            <Badge className={`${badgeStyles(row.status)} rounded-full px-2.5 py-1 text-xs font-medium`}>
                                                {row.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="
                              h-8 w-8 p-0 text-gray-400 hover:text-gray-600
                              dark:text-gray-500 dark:hover:text-gray-300
                              focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0
                            "
                                                    >
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent
                                                    align="end"
                                                    className="w-32 bg-white border border-gray-200 shadow-md dark:bg-gray-800 dark:border-gray-700"
                                                >
                                                    <DropdownMenuItem
                                                        onClick={() => onEdit?.(row)}
                                                        className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700"
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => onTogglePublish?.(row)}
                                                        className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700"
                                                    >
                                                        {String(row.status).toLowerCase() === "published" ? (
                                                            <>
                                                                <EyeOff className="h-4 w-4" />
                                                                Unpublish
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Eye className="h-4 w-4" />
                                                                Publish
                                                            </>
                                                        )}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator className="bg-gray-100 dark:bg-gray-700" />
                                                    <DropdownMenuItem
                                                        onClick={() => onDelete?.(row)}
                                                        className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
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
            </div>
        </div>
    );
}
