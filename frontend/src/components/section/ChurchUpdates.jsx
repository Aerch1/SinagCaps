import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const UPDATES = [
    {
        title: "Youth Ministry Gathering",
        date: "Sept 18, 2025",
        description:
            "Our Youth Ministry invites all teens for fellowship, praise, and worship night. Bring your friends!",
        image: "/banner.png",
        to: "/updates/youth-gathering",
    },
    {
        title: "Choir Practice",
        date: "Sept 20, 2025",
        description:
            "Weekly choir practice resumes. All members and interested parishioners are welcome to join.",
        image: "/bg1.jpg",
        to: "/updates/choir-practice",
    },
    {
        title: "Parish Outreach Program",
        date: "Sept 25, 2025",
        description:
            "Join our outreach to support families in need. Volunteers and donations are welcome.",
        image: "/updates/outreach.jpg",
        to: "/updates/outreach-program",
    },
    {
        title: "Bible Study Series",
        date: "Sept 28, 2025",
        description:
            "A 4-week Bible Study series on the Gospel of John. Everyone is encouraged to participate.",
        image: "/updates/biblestudy.jpg",
        to: "/updates/bible-study",
    },
];

export default function ChurchUpdates({ updates = UPDATES }) {
    return (
        <section className="w-full bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
                {/* Section Header */}
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-bold tracking-tight">
                        Latest News & Updates
                    </h2>
                    <Button
                        variant="outline"
                        asChild
                        className="border-secondary text-secondary "
                    >
                        <Link to="/updates">View All Updates</Link>
                    </Button>

                </div>

                {/* Grid of Updates (only 3 cards) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {updates.slice(0, 3).map(({ title, date, description, image, to }, i) => (
                        <Card
                            key={i}
                            className="overflow-hidden rounded-xl border py-0 border-gray-200 shadow-sm 
                            hover:shadow-md hover:scale-[1.02] transition-transform duration-300 
                            flex flex-col"
                        >
                            {/* Uniform Image Height (flush top, no padding) */}
                            <div className="w-full h-60">
                                <img
                                    src={image}
                                    alt={title}
                                    className="h-full w-full object-cover"
                                />
                            </div>

                            {/* Content */}
                            <CardContent className="flex flex-col flex-1 p-5">
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold">{title}</h3>
                                    <p className="text-sm text-gray-500 mt-1">{date}</p>
                                    <p className="text-sm text-gray-700 mt-3 line-clamp-3">
                                        {description}
                                    </p>
                                </div>

                                {/* Full Width Outline Button */}
                                <Button
                                    asChild
                                    variant="outline"
                                    className="mt-6 w-full justify-center border-secondary text-secondary "
                                >
                                    <Link to={to}>Read More</Link>
                                </Button>

                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}
