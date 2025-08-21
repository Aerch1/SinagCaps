"use client";

import HeroBanner from "../../components/section/HeroBanner.jsx";

const HERO_IMG = "/forgot.jpg";

/** Demo data only — replace with API later */
const EVENTS = [
    {
        id: "evt-1",
        title: "Bible Study Methods",
        start: "2025-09-06T18:00:00",
        end: "2025-09-06T20:00:00",
        timezone: "PST",
        location: "UCM Basement 2",
        excerpt:
            "An interactive workshop on observation, interpretation, and application.",
        image: "/church.jpg",
        href: "#",
    },
    {
        id: "evt-2",
        title: "UCM Library: 2025 Kidz' Lit Fest",
        start: "2025-09-13T09:00:00",
        end: "2025-09-13T15:00:00",
        timezone: "PST",
        location: "UCM Basement 2",
        excerpt:
            "Stories, crafts, and book giveaways. Ideal for kids 6–12 and families.",
        image: "/banner.png",
        href: "#",
    },
    {
        id: "evt-3",
        title: "Missions Month 2025: Be His Light to Every Nation",
        start: "2025-09-07T10:00:00",
        end: "2025-09-07T11:30:00",
        timezone: "PST",
        location: "Sanctuary Hall",
        excerpt:
            "Hear from the field. Learn practical ways you can pray, give, and go.",
        image: "/service.jpg",
        href: "#",
    },
    {
        id: "evt-4",
        title: "Kingdom Kids: Moving Up Sunday",
        start: "2025-09-21T08:30:00",
        end: "2025-09-21T12:00:00",
        timezone: "PST",
        location: "UCM Basement 2 (Sundays)",
        excerpt:
            "Celebration for kids transitioning to the next class level. Parents welcome.",
        image: "/outsidechurch.jpg",
        href: "#",
    },
];

function monthDay(dateStr) {
    const d = new Date(dateStr);
    return {
        m: d.toLocaleString("en-US", { month: "short" }),
        d: d.getDate(),
    };
}

function time12(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });
}

export default function Events() {
    return (
        <main className="bg-white">
            {/* Full-width hero */}
            <HeroBanner title="Events" imageSrc={HERO_IMG} />

            {/* Page header */}
            <section className="mx-auto max-w-4xl px-6 lg:px-8 py-10">
                <div className="text-center">
                    <p className="text-amber-500 italic">Parish Events</p>
                    <h2 className="mt-2 text-2xl sm:text-3xl font-semibold text-gray-900">
                        We invite you to join these events to learn more and grow in Christ.
                    </h2>
                    <p className="mt-2 text-gray-600 max-w-2xl mx-auto">
                        Browse upcoming activities and special gatherings. Click an event to
                        see full details.
                    </p>
                </div>
            </section>

            {/* Events list */}
            <section className="mx-auto max-w-3xl px-6 lg:px-8 pb-16 pt-10">
                <ul className="space-y-4">
                    {EVENTS.map((e) => {
                        const badge = monthDay(e.start);
                        return (
                            <li key={e.id}>
                                <a
                                    href={e.href}
                                    className="group blockbg-white ring-1  ring-gray-200 shadow-sm hover:shadow-md transition"
                                >
                                    <div className="flex gap-6 p-4">
                                        {/* thumbnail */}
                                        <div className="relative h-24 w-40 shrink-0 overflow-hidden  bg-gray-100">
                                            {/* If image is missing, the bg acts as fallback */}
                                            {e.image ? (
                                                <img
                                                    src={e.image}
                                                    alt={e.title}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : null}
                                            {/* date badge */}
                                            <div className="absolute left-2 top-2 rounded-md bg-white/95 px-2 py-1 text-center shadow-sm ring-1 ring-gray-200">
                                                <div className="text-[10px] font-medium text-gray-500 leading-none">
                                                    {badge.m}
                                                </div>
                                                <div className="text-base font-semibold text-gray-900 leading-tight -mt-0.5">
                                                    {badge.d}
                                                </div>
                                            </div>
                                        </div>

                                        {/* details */}
                                        <div className="min-w-0 flex-1">
                                            <h3 className="text-base sm:text-lg font-semibold text-gray-900  transition-colors group-hover:text-red-700">
                                                {e.title}
                                            </h3>

                                            <div className="mt-1 text-xs sm:text-sm text-gray-500">
                                                <span>
                                                    {time12(e.start)} – {time12(e.end)} {e.timezone}
                                                </span>
                                                {e.location ? (
                                                    <>
                                                        <span className="mx-2">•</span>
                                                        <span>{e.location}</span>
                                                    </>
                                                ) : null}
                                            </div>

                                            <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                                                {e.excerpt}
                                            </p>
                                        </div>
                                    </div>
                                </a>
                            </li>
                        );
                    })}
                </ul>

                {/* Optional: Load more (placeholder) */}
                {/* <div className="mt-8 text-center">
          <button className="rounded-md bg-secondary/90 px-4 py-2 text-sm text-white hover:bg-secondary">
            Load more
          </button>
        </div> */}
            </section>
        </main>
    );
}
