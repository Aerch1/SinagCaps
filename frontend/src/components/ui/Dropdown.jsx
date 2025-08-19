"use client";

import { Fragment } from "react";
import { Listbox, Transition } from "@headlessui/react";
import { ChevronDown } from "lucide-react";

/**
 * Reusable Dropdown (Headless UI)
 * props:
 * - value
 * - onChange
 * - options: Array<string> | Array<{value,label}>
 * - placeholder?: string
 * - onOpen?: () => void
 * - className?: string
 */
export default function Dropdown({
    value,
    onChange,
    options = [],
    placeholder = "Select…",
    onOpen,
    className = "",
}) {
    const norm = options.map((o) =>
        typeof o === "string" ? { value: o, label: o } : o
    );

    return (
        <Listbox value={value} onChange={onChange}>
            <div className={`relative ${className}`}>
                <Listbox.Button
                    onClick={onOpen}
                    className="
            w-full h-11 rounded-lg border border-gray-300 bg-white px-3 pr-9 text-left text-sm text-gray-800
            focus:outline-none 
            dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100
            dark:focus:ring-slate-500/40 dark:focus:border-slate-500
          "
                >
                    {value || placeholder}
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-slate-400" />
                </Listbox.Button>

                <Transition
                    as={Fragment}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <Listbox.Options
                        className="
              absolute z-50 mt-1 w-full overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm focus:outline-none
              dark:border-slate-700 dark:bg-slate-800
            "
                    >
                        {norm.map((opt) => (
                            <Listbox.Option
                                key={opt.value}
                                value={opt.value}
                                className={({ active }) =>
                                    [
                                        "cursor-pointer px-3 py-2 text-sm",
                                        active
                                            ? "bg-blue-50 text-blue-700 dark:bg-slate-700 dark:text-slate-50"
                                            : "text-gray-800 dark:text-slate-100",
                                    ].join(" ")
                                }
                            >
                                {opt.label}
                            </Listbox.Option>
                        ))}
                    </Listbox.Options>
                </Transition>
            </div>
        </Listbox>
    );
}
