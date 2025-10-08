export default function AboutSection() {
    return (
        <section className="w-full bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
                <div className="grid lg:grid-cols-2 gap-8 items-center justify-items-center">
                    <div className="rounded-xl overflow-hidden shadow-sm w-full max-w-[640px]">
                        <img
                            src="/church.jpg"
                            alt="Our Lady of Peace and Good Voyage Parish"
                            className="w-full h-full object-cover"
                            loading="lazy"
                            decoding="async"
                        />
                    </div>

                    <div className="w-full max-w-xl">
                        <p className="uppercase tracking-widest text-sm text-amber-600 font-semibold">
                            About Our Church
                        </p>
                        <h2 className="mt-2 text-3xl sm:text-4xl font-light text-gray-900">
                            Our Lady of Peace and Good Voyage Parish
                        </h2>
                        <p className="mt-4 text-lg text-gray-600 leading-relaxed">
                            A welcoming Catholic community rooted in prayer, service, and the Sacraments.
                        </p>
                        <p className="mt-3 text-gray-600 leading-relaxed">
                            Guided by faith, we journey together as one parish family. We celebrate the Eucharist,
                            foster fellowship, and serve those in need. Our mission is to grow in holiness and
                            share the love of Christ with the world.
                        </p>

                        <div className="mt-6">
                            <a
                                href="/about"
                                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-white font-medium
                           bg-secondary hover:bg-secondary/90 focus:outline-none focus:ring-2
                           focus:ring-[#710000]/50 transition-all duration-200 group"
                            >
                                Learn More About Us
                                <span className="transition-transform group-hover:translate-x-1">→</span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}