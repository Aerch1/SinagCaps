export default function InfoBanner({
    image = "/church.jpg",
    title = "Don't miss the latest announcements & news",
    description = "Stay updated with parish notices, events, and schedule changes.",
    ctaLabel = "View Announcements",
    ctaTo = "/announcements",
}) {
    return (
        <section
            className="relative isolate w-full bg-center bg-cover"
            style={{ backgroundImage: `url(${image})` }}
            aria-label="Parish updates banner"
        >
            <div className="absolute inset-0 bg-black/60" />
            <div className="relative max-w-7xl mx-auto px-6 py-12 lg:py-14">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{title}</h2>
                <p className="mt-1 text-sm sm:text-base text-white/80 max-w-2xl">{description}</p>
                <div className="mt-6">
                    <a
                        href={ctaTo}
                        className="inline-flex items-center  px-6 py-3 text-white font-medium
                         border    border-white
                          transition"
                    >
                        {ctaLabel}
                    </a>
                </div>
            </div>
        </section>
    );
}
