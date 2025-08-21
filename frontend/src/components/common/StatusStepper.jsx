"use client";

import { useMemo } from "react";

/**
 * Tiny dynamic stepper with NO text labels.
 * Shows 3 nodes; color = green (default) or red when RESCHEDULED/CANCELLED.
 *
 * Props:
 *  - status: "PENDING" | "APPROVED" | "COMPLETED" | "RESCHEDULED" | "CANCELLED"
 *  - className?: string
 */
export default function SimpleStatusStepper({ status, className = "" }) {
  const model = useMemo(() => buildModel(status), [status]);

  return (
    <div className={`w-full flex items-center justify-center ${className}`} aria-hidden>
      {model.steps.map((_, i) => {
        const reached = model.currentIndex >= i;
        const current = model.currentIndex === i;
        return (
          <div key={i} className="flex items-center">
            <div
              className={[
                "w-3.5 h-3.5 rounded-full border-2 transition-all",
                current
                  ? `${model.pal.dot} scale-110`
                  : reached
                    ? model.pal.dotFilled
                    : "border-gray-300 bg-white",
              ].join(" ")}
            />
            {i < model.steps.length - 1 && (
              <div className="mx-2 w-10 sm:w-16 h-0.5">
                <div
                  className={[
                    "h-full rounded-full transition-colors",
                    model.currentIndex > i ? model.pal.bar : "bg-gray-300",
                  ].join(" ")}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ---- simple model ---- */
const GREEN = {
  dot: "border-emerald-600 bg-emerald-600",
  dotFilled: "border-emerald-500 bg-emerald-500",
  bar: "bg-emerald-500",
};
const RED = {
  dot: "border-red-600 bg-red-600",
  dotFilled: "border-red-500 bg-red-500",
  bar: "bg-red-500",
};

function buildModel(status) {
  const s = normalize(status);
  // always 3 nodes visually
  // default third = Completed, but when rescheduled/cancelled it means that node represents that outcome
  const currentIndex =
    s === "PENDING" ? 0 :
      s === "APPROVED" ? 1 :
        2; // COMPLETED / RESCHEDULED / CANCELLED all map to the last node

  const pal = (s === "RESCHEDULED" || s === "CANCELLED") ? RED : GREEN;

  return {
    steps: [0, 1, 2],
    currentIndex,
    pal,
  };
}

function normalize(x) {
  const s = String(x || "").toUpperCase();
  if (s.includes("CANCEL")) return "CANCELLED";
  if (s.includes("RESCHED")) return "RESCHEDULED";
  if (s.includes("COMPLETE")) return "COMPLETED";
  if (s.includes("APPROVE") || s.includes("CONFIRM") || s.includes("PROCESS")) return "APPROVED";
  return "PENDING";
}
