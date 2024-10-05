"use client"

// Next and React Imports
import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"

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
    const tabsRef = useRef<HTMLDivElement | null>(null);
    const [userInteracted, setUserInteracted] = useState(false);

    // Scroll the tabs list into view when the active tab changes, if needed
    useEffect(() => {
        if (userInteracted && tabsRef.current) {
            const { top } = tabsRef.current.getBoundingClientRect();
            if (top < 0 || top > 100) { // Adjust threshold as needed
                window.scrollTo({
                    top: window.scrollY + top - 45, // Scroll to tabs position with a small offset
                    behavior: "smooth",
                });
            }
        }
    }, [activeTab, userInteracted]);

    useEffect(() => {
        if (userInteracted) {
            setUserInteracted(false); // Reset after scrolling
        }
    }, [userInteracted]);

    // Select events based on the active tab
    const filteredEvents = activeTab === "today"
        ? eventsHappeningToday
        : activeTab === "tomorrow"
        ? eventsHappeningTomorrow
        : topEvents;

    return (
        <div className="space-y-4">
            <Tabs
                defaultValue="today"
                onValueChange={(value) => {
                    setActiveTab(value);
                    setUserInteracted(true);
                }}
            >
                <div ref={tabsRef} className="mb-4">
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
                <p className="text-sm text-muted-foreground">No events available.</p>
            )}
        </div>
    );
};

export default EventGrid;