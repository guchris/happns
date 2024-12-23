"use client"

// Next and React Imports
import Link from "next/link"
import Image from "next/image"
import { useState, useRef, useEffect } from "react"

// App Imports
import { Event } from "@/components/types"
import { sortEventsByDateAndName, formatEventDate, getTodayAndTomorrow, getWeekendDays, getEventTabs } from "@/lib/eventUtils"

// Shadcn Imports
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

type EventGridProps = {
    events: Event[];
};

const EventGrid = ({ events }: EventGridProps) => {
    const [activeTab, setActiveTab] = useState("today");
    const tabsRef = useRef<HTMLDivElement | null>(null);
    const [userInteracted, setUserInteracted] = useState(false);

    // Get today's and tomorrow's dates and weekend days
    const { todayStr, tomorrowStr } = getTodayAndTomorrow();
    const weekendDays = getWeekendDays();

    // Filter and sort events based on the active tab
    const filteredEvents = sortEventsByDateAndName(
        events.filter((event) => {
            const { isToday, isTomorrow, isThisWeekend } = getEventTabs(event, todayStr, tomorrowStr, weekendDays);

            if (activeTab === "today") return isToday;
            if (activeTab === "tomorrow") return isTomorrow;
            if (activeTab === "weekend") return isThisWeekend;

            return false;
        })
    );

    // Scroll the tabs list into view when the active tab changes, if needed
    useEffect(() => {
        if (userInteracted && tabsRef.current) {
            const { top } = tabsRef.current.getBoundingClientRect();
            if (top < 0 || top > 100) { // Adjust threshold as needed
                window.scrollTo({
                    top: window.scrollY + top - 60, // Scroll to tabs position with a small offset
                    behavior: "smooth",
                });
            }
        }
    }, [activeTab, userInteracted]);

    // Reset after scrolling
    useEffect(() => {
        if (userInteracted) {
            setUserInteracted(false);
        }
    }, [userInteracted]);

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
                        <TabsTrigger value="today">today</TabsTrigger>
                        <TabsTrigger value="tomorrow">tomorrow</TabsTrigger>
                        <TabsTrigger value="weekend">this weekend</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="today">
                    <EventList events={filteredEvents} />
                </TabsContent>

                <TabsContent value="tomorrow">
                    <EventList events={filteredEvents} />
                </TabsContent>

                <TabsContent value="weekend">
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
                ))
            ) : (
                <p className="text-sm text-muted-foreground">no events available</p>
            )}
        </div>
    );
};

export default EventGrid;