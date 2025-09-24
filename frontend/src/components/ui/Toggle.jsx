    // src/components/ui/Toggle.jsx
    import React from "react";

    /**
     * Accessible, Tailwind-only toggle switch.
     * - Props:
     *   checked (bool)
     *   onChange(nextBool)
     *   onLabel (string) - text when checked
     *   offLabel (string | null) - text when unchecked (optional)
     *   showLabel (bool) - hide labels entirely if false
     */
    export default function Toggle({
        checked = false,
        onChange,
        onLabel = "Blocked",
        offLabel = null,
        showLabel = true,
    }) {
        return (
            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                {/* input = "peer" that controls the track & dot */}
                <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={checked}
                    onChange={(e) => onChange?.(e.target.checked)}
                    aria-checked={checked}
                    role="switch"
                />
                {/* track */}
                <div className="relative w-11 h-6 rounded-full bg-slate-300 transition-colors peer-checked:bg-red-500">
                    {/* dot */}
                    <span className="absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
                </div>
                {showLabel && (
                    <span className="text-xs font-medium text-gray-700">
                        {checked ? onLabel : offLabel}
                    </span>
                )}
            </label>
        );
    }
