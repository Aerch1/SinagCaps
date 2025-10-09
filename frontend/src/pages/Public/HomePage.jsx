"use client";

import { motion } from "framer-motion";
import Hero from "../../components/section/Hero";
import PublicAdvisory from "../../components/section/PublicAdvisory";
import ChurchBulletin from "../../components/section/ChurchBulletin";
import AboutSection from "../../components/section/AboutSection";
import InfoBanner from "../../components/section/InfoBanner";
import TwoFeatureCards from "../../components/section/TwoFeatureCards";
import AppointmentQuickLinks from "../../components/section/AppointmentQuickLinks";
import ChurchUpdates from "../../components/section/ChurchUpdates";
import AppointmentChatbot from "../../components/common/AppointmentChatbot";

const slides = [
    {
        image: "/hero2.png",
        heading: "Join Our Church Community",
        subheading:
            "Create your account to book counseling, ministry appointments, and keep up with services and events.",
        ctas: [
            { label: "Register", to: "/signup", variant: "primary" },
            { label: "View Services", to: "/services/generalinfo", variant: "ghost" },
        ],
    },
    {
        image: "/church.jpg",
        heading: "Plan Your Visit With Ease",
        subheading:
            "Pick a time that works for you, meet with leaders, and receive reminders directly to your inbox.",
        ctas: [
            { label: "Make Appointment", to: "/appointments", variant: "primary" },
            { label: "Register", to: "/signup", variant: "ghost" },
        ],
    },
    {
        image: "/outsidechurch.jpg",
        heading: "Welcome Home",
        subheading:
            "Whether you’re new or returning, we’re glad you’re here. Manage your visits and stay connected.",
        ctas: [{ label: "Register", to: "/signup", variant: "primary" }],
    },
];

export default function HomePage() {
    return (
        <main className="bg-white">
            {/* 🕊 Hero (no animation wrapper) */}
            <Hero slides={slides} />

            {/* 🩵 Public Advisory */}
            <motion.section
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
            >
                <PublicAdvisory />
            </motion.section>

            {/* 📜 Church Bulletin */}
            <motion.section
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
            >
                <ChurchBulletin />
            </motion.section>

            {/* 🙏 About Section */}
            <motion.section
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
            >
                <AboutSection />
            </motion.section>

            {/* 💬 Info Banner */}
            <motion.section
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
            >
                <InfoBanner />
            </motion.section>

            {/* 🕊 Church Updates */}
            <motion.section
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
            >
                <ChurchUpdates />
            </motion.section>

            {/* ✨ Feature Cards */}
            <motion.section
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
            >
                <TwoFeatureCards />
            </motion.section>

            {/* ⚡ Quick Links */}
            <motion.section
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
            >
                <AppointmentQuickLinks />
            </motion.section>

            {/* 💬 Chatbot (no animation) */}
            <AppointmentChatbot />
        </main>
    );
}
