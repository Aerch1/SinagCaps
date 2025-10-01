// src/components/ui/SlotSelector.jsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { to12h } from "@/utils/availabilityUtils";
import useAvailability from "@/hooks/useAvailability";
import useChurchHours from "@/hooks/useChurchHours";

// ✅ Normalizer (backend sends "08:00:00", we force "08:00")
function normalizeToHHMM(str) {
  if (!str) return "";
  if (str.length === 8) return str.slice(0, 5); // "08:00:00" → "08:00"
  return str;
}

export default function SlotSelector({
  value,
  onChange,
  serviceId,
  date,
  label = "Select Time",
  disabled = false,
  error,
  step = 30, // minutes
}) {
  const [open, setOpen] = useState(false);
  const { slots = [], status, loading } = useAvailability(serviceId, date);
  const { churchHours } = useChurchHours();

  const normalizedValue = normalizeToHHMM(value);
  const timeLabel = normalizedValue ? to12h(normalizedValue) : "Pick a time";

  const onQuickPick = (t) => {
    const clean = normalizeToHHMM(t);
    onChange?.(clean);
    setOpen(false);
  };

  const onCustomChange = (e) => {
    const clean = normalizeToHHMM(e.target.value);
    onChange?.(clean);
  };

  // ✅ Closed day check
  const weekday = date ? new Date(date).getDay() : null;
  const isClosedDay = weekday != null && churchHours?.[weekday]?.is_closed;

  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium mb-1">{label}</label>}

      <Popover open={open && !disabled} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled || loading}
            className={[
              "w-full justify-start text-left font-normal bg-white",
              disabled ? "opacity-60 cursor-not-allowed" : "",
              error ? "border-red-500" : "",
            ].join(" ")}
          >
            {loading ? "Loading…" : timeLabel}
          </Button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          side="bottom"
          sideOffset={6}
          className="z-[9999] w-[320px] p-3 bg-white border border-gray-200 shadow-md rounded-md"
        >
          {!date ? (
            <div className="text-center text-sm text-gray-500 py-6">
              Please select a date
            </div>
          ) : isClosedDay || status === "blocked" ? (
            <div className="text-center text-sm text-red-600 py-6">
              Closed — no slots available
            </div>
          ) : slots.length > 0 ? (
            <div className="mb-3">
              <span className="block text-xs font-medium text-gray-600 mb-2">
                Available times
              </span>
              <div className="grid grid-cols-3 gap-2 max-h-[240px] overflow-y-auto pr-1 custom-scrollbar">
                {slots.map((s) => {
                  const cleanTime = normalizeToHHMM(s.time);
                  const mainLabel = to12h(cleanTime);
                  let subLabel = "";

                  if (s.unavailable || s.remaining <= 0) {
                    subLabel = "Fully booked";
                  } else {
                    subLabel = `Slots left: ${s.remaining}`;
                  }

                  return (
                    <button
                      key={cleanTime}
                      type="button"
                      onClick={() => !s.unavailable && onQuickPick(cleanTime)}
                      disabled={s.unavailable}
                      className={[
                        "px-3 py-2 rounded-md border transition flex flex-col items-center",
                        s.unavailable
                          ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                          : normalizedValue === cleanTime
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-slate-700 border-gray-300 hover:bg-gray-50",
                      ].join(" ")}
                    >
                      {/* Time label */}
                      <span
                        className={`text-sm font-medium ${
                          s.unavailable ? "text-gray-400" : ""
                        }`}
                      >
                        {mainLabel}
                      </span>
                      {/* Subtext */}
                      <span
                        className={`text-xs ${
                          s.unavailable ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {subLabel}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center text-sm text-gray-500 py-4">
              No predefined slots — you can still add a custom time
            </div>
          )}

          {/* Custom time input */}
          {!isClosedDay && (
            <div className="mt-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Or enter custom time
              </label>
              <input
                type="time"
                value={normalizedValue || ""}
                step={step * 60}
                onChange={onCustomChange}
                className={[
                  "w-full px-3 py-2 border rounded-lg text-sm",
                  "bg-white text-gray-900",
                  "focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                  error ? "border-red-500" : "border-gray-300",
                ].join(" ")}
              />
              {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
            </div>
          )}
        </PopoverContent>
      </Popover>

      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
