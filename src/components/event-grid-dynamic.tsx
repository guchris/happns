"use client"

// Next and React Imports
import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"

// App Imports
import { Event } from "@/components/types"
import { formatEventDate, getEventsByCity, getUpcomingEvents, getEventsHappeningToday, getEventsHappeningTomorrow, sortEventsByClicks } from "@/lib/eventUtils"
import { calculateDistance } from "@/lib/geoUtils"

// Shadcn Imports
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

// EventGridDynamic Props
type EventGridDyanmicProps = {
    cities: { name: string; slug: string; lat: number; lon: number }[];
};

const EventGridDynamic = ({ cities }: EventGridDyanmicProps) => {
    const [activeTab, setActiveTab] = useState("today");
    const tabsRef = useRef<HTMLDivElement | null>(null);
    const [userInteracted, setUserInteracted] = useState(false);
    const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
    const [eventsHappeningToday, setEventsHappeningToday] = useState<Event[]>([]);
    const [eventsHappeningTomorrow, setEventsHappeningTomorrow] = useState<Event[]>([]);
    const [topEvents, setTopEvents] = useState<Event[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Scroll the tabs list into view when the active tab changes, if needed
    useEffect(() => {
        if (userInteracted && tabsRef.current) {
            const { top } = tabsRef.current.getBoundingClientRect();
            if (top < 0 || top > 100) {
                window.scrollTo({
                    top: window.scrollY + top - 45,
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

    // Geolocation logic to find the closest city and fetch its events
    useEffect(() => {
        const findClosestCity = (userLat: number, userLon: number) => {
            let closestCity = cities[0];
            let minDistance = calculateDistance(userLat, userLon, cities[0].lat, cities[0].lon);

            cities.forEach((city) => {
                const distance = calculateDistance(userLat, userLon, city.lat, city.lon);
                if (distance < minDistance) {
                    closestCity = city;
                    minDistance = distance;
                }
            });

            return closestCity.slug;
        };

        if (navigator.geolocation) {
            setIsLoading(true);
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const userLat = position.coords.latitude;
                    const userLon = position.coords.longitude;
                    const closestCitySlug = findClosestCity(userLat, userLon);

                    // Fetch events for the closest city
                    const eventsByCity = await getEventsByCity(closestCitySlug);
                    const today = new Date();
                    setUpcomingEvents(getUpcomingEvents(eventsByCity, today))
                    setEventsHappeningToday(getEventsHappeningToday(eventsByCity, today));
                    setEventsHappeningTomorrow(getEventsHappeningTomorrow(eventsByCity, today));
                    setTopEvents(sortEventsByClicks(upcomingEvents, 8));
                    setIsLoading(false);
                },
                (error) => {
                    console.error("Error getting user location:", error);
                    setIsLoading(false); // If geolocation fails, show "no events available" or handle error gracefully
                }
            );
        }
    }, [cities]);

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
                    {isLoading ? <p className="text-sm text-muted-foreground">Loading events...</p> : <EventList events={filteredEvents} />}
                </TabsContent>

                <TabsContent value="tomorrow">
                    {isLoading ? <p className="text-sm text-muted-foreground">Loading events...</p> : <EventList events={filteredEvents} />}
                </TabsContent>

                <TabsContent value="month">
                    {isLoading ? <p className="text-sm text-muted-foreground">Loading events...</p> : <EventList events={filteredEvents} />}
                </TabsContent>
            </Tabs>
        </div>
    )
}

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
    )
}

export default EventGridDynamic;