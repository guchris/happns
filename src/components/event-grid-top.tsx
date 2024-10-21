// Next and React Imports
import Link from "next/link"
import Image from "next/image"

// App Imports
import { Event } from "@/components/types"
import { sortEventsByDateAndName, formatEventDate } from "@/lib/eventUtils"

// Shadcn Imports
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

type TopEventsGridProps = {
    events: Event[];
};

const TopEventsGrid = ({ events }: TopEventsGridProps) => {
    
    const filteredEvents = events.filter((event) => {
        const today = new Date().toISOString().split("T")[0];
        return (
            event.startDate >= today || (event.startDate <= today && event.endDate >= today)
        );
    });

    const sortedEvents = sortEventsByDateAndName(filteredEvents)
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 8);

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">most popular</span>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {sortedEvents.length > 0 ? (
                    sortedEvents.map((event) => (
                        <Card key={event.id} className="w-full">
                            <Link href={`/events/${event.id}`} className="no-underline">
                                <CardHeader className="p-2">
                                    <div className="aspect-w-1 aspect-h-1 w-full relative">
                                        <Image
                                            src={event.image || "/tempFlyer1.svg"}
                                            alt={event.name}
                                            width={150}
                                            height={150}
                                            loading="lazy"
                                            className="object-cover w-full h-full rounded-lg"
                                        />
                                    </div>
                                    <CardTitle className="line-clamp-1 text-base font-semibold mt-2">{event.name}</CardTitle>
                                    <CardDescription className="text-sm text-muted-foreground">{formatEventDate(event.startDate, event.endDate)}</CardDescription>
                                </CardHeader>
                            </Link>
                        </Card>
                    ))
                ) : (
                    <p className="text-sm text-muted-foreground">no top events available</p>
                )}
            </div>
        </div>
    );
}

export default TopEventsGrid;