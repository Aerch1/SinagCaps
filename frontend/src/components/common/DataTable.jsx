
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
    getAppointments,
    filterAppointments,
    exportAppointments,
} from "../../api/appointments.js";
import {
    Search,
    FileDown,
    X,
    Eye,
    ChevronsUpDown,
    Check,
    Archive,
    CalendarClock,
    RefreshCcw,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import FilterDropdown from "../ui/FilterDropdown.jsx";
import ViewAppointmentModal from "../common/modal/ViewAppointmentModal.jsx";
import RejectCancelModal from "../common/modal/RejectCancelModal.jsx";
import RescheduleModal from "../common/modal/RescheduleModal.jsx";
import {
    statusClass,
    formatDate,
    formatTime,
    computeRange,
    formatStatusLabel,
} from "../../lib/utils.js";
import toast from "react-hot-toast";
import api from "@/api/api";

export default function DataTable({
    manageHref = "/admin/appointments",
    initialPageSize = 5,
    activeTab = "all",
}) {
    const location = useLocation();
    const onDashboard = /^\/admin\/?$/.test(location.pathname);

    const [rows, setRows] = useState([]);
    const [searchInput, setSearchInput] = useState("");
    const [query, setQuery] = useState("");

    // filters
    const [selectedServiceIds, setSelectedServiceIds] = useState([]);
    const [selectedStatuses, setSelectedStatuses] = useState([]);
    const [serviceOptions, setServiceOptions] = useState([]);
    const [statusOptions, setStatusOptions] = useState([]);

    // sorting & pagination
    const [sort, setSort] = useState({ key: "id", dir: "desc" });
    const [page, setPage] = useState(1);
    const [pageSize] = useState(initialPageSize);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    // modals
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showRescheduleModal, setShowRescheduleModal] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);

    // ranges
    const [showRangeKey, setShowRangeKey] = useState("all");
    const [{ startDate, endDate }, setRange] = useState({
        startDate: null,
        endDate: null,
    });

    const [loading, setLoading] = useState(false);
    const [viewingId, setViewingId] = useState(null);

    /* ---------------- Tab & Range Effects ---------------- */
    useEffect(() => {
        setSelectedStatuses(activeTab === "all" ? [] : [activeTab]);
        setPage(1);
    }, [activeTab]);

    useEffect(() => {
        setRange(computeRange(showRangeKey));
        setPage(1);
    }, [showRangeKey]);

    /* ---------------- Fetch Appointments ---------------- */
    const fetchData = async () => {
        try {
            setLoading(true);
            const payload = { page, pageSize, sortBy: sort.key, sortDir: sort.dir };
            if (query) payload.query = query;
            if (selectedStatuses.length) payload.status = selectedStatuses;
            if (selectedServiceIds.length) payload.serviceIds = selectedServiceIds;
            if (startDate && endDate) {
                payload.startDate = startDate;
                payload.endDate = endDate;
            }

            let res;
            if (
                query ||
                selectedServiceIds.length ||
                selectedStatuses.length ||
                startDate ||
                endDate
            ) {
                res = await filterAppointments(payload);
            } else {
                res = await getAppointments(payload);
            }

            const cleanData = (res.data || [])
                .map((a) => ({
                    ...a,
                    was_rescheduled: Boolean(a.was_rescheduled),
                }))
                .filter((r) =>
                    activeTab === "archived"
                        ? r.status === "archived"
                        : r.status !== "archived"
                );

            setRows(cleanData);
            setTotal(cleanData.length);
            setTotalPages(res.totalPages || 1);
            setServiceOptions(
                (res.meta?.services || []).map((s) => ({ value: s.id, label: s.name }))
            );
            setStatusOptions(
                (res.meta?.statuses || []).map((s) => ({
                    value: s,
                    label: formatStatusLabel(s),
                }))
            );
        } catch (err) {
            console.error("❌ fetch error:", err);
            setRows([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line
    }, [
        page,
        pageSize,
        query,
        selectedServiceIds,
        selectedStatuses,
        sort,
        startDate,
        endDate,
        activeTab,
    ]);
    /* ---------------- Debounced Search ---------------- */
    useEffect(() => {
        const delay = setTimeout(() => {
            setQuery(searchInput);
            setPage(1);
        }, 300);
        return () => clearTimeout(delay);
    }, [searchInput]);

    const cycleSort = (key) => {
        setSort((prev) =>
            prev.key === key
                ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
                : { key, dir: "asc" }
        );
    };

    /* ---------------- Status Change ---------------- */
    const handleStatusChange = async (r, newStatus) => {
        const oldStatus = r.status;
        setRows((prev) =>
            prev
                .map((row) => (row.id === r.id ? { ...row, status: newStatus } : row))
                .filter(
                    (row) =>
                        !(newStatus === "archived" && activeTab !== "archived")
                )
        );

        const toastId = toast.loading("Updating appointment...");
        try {
            const { data } = await api.patch(`/admin/appointments/${r.id}`, {
                status: newStatus,
            });
            toast.success(data.message || "Appointment updated", { id: toastId });
            if (!(newStatus === "archived" && activeTab !== "archived")) {
                fetchData();
            }
        } catch (err) {
            console.error("❌ update failed:", err);
            toast.error("Failed to update", { id: toastId });
            setRows((prev) =>
                prev.map((row) =>
                    row.id === r.id ? { ...row, status: oldStatus } : row
                )
            );
        }
    };

    /* ---------------- Render Actions ---------------- */
    const renderActions = (r) => {
        const status = String(r.status).toLowerCase();

        return (
            <div className="flex justify-end gap-1.5 whitespace-nowrap">
                {/* 👁 View Button */}
                <button
                    onClick={() => setViewingId(r.id)}
                    className="inline-flex items-center gap-1 px-2 py-1 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 text-xs"
                >
                    <Eye className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">View</span>
                </button>

                {status === "pending" && (
                    <>
                        <button
                            onClick={() => handleStatusChange(r, "approved")}
                            className="inline-flex items-center gap-1 px-2 py-1 border border-gray-300 text-green-600 rounded-md hover:bg-green-50 text-xs"
                        >
                            <Check className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Approve</span>
                        </button>

                        <button
                            onClick={() => {
                                setSelectedAppointment(r);
                                setShowRejectModal(true);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 border border-red-300 text-red-600 rounded-md hover:bg-red-50 text-xs"
                        >
                            <X className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Reject</span>
                        </button>
                    </>
                )}

                {status === "approved" && (
                    <>
                        <button
                            onClick={() => {
                                setSelectedAppointment(r);
                                setShowRescheduleModal(true);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 border border-blue-300 text-blue-600 rounded-md hover:bg-blue-50 text-xs"
                        >
                            <CalendarClock className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Reschedule</span>
                        </button>

                        <button
                            onClick={() => {
                                setSelectedAppointment(r);
                                setShowCancelModal(true);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 border border-red-300 text-red-600 rounded-md hover:bg-red-50 text-xs"
                        >
                            <X className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Cancel</span>
                        </button>
                    </>
                )}

                {status === "completed" && (
                    <button
                        onClick={() => handleStatusChange(r, "archived")}
                        className="inline-flex items-center gap-1 px-2 py-1 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 text-xs"
                    >
                        <Archive className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Archive</span>
                    </button>
                )}
            </div>
        );
    };

    /* ---------------- Pagination ---------------- */
    const pages = [];
    if (totalPages <= 7) for (let i = 1; i <= totalPages; i++) pages.push(i);
    else if (page <= 4) pages.push(1, 2, 3, 4, 5, "…", totalPages);
    else if (page >= totalPages - 3)
        pages.push(
            1,
            "…",
            totalPages - 4,
            totalPages - 3,
            totalPages - 2,
            totalPages - 1,
            totalPages
        );
    else pages.push(1, "…", page - 1, page, page + 1, "…", totalPages);

    return (
        <div className="flex flex-col gap-6">
            {/* ===== Section 1: Filters ===== */}
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-6">
                <div className="grid grid-cols-12 gap-4 items-end">
                    {/* Search */}
                    <div className="col-span-12 md:col-span-6">
                        <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">
                            What are you looking for?
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder="Search name, email, id…"
                                className="h-10 w-full rounded-lg border border-gray-300 pl-10 pr-10 text-sm"
                            />
                            {query && (
                                <button
                                    onClick={() => {
                                        setSearchInput("");
                                        setQuery("");
                                        setPage(1);
                                    }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    title="Clear"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Service filter */}
                    <div className="col-span-6 md:col-span-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">
                            Category
                        </label>
                        <FilterDropdown
                            mode="service"
                            selectionMode="multi"
                            options={serviceOptions}
                            values={selectedServiceIds}
                            onChange={(vals) => {
                                setSelectedServiceIds(vals);
                                setPage(1);
                            }}
                        />
                    </div>

                    {/* Status filter */}
                    <div className="col-span-6 md:col-span-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">
                            Status
                        </label>
                        <FilterDropdown
                            mode="status"
                            selectionMode="multi"
                            options={statusOptions}
                            values={selectedStatuses}
                            onChange={(vals) => {
                                setSelectedStatuses(vals);
                                setPage(1);
                            }}
                        />
                    </div>

                    {/* Search button */}
                    <div className="col-span-12 md:col-span-2 flex">
                        <button
                            onClick={() => {
                                setQuery(searchInput);
                                setPage(1);
                            }}
                            className="h-10 px-4 w-full rounded-lg bg-secondary text-white text-sm font-medium hover:bg-secondary/90"
                        >
                            Search
                        </button>
                    </div>
                </div>
            </div>

            {/* ===== Section 2: Table with header controls ===== */}
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-x-auto flex flex-col max-h-[800px]">
                {/* Top controls bar */}
                <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <div className="text-sm font-semibold text-gray-800">
                            Appointment Transactions
                        </div>
                        {showRangeKey !== "all" && (
                            <div className="text-xs text-gray-500 mt-0.5">
                                Showing: {computeRange(showRangeKey).label}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Show</span>
                            <div className="min-w-[220px] overflow-visible">
                                <FilterDropdown
                                    mode="range"
                                    selectionMode="single"
                                    value={showRangeKey}
                                    onChange={setShowRangeKey}
                                    options={[
                                        { value: "all", label: "All" },
                                        { value: "7d", label: "Last 7 days" },
                                        { value: "month", label: "This month" },
                                        { value: "year", label: "This year" },
                                    ]}
                                />
                            </div>
                        </div>

                        <button
                            onClick={exportAppointments}
                            className="h-9 px-3 rounded-md border border-gray-300 bg-white text-sm hover:bg-gray-50 flex items-center gap-2"
                        >
                            <FileDown className="h-4 w-4" />
                            Export
                        </button>

                        {onDashboard && (
                            <Link to={manageHref}>
                                <button className="h-9 px-3 rounded-md border border-gray-300 bg-white text-sm hover:bg-gray-50 flex items-center gap-2">
                                    Manage
                                </button>
                            </Link>
                        )}
                    </div>
                </div>

                {/* Table */}
                <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-x-auto flex flex-col max-h-[800px]">
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <table className="min-w-full divide-y divide-gray-200 text-xs md:text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 md:px-4 py-3 md:py-4 text-left cursor-pointer whitespace-nowrap">
                                        <div className="flex items-center">
                                            ID{" "}
                                            <ChevronsUpDown className="inline h-3 w-3 ml-1" />
                                        </div>
                                    </th>
                                    <th className="px-4 md:px-4 py-3 md:py-4 text-left">
                                        Client
                                    </th>
                                    <th className="px-4 md:px-4 py-3 md:py-4 text-left">
                                        Contact
                                    </th>
                                    <th className="px-4 md:px-4 py-3 md:py-4 text-left">
                                        Service
                                    </th>
                                    <th className="px-4 md:px-4 py-3 md:py-4 text-left">
                                        Status
                                    </th>
                                    <th className="px-4 md:px-4 py-3 md:py-4 text-left">
                                        Schedule
                                    </th>
                                    <th className="px-4 md:px-4 py-3 md:py-4 text-left">
                                        Address
                                    </th>
                                    <th className="px-4 md:px-4 py-3 md:py-4 text-right">
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="bg-white divide-y divide-gray-200 text-gray-700">
                                <AnimatePresence>
                                    {loading ? (
                                        <motion.tr key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                            <td colSpan={8} className="h-32 text-center text-gray-500">
                                                Loading…
                                            </td>
                                        </motion.tr>
                                    ) : rows.length === 0 ? (
                                        <motion.tr key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                            <td colSpan={8} className="h-32 text-center text-gray-500">
                                                No results.
                                            </td>
                                        </motion.tr>
                                    ) : (
                                        rows.map((r) => (
                                            <motion.tr
                                                key={r.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="hover:bg-gray-50 transition-colors text-gray-700"
                                            >
                                                <td className="px-4 py-3 font-mono text-xs text-gray-500">#{r.id}</td>
                                                <td className="px-4 py-3">
                                                    <div className="font-medium text-gray-700 truncate">{r.name}</div>
                                                    <div className="text-xs text-gray-500 truncate">{r.email}</div>
                                                </td>
                                                <td className="px-4 py-3 text-gray-600">{r.contactNumber || "—"}</td>
                                                <td className="px-4 py-3 text-gray-600 truncate">{r.serviceName}</td>
                                                <td className="px-4 py-3">
                                                    <span className={statusClass(r.status)}>
                                                        {formatStatusLabel(r.status)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-gray-600">
                                                    <div>{formatDate(r.date)}</div>
                                                    <div className="text-xs text-gray-500 flex items-center gap-1">
                                                        {formatTime(r.time)}
                                                        {r.was_rescheduled && (
                                                            <span className="inline-flex items-center gap-1 text-[10px] text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-full">
                                                                <RefreshCcw className="w-3 h-3" />
                                                                Rescheduled
                                                            </span>
                                                        )}
                                                    </div>

                                                </td>
                                                <td className="px-4 py-3 text-gray-600 truncate">
                                                    {r.address || "—"}
                                                </td>
                                                <td className="px-4 py-3">{renderActions(r)}</td>
                                            </motion.tr>
                                        ))
                                    )}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                </div>
                {/* Pagination */}
                {total > 0 && (
                    <div className="border-t px-4 py-4 flex justify-between items-center">
                        <div className="text-sm text-gray-600">
                            Showing {(page - 1) * pageSize + 1} to{" "}
                            {Math.min(page * pageSize, total)} of {total}
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
                                    <span
                                        key={`dots-${i}`}
                                        className="h-9 w-9 flex items-center justify-center"
                                    >
                                        …
                                    </span>
                                ) : (
                                    <button
                                        key={`page-${n}`}
                                        onClick={() => setPage(n)}
                                        className={`h-9 w-9 rounded-md border text-sm ${n === page
                                            ? "bg-blue-600 text-white"
                                            : "bg-white hover:bg-gray-50"
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


            {/* View Modal */}
            {viewingId && (
                <ViewAppointmentModal
                    isOpen={!!viewingId}
                    appointmentId={viewingId}
                    onClose={() => setViewingId(null)}
                    onUpdate={(updated) =>
                        setRows((prev) =>
                            prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r))
                        )
                    }
                />
            )}

            {/* Reject Modal */}
            <RejectCancelModal
                open={showRejectModal}
                onClose={() => setShowRejectModal(false)}
                type="reject"
                appointment={selectedAppointment}
                onSuccess={() => {
                    setShowRejectModal(false);
                    fetchData(); // reload updated data
                }}
            />

            {/* Cancel Modal */}
            <RejectCancelModal
                open={showCancelModal}
                onClose={() => setShowCancelModal(false)}
                type="cancel"
                appointment={selectedAppointment}
                onSuccess={() => {
                    setShowCancelModal(false);
                    fetchData(); // reload updated data
                }}
            />

            <RescheduleModal
                open={showRescheduleModal}
                onClose={() => setShowRescheduleModal(false)}
                appointment={selectedAppointment}
                onSuccess={(updated) => {
                    setShowRescheduleModal(false);
                    toast.success("Appointment rescheduled!");
                    setRows((prev) =>
                        prev.map((r) =>
                            r.id === updated.id
                                ? { ...r, ...updated, was_rescheduled: true }
                                : r
                        )
                    );
                }}
            />

        </div>
    );
}