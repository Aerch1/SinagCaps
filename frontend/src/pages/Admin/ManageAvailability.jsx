// src/pages/Admin/ManageAvailabilitySimple.jsx
"use client";

import React, { useMemo, useState } from "react";
import {
  ADMIN_AVAILABILITY,
  daysInMonth,
  firstDayOfWeek,
  lastDayOfWeek,
  monthKey,
  pad2,
} from "@/utils";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";

/* ───────── helpers (12-hour time, sorting, preview) ───────── */

const WEEKDAYS = [
  { i: 1, label: "Monday" },
  { i: 2, label: "Tuesday" },
  { i: 3, label: "Wednesday" },
  { i: 4, label: "Thursday" },
  { i: 5, label: "Friday" },
  { i: 6, label: "Saturday" },
  { i: 0, label: "Sunday" },
];

const SERVICES = Object.keys(ADMIN_AVAILABILITY || {});

const generate12hOptions = (start24 = "06:00", end24 = "20:00", everyMin = 30) => {
  const to24 = (s) => s.split(":").map(Number);
  const [sh, sm] = to24(start24);
  const [eh, em] = to24(end24);
  const out = [];
  let h = sh, m = sm;
  while (h < eh || (h === eh && m <= em)) {
    out.push(to12h(h, m));
    m += everyMin;
    while (m >= 60) { m -= 60; h += 1; }
  }
  return out;
};
const TIME_OPTS = generate12hOptions("06:00", "20:00", 30);

function to12h(h, m) {
  const ap = h >= 12 ? "PM" : "AM";
  let hh = h % 12;
  if (hh === 0) hh = 12;
  return `${String(hh).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ap}`;
}
function parse12h(s) {
  const m = String(s || "").trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return null;
  let hh = Number(m[1]);
  const mm = Number(m[2]);
  const ap = m[3].toUpperCase();
  if (hh === 12) hh = 0;
  const H = ap === "PM" ? hh + 12 : hh;
  return { H, M: mm };
}
function minOf12h(s) {
  const p = parse12h(s);
  if (!p) return Number.MAX_SAFE_INTEGER;
  return p.H * 60 + p.M;
}
const timeSort = (a, b) => minOf12h(a) - minOf12h(b);

/* preview calendar coloring */
function buildMonthPreview(weekly, blockedSet, y, m) {
  const key = monthKey(y, m);
  const dim = daysInMonth(y, m);
  const days = [];
  for (let d = 1; d <= dim; d++) {
    const date = new Date(y, m, d);
    const dow = date.getDay();
    const iso = `${key}-${pad2(d)}`;

    if (blockedSet.has(dow)) { days.push({ date: iso, status: "blocked" }); continue; }

    const rows = weekly[dow] || [];
    if (!rows.length) { days.push({ date: iso, status: "neutral" }); continue; }

    const anySlots = rows.some((e) => (Number(e.slots) || 0) > 0);
    days.push({ date: iso, status: anySlots ? "available" : "unavailable" });
  }
  return { month: key, days };
}

/* ───────── page ───────── */

export default function ManageAvailabilitySimple() {
  // pick first configured service; you can add a selector later if needed
  const [service] = useState(SERVICES[0]);

  const seed = ADMIN_AVAILABILITY[service] || {};
  const initWeekly = () => {
    const map = {};
    for (const dow of Object.keys(seed.weekdays || {})) {
      map[dow] = (seed.weekdays[dow] || []).map((t) => ({
        time: t,
        slots:
          (seed.timeCapacity && typeof seed.timeCapacity[t] === "number"
            ? seed.timeCapacity[t]
            : seed.defaultSlotsPerTime || 0),
      }));
    }
    return map;
  };

  // weekly config: { [dow]: [{time, slots}] }
  const [weekly, setWeekly] = useState(initWeekly);
  // blocked days (toggle off)
  const [blockedDays, setBlockedDays] = useState(() => {
    const s = new Set();
    for (const d of WEEKDAYS.map((x) => x.i)) {
      const has = (seed.weekdays || {})[d]?.length > 0;
      if (!has) s.add(d); // off if there’s no schedule
    }
    return s;
  });

  // add / remove
  const addOne = (dow, time, slots) => {
    if (!time) return;
    const entry = { time, slots: Math.max(0, Number(slots) || 0) };
    setWeekly((prev) => {
      const copy = { ...prev };
      const list = [...(copy[dow] || [])];
      const idx = list.findIndex((e) => e.time === time);
      if (idx === -1) list.push(entry);
      else list[idx] = entry;
      list.sort((a, b) => timeSort(a.time, b.time));
      copy[dow] = list;
      return copy;
    });
  };
  const removeOne = (dow, time) =>
    setWeekly((prev) => {
      const copy = { ...prev };
      copy[dow] = (copy[dow] || []).filter((e) => e.time !== time);
      return copy;
    });

  const toggleDay = (dow) =>
    setBlockedDays((prev) => {
      const s = new Set(prev);
      if (s.has(dow)) s.delete(dow);
      else s.add(dow);
      return s;
    });

  // draft inputs per day
  const [draftByDay, setDraftByDay] = useState(() =>
    Object.fromEntries(WEEKDAYS.map(({ i }) => [i, { time: "", slots: "" }]))
  );
  const setDraftFor = (dow, patch) =>
    setDraftByDay((p) => ({ ...p, [dow]: { ...p[dow], ...patch } }));

  // preview month
  const today = new Date();
  const [viewY, setViewY] = useState(today.getFullYear());
  const [viewM, setViewM] = useState(today.getMonth());
  const preview = useMemo(
    () => buildMonthPreview(weekly, blockedDays, viewY, viewM),
    [weekly, blockedDays, viewY, viewM]
  );

  // save into ADMIN_AVAILABILITY shape
  const handleSave = () => {
    const weekdays = {};
    const timeCapacity = {};
    for (const dow of WEEKDAYS.map((x) => x.i)) {
      if (blockedDays.has(dow)) { weekdays[dow] = []; continue; }
      const list = weekly[dow] || [];
      weekdays[dow] = list.map((e) => e.time);
      list.forEach((e) => (timeCapacity[e.time] = Math.max(0, Number(e.slots) || 0)));
    }
    ADMIN_AVAILABILITY[service] = {
      ...(ADMIN_AVAILABILITY[service] || {}),
      weekdays,
      timeCapacity,
      defaultSlotsPerTime: 0,
    };
    alert("Availability saved.");
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Page title — matches your other pages */}
      <div className="flex flex-col gap-1">
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100">
          Manage Availability
        </h1>
        <p className="mt-1 text-xs md:text-sm text-gray-500 dark:text-slate-400">
          Define weekly appointment times and available slots. Toggle a day to block it entirely.
        </p>
      </div>

      {/* Two containers: left (weekly editor) • right (calendar) */}
      <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-12">
        {/* Left: Weekly Availability */}
        <div className="lg:col-span-7">
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
              Weekly Availability
            </h2>

            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {WEEKDAYS.map(({ i: dow, label }) => {
                const disabled = blockedDays.has(dow);
                const row = weekly[dow] || [];
                const draft = draftByDay[dow] || { time: "", slots: "" };

                return (
                  <div key={dow} className="py-3">
                    <div className="grid grid-cols-[auto,1fr] items-start gap-4 sm:grid-cols-[auto,1fr,auto]">
                      {/* Toggle + label */}
                      <div className="flex items-center gap-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!disabled}
                            onChange={() => toggleDay(dow)}
                            className="peer sr-only"
                          />
                          <div className="h-5 w-9 rounded-full bg-gray-200 peer-checked:bg-gray-900 transition-colors"></div>
                          <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all peer-checked:translate-x-4"></div>
                        </label>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {label}
                        </div>
                        {disabled && (
                          <span className="ml-2 rounded-md border border-gray-200 px-2 py-0.5 text-[11px] text-gray-600 dark:border-gray-600 dark:text-gray-300">
                            Blocked
                          </span>
                        )}
                      </div>

                      {/* Chips */}
                      <div className="flex flex-wrap items-center gap-2">
                        {!row.length && !disabled && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            No times yet
                          </span>
                        )}
                        {row.map((e) => (
                          <span
                            key={e.time}
                            className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-800 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                          >
                            <span className="font-medium">{e.time}</span>
                            <span className="text-gray-400">•</span>
                            <span>{e.slots} slots</span>
                            {!disabled && (
                              <button
                                onClick={() => removeOne(dow, e.time)}
                                className="rounded p-0.5 text-gray-500 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-600"
                                title="Remove"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </span>
                        ))}
                      </div>

                      {/* Add time/slots */}
                      <div className="sm:justify-self-end">
                        <div className="flex items-center gap-2">
                          <select
                            disabled={disabled}
                            value={draft.time}
                            onChange={(e) => setDraftFor(dow, { time: e.target.value })}
                            className="h-8 w-36 rounded-md border border-gray-300 bg-white px-2 text-sm text-gray-900 focus:outline-none focus:ring-0 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                          >
                            <option value="">Time…</option>
                            {TIME_OPTS.map((t) => (
                              <option key={`${dow}-${t}`} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>

                          <input
                            disabled={disabled}
                            type="number"
                            min={0}
                            inputMode="numeric"
                            placeholder="Slots"
                            value={draft.slots}
                            onChange={(e) => setDraftFor(dow, { slots: e.target.value })}
                            className="h-8 w-20 rounded-md border border-gray-300 bg-white px-2 text-sm text-gray-900 focus:outline-none focus:ring-0 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                          />

                          <button
                            disabled={disabled || !draft.time}
                            onClick={() => {
                              addOne(dow, draft.time, draft.slots);
                              setDraftFor(dow, { time: "", slots: "" });
                            }}
                            className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-800 hover:bg-gray-100 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6">
              <button
                onClick={handleSave}
                className="rounded-md bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>

        {/* Right: Calendar Preview */}
        <div className="lg:col-span-5">
          <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <button
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 hover:bg-gray-50 focus:outline-none dark:border-gray-600 dark:hover:bg-gray-700"
                  onClick={() => {
                    const d = new Date(viewY, viewM, 1);
                    d.setMonth(d.getMonth() - 1);
                    setViewY(d.getFullYear());
                    setViewM(d.getMonth());
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {new Date(viewY, viewM, 1).toLocaleDateString(undefined, {
                    month: "long",
                    year: "numeric",
                  })}
                </div>
                <button
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 hover:bg-gray-50 focus:outline-none dark:border-gray-600 dark:hover:bg-gray-700"
                  onClick={() => {
                    const d = new Date(viewY, viewM, 1);
                    d.setMonth(d.getMonth() + 1);
                    setViewY(d.getFullYear());
                    setViewM(d.getMonth());
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="hidden text-[11px] text-gray-600 dark:text-gray-300 sm:flex sm:items-center sm:gap-3">
                <LegendDot cls="bg-emerald-500/80" label="available" />
                <LegendDot cls="bg-amber-500/80" label="unavailable" />
                <LegendDot cls="bg-red-500/80" label="blocked" />
                <LegendDot cls="bg-gray-300 dark:bg-gray-600" label="neutral" />
              </div>
            </div>

            <MonthGrid y={viewY} m={viewM} payload={preview} />

            <div className="border-t border-gray-100 p-3 text-[11px] text-gray-600 dark:border-gray-700 dark:text-gray-300 sm:hidden">
              <LegendDot cls="bg-emerald-500/80" label="available" />
              <LegendDot cls="bg-amber-500/80" label="unavailable" />
              <LegendDot cls="bg-red-500/80" label="blocked" />
              <LegendDot cls="bg-gray-300 dark:bg-gray-600" label="neutral" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────── small UI parts ───────── */

function LegendDot({ cls, label }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-sm ${cls}`}></span>
      {label}
    </span>
  );
}

function MonthGrid({ y, m, payload }) {
  const dim = daysInMonth(y, m);
  const lead = firstDayOfWeek(y, m);
  const trail = 6 - lastDayOfWeek(y, m);

  const statusMap = new Map(payload.days.map((d) => [d.date, d.status]));
  const cells = [];
  for (let i = 0; i < lead; i++) cells.push(<Cell key={`l-${i}`} />);
  for (let d = 1; d <= dim; d++) {
    const iso = `${monthKey(y, m)}-${pad2(d)}`;
    cells.push(<Cell key={iso} d={d} status={statusMap.get(iso)} />);
  }
  for (let i = 0; i < trail; i++) cells.push(<Cell key={`t-${i}`} />);

  const rows = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(
      <div key={`r-${i}`} className="grid grid-cols-7">
        {cells.slice(i, i + 7)}
      </div>
    );
  }

  return (
    <div className="p-3">
      <div className="grid grid-cols-7 gap-0.5 px-1 pb-2">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div
            key={d}
            className="text-center text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="space-y-0.5">{rows}</div>
    </div>
  );
}

function Cell({ d, status }) {
  const tone =
    status === "available"
      ? "bg-emerald-500/80 text-white"
      : status === "unavailable"
      ? "bg-amber-500/80 text-white"
      : status === "blocked"
      ? "bg-red-500/80 text-white"
      : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300";
  return (
    <div className={`m-0.5 flex h-12 items-center justify-center rounded-md ${tone}`}>
      <span className="text-sm">{d ?? ""}</span>
    </div>
  );
}
