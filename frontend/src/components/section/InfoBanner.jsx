import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

const VERSES = [
    {
        text: '"For where two or three are gathered in my name, there am I among them."',
        reference: "Matthew 18:20",
    },
    {
        text: '"The Lord is my shepherd; I shall not want."',
        reference: "Psalm 23:1",
    },
    {
        text: '"I can do all things through Christ who strengthens me."',
        reference: "Philippians 4:13",
    },
    {
        text: '"Let all that you do be done in love."',
        reference: "1 Corinthians 16:14",
    },
]

export default function InfoBanner() {
    const [index, setIndex] = useState(0)

    // Rotate verse every 8 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % VERSES.length)
        }, 8000)
        return () => clearInterval(interval)
    }, [])

    const verse = VERSES[index]

    return (
        <section
            className="relative isolate w-full bg-center bg-cover"
            style={{ backgroundImage: `url(/church.jpg)` }}
            aria-label="Inspirational Bible verse banner"
        >
            <div className="absolute inset-0 bg-black/60" />
            <div className="relative max-w-4xl mx-auto px-6 py-10 text-center">
                {/* Fixed height box to prevent flickering */}
                <div className="min-h-[120px] flex flex-col justify-center">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={index}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1 }}
                            className="space-y-2"
                        >
                            <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-white leading-snug">
                                {verse.text}
                            </h2>
                            <p className="text-sm sm:text-base text-white/80">{verse.reference}</p>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </section>
    )
}
