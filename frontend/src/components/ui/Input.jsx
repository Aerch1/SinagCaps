// src/components/input.jsx
"use client";

const Input = ({
    icon: Icon,
    error,
    className = "",
    onFocus,
    variant = "dark", // "dark" | "light"
    ...props
}) => {
    const common =
        "w-full pl-10 pr-3 py-2 rounded-lg border outline-none transition duration-200";

    const styles = {
        dark: {
            base: "bg-gray-800/50 text-white placeholder-gray-400",
            ok: "border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40",
            icon: "text-gray-400",
        },
        light: {
            base: "bg-white text-gray-900 placeholder-gray-400",
            // ⬇️ light blue focus
            ok: "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40",
            icon: "text-gray-400",
        },
    };

    const err =
        "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/30";

    const v = styles[variant] || styles.dark;

    return (
        <div className="mb-5">
            <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Icon className={`size-5 ${v.icon}`} />
                </div>
                <input
                    {...props}
                    onFocus={onFocus}
                    aria-invalid={!!error}
                    className={`${common} ${v.base} ${error ? err : v.ok} ${className}`}
                />
            </div>
            <div className="mt-1">
                {error ? <p className="text-xs text-red-400">{error}</p> : null}
            </div>
        </div>
    );
};

export default Input;
