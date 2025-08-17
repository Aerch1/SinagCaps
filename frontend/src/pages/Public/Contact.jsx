// src/pages/Contact.jsx
"use client";

import Input from "../../components/input.jsx";
import HeroBanner from "../../components/HeroBanner";
import { User, Mail, Phone, Tag, MapPin, ArrowRight } from "lucide-react";

const HERO_IMG = "/forgot.jpg";

/** ===== Location (no coordinates; uses place name + your place link) ===== */
const PLACE_NAME =
    "Our Lady of Peace and Good Voyage Parish - Lodlod, Lipa City, Batangas ";
const PLACE_LINK =
    "https://www.google.com/maps/place/Our+Lady+of+Peace+and+Good+Voyage+Parish+-+Lodlod,+Lipa+City,+Batangas+(Archdiocese+of+Lipa)/@13.9310824,121.1423383,17z/data=!4m6!3m5!1s0x33bd6ccb8987b84f:0x75dc85e2267c7709!8m2!3d13.9310824!4d121.1423383!16s%2Fg%2F11dywpg8g8?entry=ttu";

// Simple embed from the place name (no API key needed)
const MAP_EMBED_SRC = `https://www.google.com/maps?q=${encodeURIComponent(
    PLACE_NAME
)}&output=embed`;

export default function Contact() {
    const handleSubmit = (e) => {
        e.preventDefault();
        alert("Message sent! (Demo)");
    };

    return (
        <main className="bg-white">
            <HeroBanner title="Contact Us" imageSrc={HERO_IMG} />

            {/* Top text */}
            <section className="mx-auto max-w-7xl px-6 lg:px-8 py-10">
                <div className="text-center">
                    <p className="text-amber-500 italic">Contact Us</p>
                    <h2 className="mt-2 text-2xl sm:text-3xl font-semibold text-gray-900">
                        Get In Touch With Our Parish
                    </h2>
                    <p className="mt-2 text-gray-600 max-w-2xl mx-auto">
                        Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor
                        incididunt ut labore et dolore magna aliqua.
                    </p>
                </div>
            </section>

            {/* Main two-column area */}
            <section className="mx-auto max-w-7xl px-6 lg:px-8 pb-16">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    {/* LEFT: form */}
                    <div className="self-start bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-6 sm:p-8">
                        <header className="mb-6">
                            <h3 className="text-lg text-gray-900">Contact With Us</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Send us a message and we’ll respond as soon as possible.
                            </p>
                        </header>

                        <form onSubmit={handleSubmit} noValidate className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Input
                                    icon={User}
                                    id="firstName"
                                    name="firstName"
                                    type="text"
                                    placeholder="First Name*"
                                    aria-label="First Name"
                                    autoComplete="given-name"
                                    variant="light"
                                    required
                                />
                                <Input
                                    icon={User}
                                    id="lastName"
                                    name="lastName"
                                    type="text"
                                    placeholder="Last Name*"
                                    aria-label="Last Name"
                                    autoComplete="family-name"
                                    variant="light"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Input
                                    icon={Mail}
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="Email Address*"
                                    aria-label="Email Address"
                                    autoComplete="email"
                                    variant="light"
                                    required
                                />
                                <Input
                                    icon={Phone}
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    placeholder="Phone Number*"
                                    aria-label="Phone Number"
                                    autoComplete="tel"
                                    variant="light"
                                    required
                                />
                            </div>

                            <Input
                                icon={Tag}
                                id="subject"
                                name="subject"
                                type="text"
                                placeholder="Subject*"
                                aria-label="Subject"
                                autoComplete="off"
                                variant="light"
                                required
                            />

                            <div>
                                <textarea
                                    id="message"
                                    name="message"
                                    rows={6}
                                    placeholder="Your Message here"
                                    aria-label="Message"
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                className="inline-flex w-full items-center justify-center rounded-md bg-secondary/90 px-5 py-2.5 text-sm text-white hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-black/40"
                            >
                                 Submit
                            </button>
                        </form>
                    </div>

                    {/* RIGHT: text sections + map (fills remaining height) */}
                    <div className="h-full flex flex-col gap-6 py-6">
                        {/* Call Us */}
                        <section className="flex items-start gap-4">
                            <span className="inline-grid h-6 w-6 shrink-0 place-items-center mt-1">
                                <Phone className="h-5 w-5 text-blue-600" />
                            </span>
                            <div className="space-y-2">
                                <h3 className="text-base text-gray-900">Call Us</h3>
                                <p className="text-sm text-gray-600">
                                    Reach us during working hours for quick assistance.
                                </p>
                                <a
                                    href="tel:+639358841922"
                                    className="block text-sm text-blue-600 hover:underline"
                                >
                                    (+63) 935 884 1922
                                </a>
                            </div>
                        </section>

                        {/* Visit Us */}
                        <section className="flex items-start gap-4">
                            <span className="inline-grid h-6 w-6 shrink-0 place-items-center mt-1">
                                <MapPin className="h-5 w-5 text-blue-600" />
                            </span>
                            <div className="space-y-2">
                                <h3 className="text-base text-gray-900">Visit Us</h3>
                                <p className="text-sm text-gray-600">
                                    You can visit the parish office at the address below.
                                </p>
                                <a
                                    href={PLACE_LINK}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block text-sm text-blue-600 hover:underline"
                                >
                                    {PLACE_NAME}
                                </a>
                            </div>
                        </section>

                        {/* Live Chat info */}
                        <section className="flex items-start gap-4">
                            <span className="inline-grid h-6 w-6 shrink-0 place-items-center mt-1">
                                <ArrowRight className="h-5 w-5 text-blue-600" />
                            </span>
                            <div className="space-y-2">
                                <h3 className="text-base text-gray-900">Live Chat</h3>
                                <p className="text-sm text-gray-600">
                                    You can contact us through the chat widget when an admin is online or during
                                    working hours. If no one is available, please send your message using the form.
                                </p>
                                <p className="text-xs text-gray-500">Working hours: Mon – Sat, 9:00 – 5:00</p>
                            </div>
                        </section>

                        {/* Map fills remaining vertical space; min height for mobile */}
                        <div className="flex-1 rounded-xl overflow-hidden min-h-[280px] md:min-h-[360px]">
                            <iframe
                                title="Parish location"
                                src={MAP_EMBED_SRC}
                                className="w-full h-full border-0"
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                allowFullScreen
                            />
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
