export default function Stepper({ steps, currentStep }) {
    const total = steps?.length ?? 0;
    const clamped = Math.min(Math.max(currentStep || 1, 1), Math.max(total, 1));
    const pct = total > 1 ? ((clamped - 1) / (total - 1)) * 100 : 100;

    return (
        <nav aria-label="Progress" className="w-full">
            {/* Mobile: compact progress + current step */}
            <div className="md:hidden">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-800">
                        Step {clamped} of {total}
                    </span>
                    <span className="ml-2 text-xs text-gray-500 truncate max-w-[60%]">
                        {steps?.[clamped - 1]?.title}
                    </span>
                </div>

                {/* Progress bar */}
                <div className="relative h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                    <div
                        className="absolute left-0 top-0 h-full bg-emerald-600 transition-[width] duration-300 ease-out"
                        style={{ width: `${pct}%` }}
                    />
                </div>

                {/* Current step description */}
                {steps?.[clamped - 1]?.description && (
                    <div className="mt-2 text-xs text-gray-500">
                        {steps[clamped - 1].description}
                    </div>
                )}

                {/* Tiny dots for context */}
                <div className="mt-3 flex justify-between">
                    {steps.map((s) => {
                        const reached = clamped >= s.number;
                        return (
                            <span
                                key={s.number}
                                aria-hidden="true"
                                className={`h-2 w-2 rounded-full ${reached ? "bg-emerald-600" : "bg-gray-300"
                                    }`}
                            />
                        );
                    })}
                </div>
            </div>

            {/* Desktop: your original style, but flexible + truncates nicely */}
            <div className="hidden md:flex items-center w-full">
                {steps.map((step, index) => {
                    const reached = clamped >= step.number;
                    const complete = clamped > step.number;

                    return (
                        <div key={step.number} className="flex items-center min-w-0 flex-1">
                            {/* Number / check */}
                            <div
                                className={`flex items-center justify-center shrink-0 w-10 h-10 rounded-full border-2 text-sm font-medium ${reached
                                        ? "border-emerald-600 bg-emerald-600 text-white"
                                        : "border-gray-300 text-gray-500 bg-white"
                                    }`}
                                aria-current={clamped === step.number ? "step" : undefined}
                            >
                                {complete ? (
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path
                                            fillRule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                ) : (
                                    step.number
                                )}
                            </div>

                            {/* Title + description (truncate to avoid wrapping mess) */}
                            <div className="ml-3 min-w-0">
                                <div
                                    className={`text-sm font-medium truncate ${reached ? "text-emerald-700" : "text-gray-600"
                                        }`}
                                >
                                    {step.title}
                                </div>
                                <div className="text-xs text-gray-400 truncate">{step.description}</div>
                            </div>

                            {/* Connector grows fluidly instead of fixed width */}
                            {index < steps.length - 1 && (
                                <div className="mx-4 flex-1 h-0.5" aria-hidden="true">
                                    <div
                                        className={`h-full ${clamped > step.number ? "bg-emerald-600" : "bg-gray-300"
                                            }`}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </nav>
    );
}
