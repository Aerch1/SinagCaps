// src/components/TwoFeatureCards.jsx
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";

const CARDS = [
    {
        title: "WHAT’S HAPPENING @ OLOPGV?",
        sub: "",
        cta: "FIND OUT MORE",
        to: "/announcements",
        image: "/card.webp",
        alt: "Colorful abstract background",
    },
    {
        title: "Our Mission & Vision",
        sub: "Who we are and where we’re headed",
        cta: "FIND OUT MORE",
        to: "/missions",
        image: "/card2.webp",
        alt: "Sunrise over the earth",
    },
];

// Animation variants
const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.15, ease: "easeOut" },
    },
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function TwoFeatureCards({ cards = CARDS }) {
    return (
        <section className="w-full bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
                <motion.div
                    className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                    variants={container}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.2 }}
                >
                    {cards.slice(0, 2).map(({ title, sub, cta, to, image, alt }, i) => (
                        <motion.div key={i} variants={item}>
                            <Link
                                to={to}
                                className="group relative block h-[280px] sm:h-[340px] lg:h-[420px] overflow-hidden rounded-2xl ring-1 ring-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#710000]/40"
                            >
                                {/* ✅ Placeholder background (shows instantly) */}
                                <div className="absolute inset-0 bg-gray-200" />

                                {/* ✅ Image fades in after loading */}
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

                                {/* ✅ Content animates separately (not blocked by image) */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, ease: "easeOut"}}
                                    viewport={{ once: true }}
                                    className="relative z-10 h-full flex flex-col items-center justify-center text-center text-white p-6"
                                >
                                    <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight drop-shadow-md">
                                        {title}
                                    </h3>
                                    {sub && (
                                        <p className="mt-2 text-sm sm:text-base text-white/90">{sub}</p>
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
