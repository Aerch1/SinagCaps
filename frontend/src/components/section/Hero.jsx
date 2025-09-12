import { Link } from "react-router-dom"
import { useEffect, useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"

export default function Hero({
  slides = [],
  autoIntervalMs = 5500,
  fadeDuration = 0.5, // 👈 faster fade (half a second)
}) {
  const [index, setIndex] = useState(0)
  const timerRef = useRef(null)

  useEffect(() => {
    start()
    return stop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index])

  const start = () => {
    stop()
    timerRef.current = setInterval(() => {
      goTo(index + 1)
    }, autoIntervalMs)
  }

  const stop = () => {
    if (timerRef.current) clearInterval(timerRef.current)
  }

  const goTo = (newIndex) => {
    const len = slides.length
    const next = ((newIndex % len) + len) % len
    setIndex(next)
  }

  if (!slides.length) return null

  return (
    <section
      className="relative left-1/2 -translate-x-1/2 select-none"
      aria-label="Hero Carousel"
      onMouseEnter={stop}
      onMouseLeave={start}
      onFocusCapture={stop}
      onBlurCapture={start}
    >
      <div className="relative h-[50vh] sm:h-[60vh] md:h-[70vh] lg:h-[75vh] xl:h-[80vh] overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: fadeDuration, ease: "easeInOut" }}
          >
            {/* Background image */}
            <img
              src={slides[index].image}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              draggable="false"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-black/20" />

            {/* Content */}
            <div className="relative z-10 h-full flex items-center">
              <div className="w-full">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <motion.div
                    key={slides[index].heading}
                    initial="hidden"
                    animate="visible"
                    variants={{
                      visible: { transition: { staggerChildren: 0.12 } }
                    }}
                  >
                    <motion.h1
                      variants={{
                        hidden: { opacity: 0, y: 20 },
                        visible: { opacity: 1, y: 0 }
                      }}
                      transition={{ duration: 0.5 }}
                      className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight drop-shadow text-white"
                    >
                      {slides[index].heading}
                    </motion.h1>

                    <motion.p
                      variants={{
                        hidden: { opacity: 0, y: 10 },
                        visible: { opacity: 1, y: 0 }
                      }}
                      transition={{ duration: 0.5 }}
                      className="mt-2 sm:mt-3 md:mt-4 text-sm sm:text-base md:text-lg lg:text-xl text-gray-200 max-w-lg sm:max-w-xl lg:max-w-2xl"
                    >
                      {slides[index].subheading}
                    </motion.p>

                    <motion.div
                      variants={{
                        hidden: { opacity: 0, y: 10 },
                        visible: { opacity: 1, y: 0 }
                      }}
                      transition={{ duration: 0.5 }}
                      className="mt-4 sm:mt-6 flex flex-row flex-wrap items-center gap-3"
                    >
                      {(slides[index].ctas || []).slice(0, 2).map((btn, idx) =>
                        btn.variant === "primary" ? (
                          <Link
                            key={idx}
                            to={btn.to}
                            className="inline-flex shrink-0 items-center justify-center px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium text-white text-sm sm:text-base
                             bg-secondary hover:opacity-90 shadow-lg focus:outline-none focus:ring-1 focus:ring-[#710000] focus:ring-offset-2 focus:ring-offset-black/40
                             transition-all duration-200"
                          >
                            {btn.label}
                          </Link>
                        ) : (
                          <Link
                            key={idx}
                            to={btn.to}
                            className="inline-flex shrink-0 items-center justify-center px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium
                             text-gray-900 bg-white/90 hover:bg-white shadow focus:outline-none focus:ring-2 focus:ring-white/70
                             transition-all duration-200"
                          >
                            {btn.label}
                          </Link>
                        )
                      )}
                    </motion.div>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Dots */}
        <div
          className="absolute bottom-3 sm:bottom-4 md:bottom-6 w-full flex items-center justify-center gap-2 z-20"
          aria-live="polite"
        >
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              aria-pressed={index === i}
              onClick={() => goTo(i)}
              className="relative group transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center"
            >
              <div
                className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all duration-200 ${
                  index === i
                    ? "bg-white"
                    : "bg-white/50 group-hover:bg-white/80"
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
