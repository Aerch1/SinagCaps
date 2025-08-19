// src/components/ServicesStrip.jsx
import { Link } from "react-router-dom";
import { CalendarPlus, Clock3, Info, FileText } from "lucide-react";

const NAV_ITEMS = [
    {
        title: "Schedule an Appointment",
        to: "/appointments/new",
        Icon: CalendarPlus,
    },
    {
        title: "Manage Existing Appointment",
        to: "/appointments",
        Icon: Clock3,
    },
    {
        title: "Advisories & Updates",
        to: "/announcements",
        Icon: Info,
    },
    {
        title: "List of Requirements",
        to: "/requirements",
        Icon: FileText,
    },
];

export default function ServicesStrip() {
    return (
        <section className="w-full bg-white">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
                <h2 className="text-center text-2xl sm:text-3xl font-semibold text-slate-900">
                    Appointment Quick Links
                </h2>
                <p className="mt-1 text-center text-slate-500">
                    Book, manage, and find what you need—fast.
                </p>

                <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
                    {NAV_ITEMS.map(({ title, to, Icon }) => (
                        <Link
                            key={title}
                            to={to}
                            className="group flex flex-col items-center text-center focus:outline-none focus:ring-2 focus:ring-blue-300 rounded-xl p-4 hover:bg-slate-50 transition"
                            aria-label={title}
                        >
                            <div className="h-20 w-20 rounded-2xl border border-blue-200 bg-white flex items-center justify-center shadow-sm group-hover:shadow-md">
                                <Icon className="h-10 w-10 text-blue-600" strokeWidth={2} />
                            </div>

                            <h3 className="mt-5 text-lg font-semibold text-slate-900 leading-snug">
                                {title}
                            </h3>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
