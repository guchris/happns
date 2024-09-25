"use client"

// Next and React Imports
import { useState } from "react"
import Link from "next/link"

// App Imports
import { Event } from "@/components/types"
import { formatEventDate } from "@/lib/eventUtils"

// Shadcn Imports
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

type EventGridProps = {
    eventsHappeningToday: Event[];
    eventsHappeningTomorrow: Event[];
    topEvents: Event[];
};

const EventGrid = ({ eventsHappeningToday, eventsHappeningTomorrow, topEvents }: EventGridProps) => {
    const [activeTab, setActiveTab] = useState("today");

    // Select events based on the active tab
    const filteredEvents = activeTab === "today"
        ? eventsHappeningToday
        : activeTab === "tomorrow"
        ? eventsHappeningTomorrow
        : topEvents;

    return (
        <div className="space-y-4">
            <Tabs defaultValue="today" onValueChange={setActiveTab}>
                <div className="mb-4">
                    <TabsList>
                        <TabsTrigger value="today">Today</TabsTrigger>
                        <TabsTrigger value="tomorrow">Tomorrow</TabsTrigger>
                        <TabsTrigger value="month">This Month</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="today">
                    <EventList events={filteredEvents} />
                </TabsContent>

                <TabsContent value="tomorrow">
                    <EventList events={filteredEvents} />
                </TabsContent>

                <TabsContent value="month">
                    <EventList events={filteredEvents} />
                </TabsContent>
            </Tabs>
        </div>
    );
};

// EventList Component for displaying the list of events
const EventList = ({ events }: { events: Event[] }) => {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {events.length > 0 ? (
                events.map((event) => (
                    <Card key={event.id} className="w-full">
                        <Link href={`/events/${event.id}`} className="no-underline">
                            <CardHeader className="p-2">
                                <div className="aspect-w-1 aspect-h-1 w-full">
                                    <img
                                        src={event.image || "/tempFlyer1.svg"}
                                        alt={event.name}
                                        className="object-cover w-full h-full rounded-lg"
                                    />
                                </div>
                                <CardTitle className="line-clamp-1 text-sm font-semibold mt-2">{event.name}</CardTitle>
                                <CardDescription className="text-xs text-muted-foreground">{formatEventDate(event.startDate, event.endDate)}</CardDescription>
                            </CardHeader>
                        </Link>
                    </Card>
                ))
            ) : (
                <p className="text-sm text-muted-foreground">No events available.</p>
            )}
        </div>
    );
};

export default EventGrid;