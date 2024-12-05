// Next and React Imports
import Link from "next/link"
import Image from "next/image"

// App Imports
import { Event } from "@/components/types"
import { formatEventDate } from "@/lib/eventUtils"

// Shadcn Imports
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface EventGridAttendanceTabsProps {
    attendingEvents: Event[];
    maybeEvents: Event[];
    notAttendingEvents: Event[];
    isLoading: boolean;
}

// Helper function to sort events by date and then alphabetically
function sortEvents(events: Event[]) {
    return events.sort((a, b) => {
        const dateA = new Date(a.startDate).getTime();
        const dateB = new Date(b.startDate).getTime();

        // Compare by date (most recent first)
        if (dateA !== dateB) {
            return dateB - dateA; // Reverse order for most recent first
        }

        // If the dates are the same, compare alphabetically by name
        return a.name.localeCompare(b.name);
    });
}

const EventGridAttendanceTabs = ({
    attendingEvents,
    maybeEvents,
    notAttendingEvents,
    isLoading,
}: EventGridAttendanceTabsProps) => {
    const sortedAttendingEvents = sortEvents(attendingEvents);
    const sortedMaybeEvents = sortEvents(maybeEvents);
    const sortedNotAttendingEvents = sortEvents(notAttendingEvents);

    if (isLoading) {
        return (
            <div className="p-4 space-y-2">
                <p className="text-sm text-muted-foreground">loading attending events...</p>
            </div>
        )
    }

    return (
        <div className="p-4 space-y-2">
            <div className="text-sm font-medium text-muted-foreground">attendance</div>

            <Tabs defaultValue="yes">
                <TabsList>
                    <TabsTrigger value="yes">yes</TabsTrigger>
                    <TabsTrigger value="maybe">maybe</TabsTrigger>
                    <TabsTrigger value="not">not</TabsTrigger>
                </TabsList>

                <TabsContent value="yes">
                    <EventList events={sortedAttendingEvents} />
                </TabsContent>

                <TabsContent value="maybe">
                    <EventList events={sortedMaybeEvents} />
                </TabsContent>

                <TabsContent value="not">
                    <EventList events={sortedNotAttendingEvents} />
                </TabsContent>
            </Tabs>
        </div>
    );
};

const EventList = ({ events }: { events: Event[] }) => {
    return events.length > 0 ? (
        <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-6">
            {events.map((event) => (
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
                        <div className="line-clamp-1 text-base font-semibold mt-1">{event.name}</div>
                        <div className="line-clamp-1 text-sm text-muted-foreground">
                            {formatEventDate(event.startDate, event.endDate)}
                        </div>
                    </Link>
                </div>
            ))}
        </div>
    ) : (
        <p className="text-sm text-muted-foreground">no attending events</p>
    );
};

export default EventGridAttendanceTabs;