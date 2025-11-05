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
import { useAuthStore } from "../../store/authStore";
import ServicePreviewSection from "../../components/section/ServicePreviewSection";


export default function HomePage() {
    const { isAuthenticated } = useAuthStore();

    // 🔄 Dynamic slides based on authentication
    const slides = isAuthenticated
        ? [
            {
                image: "/hero2.png",
                heading: "Welcome Back to Our Church Family",
                subheading:
                    "Access your appointments, documents, and stay updated with the latest announcements.",
                ctas: [
                    { label: "My Appointments", to: "/settings/appointments", variant: "primary" },
                    { label: "Announcements", to: "/announcements", variant: "ghost" },
                ],
            },
            {
                image: "/church.jpg",
                heading: "Plan or Manage Your Visits",
                subheading:
                    "Easily manage your church appointments and connect with our ministry leaders.",
                ctas: [
                    { label: "Manage Appointments", to: "/settings/appointments", variant: "primary" },
                    { label: "Document Requests", to: "/document-request", variant: "ghost" },
                ],
            },
            {
                image: "/outsidechurch.jpg",
                heading: "Stay Involved and Connected",
                subheading:
                    "Keep track of your records, events, and announcements—all in one place.",
                ctas: [
                    { label: "Notifications", to: "/settings/notification", variant: "primary" },
                    { label: "Contact Us", to: "/contact", variant: "ghost" },
                ],
            },
        ]
        : [
            {
                image: "/hero2.png",
                heading: "Join Our Church Community",
                subheading:
                    "Create your account to book counseling, ministry appointments, and receive updates.",
                ctas: [
                    { label: "Register", to: "/signup", variant: "primary" },
                    { label: "About Us", to: "/about", variant: "ghost" },
                ],
            },
            {
                image: "/church.jpg",
                heading: "Plan Your Visit With Ease",
                subheading:
                    "Pick a time that works for you, meet with our leaders, and receive reminders directly to your inbox.",
                ctas: [
                    { label: "Request for schedule", to: "/services/appointments/terms", variant: "primary" },
                    { label: "Document Request", to: "/document-request", variant: "ghost" },
                ],
            },
            {
                image: "/outsidechurch.jpg",
                heading: "Welcome Home",
                subheading:
                    "Whether you’re new or returning, we’re glad you’re here. Stay connected with our ministries.",
                ctas: [
                    { label: "Register", to: "/signup", variant: "primary" },
                    { label: "Contact Us", to: "/contact", variant: "ghost" },
                ],
            },
        ];

    return (
        <main className="bg-white">
            {/* 🕊 Hero */}
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



            {/* 🕓 Service Preview */}
            <motion.section
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
            >
                <ServicePreviewSection />
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

            {/* 💬 Chatbot */}
            <AppointmentChatbot />
        </main>
    );
}
