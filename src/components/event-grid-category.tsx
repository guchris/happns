// Next and React Imports
import Link from "next/link"
import Image from "next/image"

// App Imports
import { Event } from "@/components/types"
import { sortEventsByDateAndName, formatEventDate } from "@/lib/eventUtils"

// Shadcn Imports
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

type CategoryEventGridProps = {
    events: Event[];
    category: string;
};

const CategoryEventGrid = ({ events, category }: CategoryEventGridProps) => {

    const filteredEvents = sortEventsByDateAndName(
        events.filter((event) => {
            const today = new Date().toISOString().split("T")[0];
            return event.category.includes(category) && event.startDate >= today;
        })
    ).slice(0, 4);
    
    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold">
                <Badge variant="secondary" className="text-lg">{category}</Badge>
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {filteredEvents.length > 0 ? (
                    filteredEvents.map((event) => (
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
                    <p className="text-sm text-muted-foreground">no upcoming {category} events available</p>
                )}
            </div>
        </div>
    );
}

export default CategoryEventGrid;