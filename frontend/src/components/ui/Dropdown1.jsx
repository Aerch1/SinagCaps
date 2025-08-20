// your Dropdown wrapper
"use client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

const Dropdown = ({ value, onChange, options = [], placeholder = "Select option...", className = "" }) => {
    return (
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger className={`h-11 rounded-lg border bg-white hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-300  dark:bg-slate-700 ${className}`}>
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>

            {/* Force bg + border + shadow and keep it above the modal */}
            <SelectContent
                position="popper"
                side="bottom"
                sideOffset={6}
                className="z-[1000] bg-white text-gray-800 dark:bg-slate-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 shadow-md rounded-md"
            >
                {options.map((option) => (
                    <SelectItem
                        key={option}
                        value={option}
                        className="text-sm hover:bg-gray-100 dark:hover:bg-slate-700"
                    >
                        {option}
                    </SelectItem>
                ))}
            </SelectContent>

        </Select>
    );
};

export default Dropdown;
