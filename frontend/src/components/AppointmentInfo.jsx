import { Link } from "react-router-dom";
import { CheckCircle2, ArrowRight } from "lucide-react";

export default function AppointmentInfo({
    image = "/insidechurch.jpg",
    title = "Save time — book parish services online",
    description = "Pick a time that works for you and we'll be ready to serve your family.",
    bullets = [
        "Mass intentions & office visits",
        "Baptism & wedding interviews",
        "Pastoral care & counseling",
    ],
    ctaTo = "/appointments",
    ctaLabel = "Make an Appointment",
}) {
    return (
        <section className="w-full ">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
                <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-start justify-items-center">
                    <div className="relative w-full max-w-[640px]">
                        <div className="relative z-10 overflow-hidden rounded-xl ring-1 ring-slate-200">
                            <img
                                src={image}
                                alt="Parish front desk assisting a parishioner"
                                className="w-full h-[300px] lg:h-[340px] object-cover"
                                loading="lazy"
                            />
                        </div>
                        <div className="absolute -bottom-4 -left-4 h-[80%] w-[92%] rounded-xl bg-slate-200/60" />
                    </div>

                    <div className="w-full max-w-xl">
                        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                            {title}
                        </h2>
                        <p className="mt-3 text-slate-600 leading-relaxed">{description}</p>
                        <ul className="mt-5 space-y-3">
                            {bullets.map((item) => (
                                <li key={item} className="flex items-start gap-3">
                                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-slate-700" />
                                    <span className="text-slate-800">{item}</span>
                                </li>
                            ))}
                        </ul>
                        <div className="mt-6">
                            <Link
                                to={ctaTo}
                                className="inline-flex items-center gap-2 rounded-md px-5 py-3 text-white font-medium
                           bg-[#710000] hover:bg-[#600000] focus:outline-none focus:ring-2
                           focus:ring-[#710000]/40 transition"
                            >
                                {ctaLabel}
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
