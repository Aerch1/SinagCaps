"use client";

const Input = ({
    icon: Icon,
    error,
    className = "",
    onFocus,
    variant = "light", // default light for login UI
    ...props
}) => {
    const common =
        "w-full pl-10 pr-3 py-2.5 rounded-lg outline-none transition duration-200 text-sm sm:text-base border";

    const styles = {
        dark: {
            base: "bg-gray-800/50 text-white placeholder-gray-400 border-gray-600",
            ok: "focus:border-transparent focus:ring-2 focus:ring-blue-500/60 focus:outline-none",
            icon: "text-gray-400",
        },
        light: {
            base: "bg-white text-gray-900 placeholder-gray-400 border-gray-300",
            ok: "focus:border-transparent focus:ring-2 focus:ring-blue-500/60 focus:outline-none",
            icon: "text-gray-400",
        },
    };

    const err =
        "border-red-500 focus:border-transparent focus:ring-2 focus:ring-red-500/50 focus:outline-none";

    const v = styles[variant] || styles.light;

    return (
        <div className="space-y-1">
            <div className="relative">
                {/* Icon */}
                {Icon && (
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <Icon className={`size-5 ${v.icon}`} />
                    </div>
                )}


                {/* Input */}
                <input
                    {...props}
                    onFocus={onFocus}
                    aria-invalid={!!error}
                    className={`${common} ${v.base} ${error ? err : v.ok} ${className}`}
                />
            </div>

            {/* Error text */}
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
};

export default Input;
