"use client";

const Input = ({
  icon: Icon,
  error,
  className = "",
  onFocus,
  as = "input", // can be "textarea"
  ...props
}) => {
  const baseStyle =
    "w-full pr-3 py-2.5 rounded-lg outline-none transition duration-200 text-sm sm:text-base border";
  const textStyle =
    "bg-white text-gray-900 placeholder-gray-400 border-gray-300";
  const focusStyle =
    "focus:border-transparent focus:ring-2 focus:ring-blue-500/60 focus:outline-none";
  const errorStyle =
    "border-red-500 focus:border-transparent focus:ring-2 focus:ring-red-500/50 focus:outline-none";
  const iconStyle = "text-gray-400";

  const hasIcon = !!Icon;
  const paddingLeft = hasIcon ? "pl-10" : "pl-3";
  const Component = as === "textarea" ? "textarea" : "input";

  return (
    <div className="space-y-1">
      <div className="relative">
        {/* Optional Icon */}
        {hasIcon && (
          <div
            className={`absolute left-0 flex items-center pl-3 pointer-events-none
              ${as === "textarea" ? "top-3" : "inset-y-0"}`}
          >
            <Icon className={`size-5 ${iconStyle}`} />
          </div>
        )}

        {/* Input or Textarea */}
        <Component
          {...props}
          onFocus={onFocus}
          aria-invalid={!!error}
          className={`${baseStyle} ${paddingLeft} ${textStyle} ${
            error ? errorStyle : focusStyle
          } ${className} ${as === "textarea" ? "min-h-[100px] py-3" : ""}`}
        />
      </div>

      {/* Error Message */}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
};

export default Input;
