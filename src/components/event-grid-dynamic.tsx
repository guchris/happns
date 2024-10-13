"use client"

// Next and React Imports
import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"

// App Imports
import { Event, City } from "@/components/types"
import { calculateDistance } from "@/lib/geoUtils"
import { formatEventDate, getEventsByCity, getUpcomingEvents, getEventsHappeningToday, getEventsHappeningTomorrow, sortEventsByClicks } from "@/lib/eventUtils"

// Shadcn Imports
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

interface EventGridDynamicProps {
    cities: City[];
    initialCity: string;
}

const EventGridDynamic = ({ cities, initialCity }: EventGridDynamicProps) => {
    const [selectedCity, setSelectedCity] = useState<string>(initialCity);
    const [activeTab, setActiveTab] = useState("today");
    const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
    const [eventsHappeningToday, setEventsHappeningToday] = useState<Event[]>([]);
    const [eventsHappeningTomorrow, setEventsHappeningTomorrow] = useState<Event[]>([]);
    const [topEvents, setTopEvents] = useState<Event[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const tabsRef = useRef<HTMLDivElement | null>(null);
    const [userInteracted, setUserInteracted] = useState(false);

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

    // Reset after scrolling
    useEffect(() => {
        if (userInteracted) {
            setUserInteracted(false);
        }
    }, [userInteracted]);

    // Determine the closest city based on geolocation
    useEffect(() => {
        if (initialCity) {
            // Use the user's default city if it’s set
            setSelectedCity(initialCity);
        } else if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const userLat = position.coords.latitude;
                    const userLon = position.coords.longitude;
                    let closestCity = cities[0];
                    let minDistance = calculateDistance(userLat, userLon, cities[0].lat, cities[0].lon);
    
                    cities.forEach((city) => {
                        const distance = calculateDistance(userLat, userLon, city.lat, city.lon);
                        if (distance < minDistance) {
                            closestCity = city;
                            minDistance = distance;
                        }
                    });
    
                    setSelectedCity(closestCity.slug);
                },
                () => {
                    // Fallback city if geolocation fails and no user city is set
                    setSelectedCity("seattle");
                }
            );
        } else {
            // If geolocation is not supported and no user city is set
            setSelectedCity("seattle");
        }
    }, [cities, initialCity]);

    // Fetch events whenever `selectedCity` changes
    useEffect(() => {
        const fetchEvents = async () => {
            if (!selectedCity) return;
            setIsLoading(true);

            const eventsByCity = await getEventsByCity(selectedCity);
            const today = new Date();
            const upcomingEvents = getUpcomingEvents(eventsByCity, today);
            setUpcomingEvents(upcomingEvents);
            setEventsHappeningToday(getEventsHappeningToday(eventsByCity, today));
            setEventsHappeningTomorrow(getEventsHappeningTomorrow(eventsByCity, today));
            setTopEvents(sortEventsByClicks(upcomingEvents, 8));
            
            setIsLoading(false);
        };

        fetchEvents();
    }, [selectedCity]);

    // Select events based on the active tab
    const filteredEvents = activeTab === "today"
        ? eventsHappeningToday
        : activeTab === "tomorrow"
        ? eventsHappeningTomorrow
        : topEvents;
    
    return (
        <div className="flex-1 max-w-[880px] md:max-w-[700px] lg:max-w-[880px] mx-auto p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center space-x-2 text-xl font-semibold">
                <span>happnings in</span>
                <span className="text-lg font-bold">{cities.find(city => city.slug === selectedCity)?.name || "your city"}</span>
            </div>

            {/* Tabs */}
            <div className="space-y-4">
                <Tabs
                    value={activeTab}
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
        </div>
    )
}

// EventList Component for displaying the list of events
const EventList = ({ events }: { events: Event[] }) => {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
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