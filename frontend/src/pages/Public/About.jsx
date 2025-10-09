"use client";
import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

export default function AboutPage() {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuthStore()


    const handleJoinClick = (e) => {
        e.preventDefault();
        if (isAuthenticated) {
            navigate("/")
        } else {
            navigate("/signup")
        }
    }

    return (
        <main className="bg-white text-gray-900">
            {/* Hero Section */}
            <section className="relative h-screen flex items-center justify-center overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                        backgroundImage: "url('https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=1200')",
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />

                <div className="relative z-10 text-center text-white px-6 max-w-4xl">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h1 className="text-6xl md:text-7xl font-light mb-6 tracking-tight">
                            Our Parish
                        </h1>
                        <p className="text-xl md:text-2xl font-light opacity-90 leading-relaxed">
                            A spiritual home in Lodlod,<br />guided by faith, hope, and service
                        </p>
                    </motion.div>
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1, duration: 1 }}
                    className="absolute bottom-12 left-1/2 transform -translate-x-1/2"
                >
                    <div className="w-px h-16 bg-white/50" />
                </motion.div>
            </section>

            {/* Introduction */}
            <section className="py-24 px-6">
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                        className="text-center"
                    >
                        <p className="text-2xl md:text-3xl font-light leading-relaxed text-gray-700">
                            Since its establishment in 1944, Our Lady of Peace and Good Voyage Parish has been a beacon of faith in Barangay Lodlod. We strive to be a welcoming community where people of all walks of life can grow closer to Christ.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Mission & Vision Grid */}
            <section className="py-20 px-6 bg-gray-50">
                <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                    >
                        <div className="mb-6">
                            <div className="w-12 h-px bg-gray-900 mb-4" />
                            <h2 className="text-4xl font-light">Our Mission</h2>
                        </div>
                        <p className="text-lg text-gray-600 leading-relaxed mb-6">
                            To nurture a faith-filled Catholic community that honors Our Lady of Peace and Good Voyage through active worship, discipleship, and outreach.
                        </p>
                        <p className="text-lg text-gray-600 leading-relaxed">
                            We commit to fostering spiritual formation, building fellowship, and reaching out to those in need in Lipa and beyond.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                    >
                        <div className="mb-6">
                            <div className="w-12 h-px bg-gray-900 mb-4" />
                            <h2 className="text-4xl font-light">Our Vision</h2>
                        </div>
                        <p className="text-lg text-gray-600 leading-relaxed mb-6">
                            To be a vibrant parish where every person encounters Mary’s intercession and walks in peace under Christ’s guidance.
                        </p>
                        <p className="text-lg text-gray-600 leading-relaxed">
                            United in prayer, sacramental life, and service, we aspire to grow in holiness and share God’s mercy.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Values Section */}
            <section className="py-24 px-6">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-5xl font-light mb-4">Core Values</h2>
                        <p className="text-xl text-gray-600">Principles at the heart of our parish life</p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            {
                                title: "Faith",
                                desc: "Deepening our relationship with God through prayer, sacraments, and meditation.",
                            },
                            {
                                title: "Unity",
                                desc: "Cultivating a sense of belonging in our parish family and among neighbors.",
                            },
                            {
                                title: "Service",
                                desc: "Extending Christ’s love through acts of charity and ministry.",
                            },
                            {
                                title: "Stewardship",
                                desc: "Honoring and responsibly using what God has entrusted to us—our time, talent, and treasures.",
                            },
                        ].map((value, i) => (
                            <motion.div
                                key={value.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: i * 0.1 }}
                                viewport={{ once: true }}
                                className="group"
                            >
                                <div className="mb-4">
                                    <div className="w-8 h-px bg-gray-900 group-hover:w-16 transition-all duration-300" />
                                </div>
                                <h3 className="text-2xl font-light mb-3">{value.title}</h3>
                                <p className="text-gray-600 leading-relaxed">{value.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Visual Break */}
            <section className="h-96 relative">
                <div
                    className="absolute inset-0 bg-cover bg-center bg-fixed"
                    style={{
                        backgroundImage: "url('https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?w=1200')",
                    }}
                />
                <div className="absolute inset-0 bg-black/30" />
            </section>

            {/* History Timeline */}
            <section className="py-24 px-6">
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                        className="mb-16"
                    >
                        <h2 className="text-5xl font-light mb-4">Our Journey</h2>
                        <p className="text-xl text-gray-600">Milestones and memories through the years</p>
                    </motion.div>

                    <div className="space-y-16">
                        {[
                            {
                                year: "1944",
                                title: "Founded as Parish",
                                desc: "Our Lady of Peace and Good Voyage Parish was officially established in Barangay Lodlod, Lipa City.",
                            },
                            {
                                year: "1950s–60s",
                                title: "Early Growth",
                                desc: "Under early pastors, the parish community grew steadily, fostering devotion among families in Lodlod and Pangao.",
                            },
                            {
                                year: "1980s",
                                title: "Building & Expansion",
                                desc: "Renovations and additions were made to accommodate growing participation in worship and ministries.",
                            },
                            {
                                year: "2000s",
                                title: "Deeper Engagement",
                                desc: "Parish programs expanded—formation, youth ministry, outreach, and liturgical renewal took shape.",
                            },
                            {
                                year: "Today",
                                title: "Hope & Renewal",
                                desc: "We continue deepening our faith, serving neighbors, and making our parish a place of peace, healing, and encounter.",
                            },
                        ].map((milestone, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: i * 0.1 }}
                                viewport={{ once: true }}
                                className="flex gap-8 items-start"
                            >
                                <div className="flex-shrink-0 w-24">
                                    <div className="text-3xl font-light text-gray-400">{milestone.year}</div>
                                </div>
                                <div className="flex-1 border-l-2 border-gray-200 pl-8 pb-8">
                                    <h3 className="text-2xl font-light mb-3">{milestone.title}</h3>
                                    <p className="text-gray-600 leading-relaxed text-lg">{milestone.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Call to Action */}
            <section className="py-24 px-6 bg-secondary text-white">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-5xl font-light mb-6">You Are Welcome Here</h2>
                        <p className="text-xl text-gray-300 mb-12 leading-relaxed">
                            Whether you're new to faith, searching for purpose, or longing for a spiritual home, our doors are open to you.
                        </p>
                        <button
                            onClick={handleJoinClick}
                            className="inline-block border-2 border-white px-12 py-4 text-lg font-light hover:bg-white hover:text-gray-900 transition-all duration-300"
                        >
                            Join Our Community
                        </button>
                    </motion.div>
                </div>
            </section>
        </main>
    );
}
