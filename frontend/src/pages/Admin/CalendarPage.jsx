"use client"

import { useState } from "react"
import Card from "../../components/common/Card"
import Calendar from "../../components/common/Calendar"
import Dropdown from "../../components/ui/Dropdown1"
import { CalendarIcon, Plus } from "lucide-react"

export default function CalendarPage() {
    const [viewFilter, setViewFilter] = useState("Month")
    const viewOptions = ["Week", "Month"]

    return (
        <div className="space-y-4 md:space-y-6 calendar-page-container">
            {/* Header Section - Title Only */}
            <div className="flex flex-col gap-3 md:gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100">Calendar</h1>
                    <p className="text-xs md:text-sm text-gray-500 dark:text-slate-400 mt-1">Manage appointments and schedules</p>
                </div>

                <div className="flex items-center gap-2">
                    <Dropdown
                        value={viewFilter}
                        onChange={setViewFilter}
                        options={viewOptions}
                        placeholder="Select view…"
                        className="w-32"
                    />
                    <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200">
                        <Plus size={16} />
                        New Appointment
                    </button>
                </div>
            </div>

            {/* Stats Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
                <Card />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-2">
                <div className="lg:col-span-10">
                    <Calendar />
                </div>

                <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-green-50 dark:bg-green-600/10 rounded-lg flex items-center justify-center">
                            <CalendarIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Today's Schedule</h3>
                    </div>

                    <div className="text-center py-8">
                        <CalendarIcon className="w-8 h-8 text-gray-400 dark:text-slate-500 mx-auto mb-3" />
                        <p className="text-sm text-gray-500 dark:text-slate-400">
                            Today's schedule component will be implemented here
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
