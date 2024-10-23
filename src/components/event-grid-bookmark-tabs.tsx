// Next and React Imports
import Link from "next/link"
import Image from "next/image"

// App Imports
import { Event } from "@/components/types"
import { formatEventDate } from "@/lib/eventUtils"

// Shadcn Imports
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"


interface EventGridBookmarkTabsProps {
    bookmarkedEvents: Event[];
}

// Helper function to sort upcoming events by closest date and then alphabetically
function sortUpcomingEvents(events: Event[]) {
    return events.sort((a, b) => {
        const dateA = new Date(a.startDate).getTime();
        const dateB = new Date(b.startDate).getTime();

        // First, compare by date (closest upcoming first)
        if (dateA !== dateB) {
            return dateA - dateB;
        }

        // If the dates are the same, compare alphabetically by name
        return a.name.localeCompare(b.name);
    });
}


// Helper function to sort past events by most recently passed and then alphabetically
function sortPastEvents(events: Event[]) {
    return events.sort((a, b) => {
        const dateA = new Date(a.endDate).getTime();
        const dateB = new Date(b.endDate).getTime();

        // First, compare by date (most recently passed first)
        if (dateA !== dateB) {
            return dateB - dateA; // Reverse order to get most recent first
        }

        // If the dates are the same, compare alphabetically by name
        return a.name.localeCompare(b.name);
    });
}

function filterUpcomingEvents(events: Event[]) {
    const today = new Date().toISOString().split('T')[0];

    return events.filter(event => {
        const startDate = event.startDate;
        const endDate = event.endDate;
        
        return startDate >= today || (startDate <= today && endDate >= today);
    });
}

function filterPastEvents(events: Event[]) {
    const today = new Date().toISOString().split('T')[0];

    return events.filter(event => {
        const endDate = event.endDate;

        return endDate < today;
    });
}

const EventGridBookmarkTabs = ({ bookmarkedEvents }: EventGridBookmarkTabsProps) => {
    const upcomingEvents = sortUpcomingEvents(filterUpcomingEvents(bookmarkedEvents));
    const pastEvents = sortPastEvents(filterPastEvents(bookmarkedEvents));

    return (
        <div className="p-4 space-y-2">
            <div className="text-sm font-medium text-muted-foreground">bookmarked events</div>

            <Tabs defaultValue="upcoming">
                <TabsList>
                    <TabsTrigger value="upcoming">upcoming</TabsTrigger>
                    <TabsTrigger value="past">past</TabsTrigger>
                </TabsList>

                <TabsContent value="upcoming">
                    <EventList events={upcomingEvents} />
                </TabsContent>

                <TabsContent value="past">
                    <EventList events={pastEvents} />
                </TabsContent>
            </Tabs>
        </div>
    )
}


const EventList = ({ events }: { events: Event[] }) => {
    return events.length > 0 ? (
        <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {events.map(event => (
                <div key={event.id} className="w-full">
                    <Link href={`/events/${event.id}`} className="no-underline">
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
                        <div className="line-clamp-1 text-base font-semibold mt-2">{event.name}</div>
                        <div className="line-clamp-1 text-sm text-muted-foreground">
                            {formatEventDate(event.startDate, event.endDate)}
                        </div>
                    </Link>
                </div>
            ))}
        </div>
    ) : (
        <p className="text-sm text-muted-foreground">no bookmarked events</p>
    );
};

export default EventGridBookmarkTabs;