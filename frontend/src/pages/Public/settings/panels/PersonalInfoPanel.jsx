"use client";
import { useAuthStore } from "../../../../store/authStore.js";

export default function PersonalInfoPanel() {
    const { user } = useAuthStore();
    return (
        <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Personal info</h2>
            <div className="rounded-xl border border-gray-200 p-6">
                <div className="text-sm text-gray-700">
                    <div><span className="font-medium">Name:</span> {user?.name || "—"}</div>
                    <div className="mt-1"><span className="font-medium">Email:</span> {user?.email || "—"}</div>
                </div>
            </div>
        </div>
    );
}
