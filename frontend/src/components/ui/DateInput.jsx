"use client"

import { Controller } from "react-hook-form"
import { useState, useRef, useEffect } from "react"
import { Calendar, ChevronDown } from "lucide-react"

export default function DateInput({
  control,
  name,
  error,
  placeholder = "Select date",
  minYear,
  maxYear,
  disabled = false,
  onDateChange,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [tempDate, setTempDate] = useState({ year: "", month: "", day: "" })
  const dropdownRef = useRef(null)

  const currentYear = new Date().getFullYear()
  const startYear = minYear || currentYear - 120
  const endYear = maxYear || currentYear
  const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => endYear - i)

  const months = [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ]

  const getDaysInMonth = (year, month) => {
    if (!year || !month) return 31
    return new Date(year, month, 0).getDate()
  }

  // Close on outside click or ESC
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    const handleEscape = (e) => e.key === "Escape" && setIsOpen(false)
    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleEscape)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [])

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange } }) => {
        const currentDate = value ? new Date(value) : null

        // Format progressively based on filled fields
        let displayValue = placeholder
        if (tempDate.year && !tempDate.month && !tempDate.day) {
          displayValue = tempDate.year
        } else if (tempDate.year && tempDate.month && !tempDate.day) {
          const monthLabel = months.find((m) => m.value === tempDate.month)?.label
          displayValue = `${monthLabel} ${tempDate.year}`
        } else if (tempDate.year && tempDate.month && tempDate.day) {
          displayValue = `${months.find((m) => m.value === tempDate.month)?.label} ${tempDate.day}, ${tempDate.year}`
        } else if (currentDate && !isNaN(currentDate.getTime())) {
          displayValue = currentDate.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        }

        const availableDays =
          (tempDate.year || currentDate?.getFullYear()) &&
            (tempDate.month || currentDate?.getMonth() + 1)
            ? getDaysInMonth(
              parseInt(tempDate.year || currentDate.getFullYear()),
              parseInt(tempDate.month || currentDate.getMonth() + 1)
            )
            : 31

        const updateTempDate = (field, val) => {
          const newDate = { ...tempDate, [field]: val }
          setTempDate(newDate)

          if (newDate.year) {
            let y = parseInt(newDate.year)
            let m = newDate.month ? parseInt(newDate.month) : 1
            let d = newDate.day ? parseInt(newDate.day) : 1
            const maxDays = getDaysInMonth(y, m)
            if (d > maxDays) d = maxDays
            const date = new Date(y, m - 1, d)
            if (!isNaN(date.getTime())) {
              const iso = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`
              onChange(iso)
              if (onDateChange) onDateChange(iso)
            }
          }
        }

        return (
          <div className="relative" ref={dropdownRef}>
            {/* Display box */}
            <div
              tabIndex={0}
              onClick={() => !disabled && setIsOpen(true)}
              className={`relative w-full h-11 flex items-center px-10 pr-9 text-sm border rounded-lg bg-white cursor-pointer
                focus:border-transparent focus:ring-2 focus:ring-blue-500/60 focus:outline-none hover:outline-none
                ${disabled
                  ? "bg-gray-50 text-gray-500 cursor-not-allowed"
                  : error
                    ? "border-red-300"
                    : "border-gray-300 hover:border-gray-400"}`}
            >
              <Calendar className="absolute left-3 h-4 w-4 text-gray-400" />
              <span
                className={
                  displayValue === placeholder
                    ? "text-gray-400"
                    : "text-gray-900"
                }
              >
                {displayValue}
              </span>

              <ChevronDown
                className={`absolute right-3 h-4 w-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""} ${disabled ? "opacity-50" : ""}`}
              />
            </div>

            {/* Dropdown */}
            {isOpen && !disabled && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-[100] overflow-hidden">
                <div className="p-3 grid grid-cols-3 gap-3">

                  {/* Year */}
                  <div className="relative">
                    <select
                      className="w-full h-9 pl-2 pr-8 text-xs border border-gray-200 rounded-md bg-gray-50 
               focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:outline-none 
               appearance-none"
                      value={tempDate.year || currentDate?.getFullYear() || ""}
                      onChange={(e) => updateTempDate("year", e.target.value)}
                    >
                      <option value="">Year</option>
                      {years.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                  </div>

                  {/* Month */}
                  <div className="relative">
                    <select
                      className="w-full h-9 pl-2 pr-8 text-xs border border-gray-200 rounded-md bg-gray-50 
               focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:outline-none 
               appearance-none"
                      value={
                        tempDate.month ||
                        (currentDate ? String(currentDate.getMonth() + 1).padStart(2, "0") : "")
                      }
                      onChange={(e) => updateTempDate("month", e.target.value)}
                    >
                      <option value="">Month</option>
                      {months.map((month) => (
                        <option key={month.value} value={month.value}>
                          {month.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                  </div>

                  {/* Day */}
                  <div className="relative">
                    <select
                      className="w-full h-9 pl-2 pr-8 text-xs border border-gray-200 rounded-md bg-gray-50 
               focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:outline-none 
               appearance-none"
                      value={
                        tempDate.day ||
                        (currentDate ? String(currentDate.getDate()).padStart(2, "0") : "")
                      }
                      onChange={(e) => updateTempDate("day", e.target.value)}
                    >
                      <option value="">Day</option>
                      {Array.from({ length: availableDays }, (_, i) => {
                        const d = String(i + 1).padStart(2, "0")
                        return (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        )
                      })}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            )}

            {/* Error */}
            {error && <p className="mt-1 text-xs text-red-500">{error.message}</p>}
          </div>
        )
      }}
    />
  )
}
