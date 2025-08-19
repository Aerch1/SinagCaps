export default function AboutSection() {
    return (
        <section className="w-full bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
                <div className="grid lg:grid-cols-2 gap-8 items-center justify-items-center">
                    <div className="rounded-xl overflow-hidden shadow-sm w-full max-w-[640px]">
                        <img
                            src="/church.jpg"
                            alt="Our Lady of Peace and Good Voyage Parish"
                            className="w-full h-full object-cover"
                        />
                    </div>

                    <div className="w-full max-w-xl">
                        <p className="uppercase tracking-widest text-sm text-amber-600 font-semibold">
                            About Our Church
                        </p>
                        <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-gray-900">
                            Our Lady of Peace and Good Voyage Parish
                        </h2>
                        <p className="mt-4 text-gray-600 leading-relaxed">
                            We are a welcoming Catholic community rooted in prayer, service, and the Sacraments…
                        </p>
                        <p className="mt-3 text-gray-600 leading-relaxed">
                            As one parish family, we walk together in faith—supporting one another…
                        </p>

                        <div className="mt-6">
                            <a
                                href="/about"
                                className="inline-flex items-center rounded-full px-5 py-2.5 text-white font-medium
                           bg-[#710000] hover:bg-[#600000] focus:outline-none focus:ring-2
                           focus:ring-[#710000]/50 transition"
                            >
                                Learn More
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
