"use client";
import React from "react";
import { motion } from "framer-motion";

export default function AboutPage() {
    return (
        <main className="bg-gray-50 text-gray-800">
            {/* 🕊️ Hero Section */}
            <section
                className="relative flex items-center justify-center h-[400px] bg-cover bg-center"
                style={{
                    backgroundImage:
                        "linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=1200')",
                }}
            >
                <div className="text-center text-white px-4">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-4xl md:text-5xl font-bold mb-2"
                    >
                        About Our Parish
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7 }}
                        className="text-lg md:text-xl font-light"
                    >
                        A Community of Faith, Hope, and Love
                    </motion.p>
                </div>
            </section>

            {/* 🌿 Intro Section */}
            <section className="max-w-3xl mx-auto bg-white rounded-lg shadow-md -mt-16 p-8 text-center relative z-10">
                <p className="text-gray-600 leading-relaxed text-base md:text-lg">
                    Welcome to our parish family. For generations, we have been a beacon
                    of faith and service in our community — committed to spreading the
                    Gospel message and nurturing spiritual growth in all who seek God’s
                    presence in their lives.
                </p>
            </section>

            {/* ✨ Mission, Vision, Values */}
            <div className="max-w-6xl mx-auto px-4 py-16 space-y-10">
                {/* Mission */}
                <SectionCard
                    icon="✨"
                    title="Our Mission"
                    content={[
                        "Our mission is to be a welcoming Catholic community that proclaims the Gospel of Jesus Christ through worship, education, and service.",
                        "We strive to foster spiritual growth, build meaningful relationships, and serve those in need with compassion and dedication.",
                    ]}
                />

                {/* Vision */}
                <SectionCard
                    icon="🎯"
                    title="Our Vision"
                    content={[
                        "We envision a vibrant parish community where every individual encounters Christ and experiences the transforming power of His love.",
                        "Through prayer, sacraments, and active ministry, we seek to build a community that radiates joy and hope, inspiring others to discover the richness of Catholic faith and tradition.",
                    ]}
                />

                {/* Core Values */}
                <div className="bg-white p-8 rounded-lg shadow-md">
                    <div className="flex items-center border-b border-amber-300 pb-3 mb-6">
                        <div className="h-12 w-12 flex items-center justify-center rounded-full bg-secondary text-white text-xl mr-3">
                            ❤️
                        </div>
                        <h2 className="text-2xl font-semibold text-gray-800">
                            Our Core Values
                        </h2>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            {
                                title: "Faith",
                                desc: "Deepening our relationship with God through prayer, worship, and sacraments.",
                            },
                            {
                                title: "Community",
                                desc: "Building strong bonds of fellowship and support among all parishioners.",
                            },
                            {
                                title: "Service",
                                desc: "Serving others with compassion, generosity, and Christ-like love.",
                            },
                            {
                                title: "Stewardship",
                                desc: "Caring for God’s gifts through responsible use of our time, talent, and treasure.",
                            },
                        ].map((v) => (
                            <motion.div
                                key={v.title}
                                whileHover={{ y: -4 }}
                                className="bg-gray-50 border-l-4 border-secondary p-4 rounded-md shadow-sm"
                            >
                                <h3 className="font-semibold text-gray-800 mb-1">{v.title}</h3>
                                <p className="text-sm text-gray-600">{v.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 🕍 Image Section */}
            <div className="max-w-6xl mx-auto px-4 mb-16">
                <div className="rounded-lg overflow-hidden shadow-md">
                    <img
                        src="https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?w=1200"
                        alt="Church Interior"
                        className="w-full h-[400px] object-cover"
                    />
                </div>
            </div>

            {/* 📖 History Section */}
            <div className="max-w-6xl mx-auto px-4 mb-16">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    viewport={{ once: true }}
                    className="bg-white rounded-lg shadow-md p-8"
                >
                    <div className="flex items-center border-b border-amber-300 pb-3 mb-6">
                        <div className="h-12 w-12 flex items-center justify-center rounded-full bg-secondary text-white text-xl mr-3">
                            📖
                        </div>
                        <h2 className="text-2xl font-semibold text-gray-800">Our History</h2>
                    </div>

                    <div className="space-y-8">
                        {[
                            {
                                year: "1950",
                                title: "Foundation",
                                desc: "Our parish was established to serve the growing Catholic community in the area. What began as small gatherings soon grew into a thriving congregation.",
                            },
                            {
                                year: "1965",
                                title: "Church Building",
                                desc: "Through the dedication and generosity of parishioners, our beautiful church building was constructed — a permanent home for our community’s worship and fellowship.",
                            },
                            {
                                year: "1985",
                                title: "Parish Hall & School",
                                desc: "Expansion of facilities to include a parish hall and education center, allowing us to better serve families and host community events.",
                            },
                            {
                                year: "2010",
                                title: "Renovation & Growth",
                                desc: "Major renovation and beautification project completed, enhancing our worship space while preserving its sacred character.",
                            },
                            {
                                year: "Today",
                                title: "Continuing Our Mission",
                                desc: "We continue to grow and serve, embracing new generations while honoring our rich traditions — always striving to be a light of faith in our community.",
                            },
                        ].map((t, i) => (
                            <div
                                key={i}
                                className="flex flex-col sm:flex-row sm:items-start gap-4 border-b border-gray-200 pb-6"
                            >
                                <div className="text-secondary font-bold text-xl w-24 sm:w-32">
                                    {t.year}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-800 mb-1">{t.title}</h3>
                                    <p className="text-gray-600 text-sm leading-relaxed">{t.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>


            {/* 📊 Stats Section */}
            <div className="bg-white py-16 shadow-inner">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        {[
                            { label: "Years of Service", value: "75+" },
                            { label: "Registered Families", value: "2,000+" },
                            { label: "Active Ministries", value: "50+" },
                            { label: "Community Members Served", value: "1,000+" },
                        ].map((stat, i) => (
                            <div key={i}>
                                <div className="text-3xl font-bold text-secondary mb-1">
                                    {stat.value}
                                </div>
                                <div className="text-gray-600 text-sm">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 🙌 Join Section */}
            <section className="bg-white border-t border-gray-200 py-12 text-center">
                <div className="max-w-3xl mx-auto px-4">
                    <h3 className="text-2xl font-semibold text-gray-800 mb-3">
                        Join Our Community
                    </h3>
                    <p className="text-gray-600 mb-8 text-sm md:text-base">
                        We welcome you to be part of our parish family. Come worship with us
                        and experience the warmth of our community.
                    </p>
                    <a
                        href="/services/appointments/book"
                        className="inline-block bg-secondary text-white px-6 py-3 rounded-md text-sm font-medium hover:bg-secondary/90 transition"
                    >
                        Join Us Today
                    </a>
                </div>
            </section>
        </main>
    );
}

/* -------------------- 🔹 Reusable SectionCard Component -------------------- */
function SectionCard({ icon, title, content }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="bg-white rounded-lg shadow-md p-8"
        >
            <div className="flex items-center border-b border-amber-300 pb-3 mb-6">
                <div className="h-12 w-12 flex items-center justify-center rounded-full bg-secondary text-white text-xl mr-3">
                    {icon}
                </div>
                <h2 className="text-2xl font-semibold text-gray-800">{title}</h2>
            </div>
            {content && (
                <div className="space-y-4 text-gray-600 leading-relaxed text-sm md:text-base">
                    {content.map((p, i) => (
                        <p key={i}>{p}</p>
                    ))}
                </div>
            )}
        </motion.div>
    );
}
