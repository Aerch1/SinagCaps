export default function Stepper({ steps, currentStep }) {
  const total = steps?.length ?? 0
  const clamped = Math.min(Math.max(currentStep || 1, 1), Math.max(total, 1))
  const pct = total > 1 ? ((clamped - 1) / (total - 1)) * 100 : 100

  return (
    <nav aria-label="Progress" className="w-full max-w-5xl mx-auto">
      {/* Mobile */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-gray-900">
            Step {clamped} of {total}
          </span>
          <span className="text-xs text-gray-600 truncate max-w-[60%] font-medium">{steps?.[clamped - 1]?.title}</span>
        </div>

        <div className="relative h-3 w-full rounded-full bg-gray-200 overflow-hidden shadow-inner">
          <div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-[width] duration-500 ease-out rounded-full"
            style={{ width: `${pct}%` }}
          />
        </div>

        {steps?.[clamped - 1]?.description && (
          <div className="mt-3 text-xs text-gray-500 text-center">{steps[clamped - 1].description}</div>
        )}

        <div className="mt-4 flex justify-center gap-2">
          {steps.map((s) => {
            const reached = clamped >= s.number
            const current = clamped === s.number
            return (
              <span
                key={s.number}
                aria-hidden="true"
                className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
                  current ? "bg-blue-600 scale-125" : reached ? "bg-blue-500" : "bg-gray-300"
                }`}
              />
            )
          })}
        </div>
      </div>

      {/* Desktop (centered) */}
      <div className="hidden md:flex items-center justify-center w-full">
        {steps.map((step, index) => {
          const reached = clamped >= step.number
          const complete = clamped > step.number
          const current = clamped === step.number

          return (
            <div key={step.number} className="flex items-center min-w-0">
              <div
                className={`flex items-center justify-center shrink-0 w-12 h-12 rounded-full border-2 text-sm font-semibold transition-all duration-300 ${
                  reached
                    ? current
                      ? "border-blue-600 bg-blue-600 text-white shadow-lg scale-110"
                      : "border-blue-500 bg-blue-500 text-white shadow-md"
                    : "border-gray-300 text-gray-500 bg-white hover:border-gray-400"
                }`}
                aria-current={current ? "step" : undefined}
              >
                {complete ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
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

              <div className="ml-4 min-w-0">
                <div
                  className={`text-sm font-semibold transition-colors duration-300 ${
                    current ? "text-blue-600" : reached ? "text-blue-500" : "text-gray-700"
                  }`}
                >
                  {step.title}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">{step.description}</div>
              </div>

              {index < steps.length - 1 && (
                <div className="mx-6 w-24 h-0.5 transition-colors duration-300" aria-hidden="true">
                  <div className={`h-full rounded-full ${clamped > step.number ? "bg-blue-500" : "bg-gray-300"}`} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </nav>
  )
}
