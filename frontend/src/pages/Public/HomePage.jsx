import Hero from "../../components/section/Hero"
import PublicAdvisory from "../../components/section/PublicAdvisory"
import ChurchBulletin from "../../components/section/ChurchBulletin"
import AboutSection from "../../components/section/AboutSection"
import InfoBanner from "../../components/section/InfoBanner"
import TwoFeatureCards from "../../components/section/TwoFeatureCards"
import AppointmentQuickLinks from "../../components/section/AppointmentQuickLinks"
import ChurchUpdates from "../../components/section/ChurchUpdates"

// ✅ Animation wrapper
import FadeInWhenVisible from "../../components/common/FadeInWhenVisible"
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
            {/* Hero - maybe no animation, since it’s already full width */}
            <Hero slides={slides} />

            <FadeInWhenVisible>
                <PublicAdvisory
                    variant="announcement"
                    message="Church offices will be closed this Friday for facility maintenance. Services proceed as scheduled."
                    ctas={[{ label: "View Details", to: "/announcements" }]}
                />
            </FadeInWhenVisible>

            <FadeInWhenVisible>
                <ChurchBulletin />
            </FadeInWhenVisible>

            <FadeInWhenVisible>
                <AboutSection />
            </FadeInWhenVisible>

            <FadeInWhenVisible>
                <InfoBanner />
            </FadeInWhenVisible>

            <FadeInWhenVisible>
                <ChurchUpdates />
            </FadeInWhenVisible>

            <FadeInWhenVisible>
                <TwoFeatureCards />
            </FadeInWhenVisible>

            <FadeInWhenVisible>
                <AppointmentQuickLinks />
            </FadeInWhenVisible>
        </>
    )
}
