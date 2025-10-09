"use client";

import { Link } from "react-router-dom";
import { motion } from "framer-motion";

/* ==================================================
   🌟 Feature Cards Data
================================================== */
const DEFAULT_CARDS = [
    {
        title: "WHAT’S HAPPENING @ OLOPGV?",
        cta: "FIND OUT MORE",
        to: "/event",
        image: "/card.webp",
        alt: "Colorful abstract background",
    },
    {
        title: "Our Mission & Vision",
        sub: "Who we are and where we’re headed",
        cta: "FIND OUT MORE",
        to: "/about",
        image: "/card2.webp",
        alt: "Sunrise over the earth",
    },
];

/* ==================================================
   🎞 Animation Variants
================================================== */
const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.15, ease: "easeOut" },
    },
};

const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    show: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: "easeOut" },
    },
};

/* ==================================================
   🪶 TwoFeatureCards Component
================================================== */
export default function TwoFeatureCards({ cards = DEFAULT_CARDS }) {
    return (
        <section className="bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
                <motion.div
                    className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.2 }}
                >
                    {cards.slice(0, 2).map(({ title, sub, cta, to, image, alt }, i) => (
                        <motion.div key={i} variants={cardVariants}>
                            <Link
                                to={to}
                                className="group relative block h-[280px] sm:h-[340px] lg:h-[420px] overflow-hidden rounded-2xl ring-1 ring-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#710000]/40"
                            >
                                {/* Background + Image */}
                                <div className="absolute inset-0 bg-gray-200" />
                                <motion.img
                                    src={image}
                                    alt={alt || title}
                                    loading="lazy"
                                    decoding="async"
                                    initial={{ opacity: 0 }}
                                    whileInView={{ opacity: 1 }}
                                    transition={{ duration: 0.6, ease: "easeOut" }}
                                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                                />

                                {/* Overlay */}
                                <div className="absolute inset-0 bg-black/35" />

                                {/* Text Content */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, ease: "easeOut" }}
                                    viewport={{ once: true }}
                                    className="relative z-10 flex h-full flex-col items-center justify-center text-center text-white p-6"
                                >
                                    <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight drop-shadow-md">
                                        {title}
                                    </h3>
                                    {sub && (
                                        <p className="mt-2 text-sm sm:text-base text-white/90">
                                            {sub}
                                        </p>
                                    )}
                                    <span className="mt-6 inline-flex items-center justify-center rounded-md border border-white/80 px-6 py-3 text-sm font-semibold tracking-wide group-hover:bg-white/10">
                                        {cta}
                                    </span>
                                </motion.div>
                            </Link>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
