// src/components/Footer.jsx
import { Phone, Mail, Instagram, Globe, Twitter, Youtube } from "lucide-react";

export default function Footer() {
    const year = new Date().getFullYear();

    return (
        <footer className="bg-slate-900 text-slate-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    {/* Brand */}
                    <div>
                        <div className="flex items-center gap-3">
                            <img
                                src="/logo.png"
                                alt="Our Lady of Peace and Good Voyage"
                                className="h-12 w-12 rounded-full object-contain"
                            />
                            <h3 className="text-xl font-semibold text-white leading-tight">
                                Our Lady of Peace and
                                <br className="hidden sm:block" />
                                Good Voyage
                            </h3>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-slate-400">
                            A welcoming Catholic community dedicated to worship, service, and spiritual growth.
                        </p>

                        <div className="mt-4 flex items-center gap-3">
                            {[
                                { Icon: Instagram, label: "Instagram", href: "#" },
                                { Icon: Globe, label: "Website", href: "#" },
                                { Icon: Twitter, label: "Twitter", href: "#" },
                                { Icon: Youtube, label: "YouTube", href: "#" },
                            ].map(({ Icon, label, href }) => (
                                <a
                                    key={label}
                                    href={href}
                                    aria-label={label}
                                    className="h-9 w-9 rounded-full border border-slate-600 flex items-center justify-center hover:bg-slate-800 hover:border-slate-500 transition"
                                >
                                    <Icon className="h-4 w-4" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Schedule of Services */}
                    <div>
                        <h4 className="text-lg font-semibold text-white">Schedule of Services</h4>
                        <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                            <div>
                                <p className="font-semibold text-slate-200">Monday to Thursday</p>
                                <p className="mt-1">6:30 am <span className="text-slate-400">| Daily Mass</span></p>
                            </div>
                            <div>
                                <p className="font-semibold text-slate-200">Saturday</p>
                                <p className="mt-1">6:30 am <span className="text-slate-400">| Confession After</span></p>
                                <p className="mt-1">7:00 pm <span className="text-slate-400">| Anticipated</span></p>
                            </div>
                            <div>
                                <p className="font-semibold text-slate-200">Friday</p>
                                <p className="mt-1">6:00 am <span className="text-slate-400">| First Friday</span></p>
                                <p className="mt-1">5:00 pm <span className="text-slate-400">| Confession After</span></p>
                            </div>
                            <div>
                                <p className="font-semibold text-slate-200">Sunday</p>
                                <p className="mt-1">6:30 am <span className="text-slate-400">| 7:00 am</span></p>
                                <p className="mt-1">8:30 pm <span className="text-slate-400">| w/Fb Live</span></p>
                            </div>
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h4 className="text-lg font-semibold text-white">Contact Info</h4>
                        <div className="mt-4 space-y-3 text-sm">
                            <a href="tel:09668548848" className="flex items-center gap-3 hover:text-white">
                                <span className="h-8 w-8 rounded-full border border-slate-600 flex items-center justify-center">
                                    <Phone className="h-4 w-4" />
                                </span>
                                <span>0966 854 8848</span>
                            </a>
                            <a href="mailto:lodlod.olpgvp@gmail.com" className="flex items-center gap-3 hover:text-white">
                                <span className="h-8 w-8 rounded-full border border-slate-600 flex items-center justify-center">
                                    <Mail className="h-4 w-4" />
                                </span>
                                <span>lodlod.olpgvp@gmail.com</span>
                            </a>

                            <div className="mt-4">
                                <p className="font-semibold text-slate-200">Administration Office Hours</p>
                                <p className="mt-1">Weekdays: 8:00 am - 5:00 pm</p>
                                <p className="mt-1">Sundays: 6:00 am - 2:00 pm</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 border-t border-slate-700/60 pt-4">
                    <p className="text-center text-xs text-slate-400">
                        Copyright © {year} OLOPGV. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
