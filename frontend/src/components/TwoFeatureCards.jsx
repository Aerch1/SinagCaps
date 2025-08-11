// src/components/TwoFeatureCards.jsx
import { Link } from "react-router-dom";

const CARDS = [
    {
        title: "WHAT’S HAPPENING @ OLOPGV?",
        sub: "",                                  // optional subtitle
        cta: "FIND OUT MORE",
        to: "/announcements",
        image: "/card.jpg",     // ← replace with your image
        alt: "Colorful abstract background",
    },
    {
        title: "Our Mission & Vision",
        sub: "Who we are and where we’re headed",
        cta: "FIND OUT MORE",
        to: "/missions",
        image: "/card2.jpg",            // ← replace with your image
        alt: "Sunrise over the earth",
    },
];

export default function TwoFeatureCards({ cards = CARDS }) {
    return (
        <section className="w-full bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {cards.slice(0, 2).map(({ title, sub, cta, to, image, alt }, i) => (
                        <Link
                            key={i}
                            to={to}
                            className="group relative block h-[280px] sm:h-[340px] lg:h-[420px] overflow-hidden rounded-2xl ring-1 ring-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#710000]/40"
                        >
                            <img
                                src={image}
                                alt={alt || title}
                                loading="lazy"
                                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                            />
                            <div className="absolute inset-0 bg-black/35" />
                            <div className="relative z-10 h-full flex flex-col items-center justify-center text-center text-white p-6">
                                <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight drop-shadow-md">
                                    {title}
                                </h3>
                                {sub && <p className="mt-2 text-sm sm:text-base text-white/90">{sub}</p>}
                                <span className="mt-6 inline-flex items-center justify-center rounded-md border border-white/80 px-6 py-3 text-sm font-semibold tracking-wide group-hover:bg-white/10">
                                    {cta}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}