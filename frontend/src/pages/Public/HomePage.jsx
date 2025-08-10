import Hero from "../../components/Hero"
import PublicAdvisory from "../../components/PublicAdvisory"
import ChurchBulletin from "../../components/ChurchBulletin"
const slides = [
    {
        image: "/hero2.png",
        heading: "Join Our Church Community",
        subheading:
            "Create your account to book counseling, ministry appointments, and keep up with services and events.",
        ctas: [
            { label: "Register", to: "/signup", variant: "primary" },
            { label: "View Services", to: "/services", variant: "ghost" },
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
]

export default function HomePage() {
    return (
        <>
            {/* Full-width only here */}
            <Hero slides={slides} />
            <PublicAdvisory
                variant="announcement"
                message="Church offices will be closed this Friday for facility maintenance. Services proceed as scheduled."
                ctas={[{ label: "View Details", to: "/announcements" }]}
            />

            {/* Everything below stays centered & constrained */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <ChurchBulletin />

                {/* your other sections go here */}
                {/* <Features /> */}
                {/* <Announcements /> */}
                {/* <FooterCTA /> */}
            </div>
        </>
    )
}
