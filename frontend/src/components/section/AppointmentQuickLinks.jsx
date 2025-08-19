import { Link } from "react-router-dom";
import { CalendarPlus, RefreshCcw, ClipboardList, FileText, HelpCircle, MapPin } from "lucide-react";

const LINKS = [
    { title: "Schedule an Appointment", to: "/appointments/new", Icon: CalendarPlus },
    { title: "Manage / Reschedule", to: "/appointments", Icon: RefreshCcw },
    { title: "Requirements", to: "/requirements", Icon: ClipboardList },
    { title: "Document Request", to: "/records", Icon: FileText },
    { title: "FAQs", to: "/faqs", Icon: HelpCircle },
    { title: "Office Hours & Location", to: "/contact", Icon: MapPin },
];

export default function AppointmentQuickLinks({ items = LINKS }) {
    return (
        <section className="w-full bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
                <h2 className="text-center text-2xl sm:text-3xl font-semibold text-slate-900">Quick Links</h2>
                <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 sm:gap-8 justify-items-center">
                    {items.map(({ title, to, Icon }) => (
                        <Link
                            key={title}
                            to={to}
                            className="group flex flex-col items-center text-center p-4 rounded-xl hover:bg-slate-50
                         focus:outline-none focus:ring-2 focus:ring-[#710000]/30 transition"
                        >
                            <div className="h-16 w-16 rounded-2xl border border-slate-200 bg-white flex items-center justify-center shadow-sm group-hover:shadow-md">
                                <Icon className="h-9 w-9 text-slate-700" strokeWidth={2} />
                            </div>
                            <p className="mt-4 text-sm font-medium text-slate-800 leading-snug">{title}</p>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
