"use client"
import { Calendar, Clock, RotateCcw } from "lucide-react"
import StatsCard from "./StatsCard"

const Card = () => {
    // Mock data with change percentages - you can replace with real data later
    const stats = [
        {
            title: "Today Schedule",
            count: 4, // Updated to match today's appointments
            change: 12.5, // positive change
            icon: Calendar,
           
            iconColor: "text-blue-600 dark:text-blue-400",
        },
        {
            title: "Pending",
            count: 1, // Updated based on today's data
            change: -8.3, // negative change
            icon: Clock,
          
            iconColor: "text-yellow-600 dark:text-yellow-400",
        },
        {
            title: "Reschedule",
            count: 0, // Updated
            change: 25.0, // positive change
            icon: RotateCcw,
           
            iconColor: "text-orange-600 dark:text-orange-400",
        },
    ]

    return (
        <>
            {stats.map((stat, index) => (
                <StatsCard
                    key={index}
                    icon={stat.icon}
                    title={stat.title}
                    count={stat.count}
                    change={stat.change}
                   
                    iconColor={stat.iconColor}
                />
            ))}
        </>
    )
}

export default Card
