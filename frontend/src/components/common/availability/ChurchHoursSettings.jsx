"use client";

import { useEffect, useState, useContext } from "react";
import { UNSAFE_NavigationContext } from "react-router-dom";
import api from "@/api/api";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function useBlocker(blocker, when = true) {
    const { navigator } = useContext(UNSAFE_NavigationContext);

    useEffect(() => {
        if (!when) return;

        const push = navigator.push;
        const replace = navigator.replace;

        navigator.push = (...args) => {
            if (blocker()) return;
            push(...args);
        };
        navigator.replace = (...args) => {
            if (blocker()) return;
            replace(...args);
        };

        return () => {
            navigator.push = push;
            navigator.replace = replace;
        };
    }, [navigator, blocker, when]);
}

export default function ChurchHoursSettings() {
    const [hours, setHours] = useState([]);
    const [original, setOriginal] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchHours = async () => {
        try {
            const res = await api.get("/admin/church-hours");
            if (res.data.success) {
                setHours(res.data.hours);
                setOriginal(res.data.hours);
            }
        } catch (err) {
            console.error("❌ fetchHours error", err);
            toast.error("Failed to load church hours");
        }
    };

    const handleSave = async () => {
        const hasChanges = JSON.stringify(hours) !== JSON.stringify(original);
        if (!hasChanges) {
            toast("No changes to save", { icon: "ℹ️" });
            return;
        }

        setLoading(true);
        try {
            for (const row of hours) {
                await api.put(`/admin/church-hours/${row.day_of_week}`, row);
            }
            toast.success("Church hours updated successfully");
            fetchHours();
        } catch (err) {
            console.error("❌ handleSave error", err);
            toast.error("Failed to save changes");
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async () => {
        try {
            await api.post("/admin/church-hours/reset");
            toast.success("Reset to default hours");
            fetchHours();
        } catch (err) {
            console.error("❌ handleReset error", err);
            toast.error("Failed to reset");
        }
    };

    useBlocker(() => {
        const hasChanges = JSON.stringify(hours) !== JSON.stringify(original);
        if (hasChanges) {
            return !window.confirm("⚠ You have unsaved changes. Leave without saving?");
        }
        return false;
    }, true);

    useEffect(() => {
        fetchHours();
    }, []);

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6 w-full overflow-x-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
                <h2 className="text-lg font-semibold">Church Working Hours</h2>
                <Button
                    size="sm"
                    className="bg-secondary text-white hover:bg-secondary/90"
                    onClick={handleReset}
                >
                    Reset to Default
                </Button>
            </div>

            {/* Responsive table wrapper */}
            <div className="overflow-x-auto w-full">
                <table className="min-w-full border text-sm table-auto">
                    <thead>
                        <tr className="bg-gray-50">
                            <th className="p-2 border text-left">Day</th>
                            <th className="p-2 border text-center">Open</th>
                            <th className="p-2 border text-center">Close</th>
                            <th className="p-2 border text-center">Closed?</th>
                        </tr>
                    </thead>
                    <tbody>
                        {hours.map((row) => (
                            <tr key={row.day_of_week} className={row.is_closed ? "bg-gray-100" : ""}>
                                <td className="p-2 border font-medium">{WEEKDAYS[row.day_of_week]}</td>
                                <td className="p-2 border text-center">
                                    <input
                                        type="time"
                                        value={row.open_time.slice(0, 5)}
                                        disabled={row.is_closed}
                                        onChange={(e) =>
                                            setHours((prev) =>
                                                prev.map((r) =>
                                                    r.day_of_week === row.day_of_week
                                                        ? { ...r, open_time: e.target.value }
                                                        : r
                                                )
                                            )
                                        }
                                        className="border rounded px-2 py-1 text-sm w-full max-w-[80px]"
                                    />
                                </td>
                                <td className="p-2 border text-center">
                                    <input
                                        type="time"
                                        value={row.close_time.slice(0, 5)}
                                        disabled={row.is_closed}
                                        onChange={(e) =>
                                            setHours((prev) =>
                                                prev.map((r) =>
                                                    r.day_of_week === row.day_of_week
                                                        ? { ...r, close_time: e.target.value }
                                                        : r
                                                )
                                            )
                                        }
                                        className="border rounded px-2 py-1 text-sm w-full max-w-[80px]"
                                    />
                                </td>
                                <td className="p-2 border text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <label className="relative inline-flex cursor-pointer items-center">
                                            <input
                                                type="checkbox"
                                                className="peer sr-only"
                                                checked={!row.is_closed}
                                                onChange={(e) =>
                                                    setHours((prev) =>
                                                        prev.map((r) =>
                                                            r.day_of_week === row.day_of_week
                                                                ? { ...r, is_closed: !e.target.checked }
                                                                : r
                                                        )
                                                    )
                                                }
                                            />
                                            <div className="peer h-6 w-11 rounded-full bg-gray-300 transition-colors duration-200 peer-checked:bg-secondary" />
                                            <span className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out peer-checked:translate-x-5" />
                                        </label>
                                        <span
                                            className={`text-xs font-medium ${row.is_closed ? "text-red-600" : "text-gray-600"
                                                }`}
                                        >
                                            {row.is_closed ? "Closed" : "Open"}
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Button
                onClick={handleSave}
                disabled={loading}
                className="mt-4 bg-secondary text-white hover:bg-secondary/90"
            >
                {loading ? "Saving…" : "Save Changes"}
            </Button>
        </div>
    );
}
