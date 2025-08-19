import { Link } from "react-router-dom"
import { Megaphone, Bell } from "lucide-react"
import { useId } from "react"

const PublicAdvisory = ({
    variant = "reminder", // "reminder" | "announcement"
    title,
    message,
    ctas = [], // [{ label, to }]
}) => {
    const isAnnouncement = variant === "announcement"
    const Icon = isAnnouncement ? Megaphone : Bell
    const regionId = useId()

    // colors: announcement = dark; reminder = gold
    const bannerClasses = isAnnouncement
        ? "bg-gray-900 text-white"
        : "bg-primary text-gray-900"

    return (
        <section
            className="relative w-full select-none"
            aria-labelledby={regionId}
            role="region"
        >
            <div className={bannerClasses}>
                <div className="max-w-7xl mx-auto px-4 py-2 sm:px-6 lg:px-8 justify-center">
                    <div className="flex flex-wrap items-center  gap-2 sm:gap-3 py-3 animate-fade-in-up">
                        {/* Title */}
                        <span
                            id={regionId}
                            className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide"
                        >
                            <Icon className="h-5 w-5" aria-hidden="true" />
                            {title || (isAnnouncement ? "Important Announcement" : "Daily Reminder")}
                        </span>

                        {/* Message (dynamic) */}
                        {message && (
                            <p className=" text-base/6 text-current/90 tracking-tight">{message}</p>
                        )}

                        {/* CTAs (max 2, side-by-side) */}
                        {ctas.length > 0 && (
                            <div className="ml-auto flex flex-row flex-wrap  items-center gap-3">
                                {ctas.slice(0, 2).map((btn, idx) => (
                                    <Link
                                        key={idx}
                                        to={btn.to}
                                        className={`shrink-0 text-sm font-medium underline-offset-4 hover:underline ${isAnnouncement
                                                ? "text-white/90 hover:text-white"
                                                : "text-gray-900 hover:text-gray-800"
                                            }`}
                                    >
                                        {btn.label}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    )
}

export default PublicAdvisory
