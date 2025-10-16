import { useState, useMemo } from "react";
import toast from "react-hot-toast";
import api from "@/api/api";
import Modal from "../../ui/Modal"; // ✅ Use your existing Modal

const PERIODS = ["Last 7 days", "This Month", "This Year", "Custom"];
const toDate = (s) => (s ? new Date(s) : null);

function startEndForPeriod(period) {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    if (period === "Last 7 days") {
        const s = new Date(t);
        s.setDate(t.getDate() - 6);
        return { start: s, end: t };
    }
    if (period === "This Month")
        return {
            start: new Date(t.getFullYear(), t.getMonth(), 1),
            end: new Date(t.getFullYear(), t.getMonth() + 1, 0),
        };
    if (period === "This Year") return { start: new Date(t.getFullYear(), 0, 1), end: t };
    return { start: null, end: null };
}

// ✅ Accept `open` instead of `isOpen`
export default function AppointmentExportModal({ open, onClose, adminName }) {
    const [period, setPeriod] = useState("Last 7 days");
    const [customStart, setCustomStart] = useState("");
    const [customEnd, setCustomEnd] = useState("");
    const [scope, setScope] = useState("all");
    const [format, setFormat] = useState("Excel");
    const [loading, setLoading] = useState(false);

    const range = useMemo(() => {
        if (period !== "Custom") return startEndForPeriod(period);
        return { start: toDate(customStart), end: toDate(customEnd) };
    }, [period, customStart, customEnd]);

    const handleGenerate = async () => {
        setLoading(true);
        try {
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
                    type: "appointments",
                    scope,
                    startDate,
                    endDate,
                    format: format.toLowerCase(),
                    admin: adminName || "System",
                },
            });

            const blob = new Blob([response.data], {
                type:
                    format === "PDF"
                        ? "application/pdf"
                        : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });
            const url = URL.createObjectURL(blob);
            const ext = format.toLowerCase() === "pdf" ? "pdf" : "xlsx";
            const filename = `appointments-report-${Date.now()}.${ext}`;
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            a.click();
            onClose();
        } catch (err) {
            console.error("Export failed:", err);
            toast.error("Failed to generate appointment report");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal open={open} onClose={onClose} title="Export Appointments" className="max-w-md">
            {/* Scope */}
            <div className="mb-4 flex gap-2">
                <label>
                    <input
                        type="radio"
                        name="scope"
                        value="all"
                        checked={scope === "all"}
                        onChange={() => setScope("all")}
                    />
                    All appointments
                </label>
                <label>
                    <input
                        type="radio"
                        name="scope"
                        value="pending"
                        checked={scope === "pending"}
                        onChange={() => setScope("pending")}
                    />
                    Pending only
                </label>
            </div>

            {/* Date Range */}
            <div className="mb-4">
                <label className="block mb-1 text-sm">Date Range</label>
                <select
                    className="border p-2 rounded w-full"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                >
                    {PERIODS.map((p) => (
                        <option key={p} value={p}>
                            {p}
                        </option>
                    ))}
                </select>
                {period === "Custom" && (
                    <div className="mt-2 flex gap-2">
                        <input
                            type="date"
                            className="border p-1 rounded flex-1"
                            value={customStart}
                            onChange={(e) => setCustomStart(e.target.value)}
                        />
                        <input
                            type="date"
                            className="border p-1 rounded flex-1"
                            value={customEnd}
                            onChange={(e) => setCustomEnd(e.target.value)}
                        />
                    </div>
                )}
            </div>

            {/* Format */}
            <div className="mb-4 flex gap-2">
                {["Excel", "PDF"].map((f) => (
                    <label key={f} className="flex items-center gap-1">
                        <input
                            type="radio"
                            name="format"
                            value={f}
                            checked={format === f}
                            onChange={() => setFormat(f)}
                        />
                        {f}
                    </label>
                ))}
            </div>

            <div className="flex justify-end gap-2">
                <button className="px-3 py-1 rounded border" onClick={onClose}>
                    Cancel
                </button>
                <button
                    className="px-3 py-1 rounded bg-blue-600 text-white"
                    onClick={handleGenerate}
                    disabled={loading}
                >
                    {loading ? "Generating..." : "Generate"}
                </button>
            </div>
        </Modal>
    );
}
