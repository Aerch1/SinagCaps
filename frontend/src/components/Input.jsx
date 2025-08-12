// src/components/input.jsx
"use client";

const Input = ({ icon: Icon, error, className = "", onFocus, ...props }) => {
    const base =
        "w-full pl-10 pr-3 py-2 bg-gray-800/50 rounded-lg border outline-none transition duration-200 text-white placeholder-gray-400";
    const ok = "border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40";
    const err = "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/30";

    return (
        <div className="mb-5">
            <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    {/* Keep icon styling stable so it doesn't shift on error */}
                    <Icon className="size-5 text-gray-400" />
                </div>

                <input
                    {...props}
                    onFocus={onFocus}
                    aria-invalid={!!error}
                    className={`${base} ${error ? err : ok} ${className}`}
                />
            </div>

            {/* Reserve height so showing/hiding this doesn't move the input/icon */}
            <div className="mt-1 ">
                {error ? <p className="text-xs text-red-400">{error}</p> : null}
            </div>
        </div>
    );
};

export default Input;
