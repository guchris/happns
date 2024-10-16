"use client"

// Next and React Imports
import Link from "next/link"
import Image from "next/image"
import { useState, useRef, useEffect } from "react"

// App Imports
import { useAuth } from "@/context/AuthContext"
import { City, Event } from "@/components/types"
import { calculateDistance } from "@/lib/geoUtils"
import { formatEventDate, getEventsByCity, getUpcomingEvents, getEventsHappeningToday, getEventsHappeningTomorrow, sortEventsByClicks } from "@/lib/eventUtils"

// Firebase Imports
import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"

// Shadcn Imports
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

type EventGridDynamicProps = {
    cities: City[];
};

const EventGridDynamic = ({ cities }: EventGridDynamicProps) => {
    const { user } = useAuth();

    const [cityName, setCityName] = useState<string>("");
    const [activeTab, setActiveTab] = useState("today");
    const tabsRef = useRef<HTMLDivElement | null>(null);

    const [userInteracted, setUserInteracted] = useState(false);
    const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
    const [topEvents, setTopEvents] = useState<Event[]>([]);

    const [isLoading, setIsLoading] = useState(true);

    // Function to find the closest city based on user location
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

    // Scroll the tabs list into view when the active tab changes, if needed
    useEffect(() => {
        if (userInteracted && tabsRef.current) {
            const { top } = tabsRef.current.getBoundingClientRect();
            if (top < 0 || top > 100) {
                window.scrollTo({
                    top: window.scrollY + top - 60,
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

    // Fetch events for designated city
    useEffect(() => {
        const fetchSelectedCity = async () => {
            let citySlug: string | null = null;

            // If user exists, fetch their selected city
            if (user) {
                try {
                    const userDocRef = doc(db, "users", user.uid);
                    const userDoc = await getDoc(userDocRef);

                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        citySlug = userData.selectedCity || null;
                    }
                } catch (error) {
                    console.error("Error fetching user selected city:", error);
                }
            }

            // If selectedCity is found, fetch its events
            if (citySlug) {
                setCityName(citySlug);
                const eventsByCity = await getEventsByCity(citySlug);
                const today = new Date();
                const upcomingEvents = getUpcomingEvents(eventsByCity, today);
                setUpcomingEvents(upcomingEvents);
                setTopEvents(sortEventsByClicks(upcomingEvents, 8));
                setIsLoading(false);
            } else if (navigator.geolocation) {
                // If no selected city, fall back to geolocation
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        const userLat = position.coords.latitude;
                        const userLon = position.coords.longitude;
                        const closestCitySlug = findClosestCity(userLat, userLon);
                        setCityName(closestCitySlug);

                        const eventsByCity = await getEventsByCity(closestCitySlug);
                        const today = new Date();
                        setUpcomingEvents(getUpcomingEvents(eventsByCity, today));
                        setTopEvents(sortEventsByClicks(eventsByCity, 8));
                        setIsLoading(false);
                    },
                    (error) => {
                        console.error("Error getting user location:", error);
                        setIsLoading(false);
                    }
                );
            }
        };

        fetchSelectedCity();
    }, [cities, user]);

    // Step 1: Get today's and tomorrow's dates in yyyy-mm-dd format
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const todayStr = today.toISOString().split("T")[0]; // Format to yyyy-mm-dd
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    // Step 2: Calculate weekend dates based on today’s day of the week
    const weekendDays: string[] = [];
    const dayOfWeek = today.getDay();

    let friday, saturday, sunday;

    if (dayOfWeek <= 4) { // Monday to Thursday
        friday = new Date(today);
        friday.setDate(today.getDate() + (5 - dayOfWeek));
        saturday = new Date(friday);
        saturday.setDate(friday.getDate() + 1);
        sunday = new Date(saturday);
        sunday.setDate(saturday.getDate() + 1);
    } else if (dayOfWeek === 5) { // Friday
        friday = today;
        saturday = new Date(today);
        saturday.setDate(today.getDate() + 1);
        sunday = new Date(today);
        sunday.setDate(today.getDate() + 2);
    } else if (dayOfWeek === 6) { // Saturday
        saturday = today;
        sunday = new Date(today);
        sunday.setDate(today.getDate() + 1);
    } else if (dayOfWeek === 0) { // Sunday
        sunday = today;
    }

    if (friday) weekendDays.push(friday.toISOString().split("T")[0]);
    if (saturday) weekendDays.push(saturday.toISOString().split("T")[0]);
    if (sunday) weekendDays.push(sunday.toISOString().split("T")[0]);

    // Step 3: Function to check each event's placement
    const getEventTabs = (event: Event) => {
        const eventStart = event.startDate; // Assuming format is 'yyyy-mm-dd'
        const eventEnd = event.endDate; // Assuming format is 'yyyy-mm-dd'
    
        // Today: Event includes today
        const isToday = eventStart <= todayStr && eventEnd >= todayStr;
    
        // Tomorrow: Event includes tomorrow
        const isTomorrow = eventStart <= tomorrowStr && eventEnd >= tomorrowStr;
    
        // This Weekend: Event includes any day of the weekend
        const isThisWeekend = weekendDays.some((weekendDay) => 
            eventStart <= weekendDay && eventEnd >= weekendDay
        );
    
        return { isToday, isTomorrow, isThisWeekend };
    };
    

    const filteredEvents = upcomingEvents.filter((event) => {
        const { isToday, isTomorrow, isThisWeekend } = getEventTabs(event);
    
        if (activeTab === "today") return isToday;
        if (activeTab === "tomorrow") return isTomorrow;
        if (activeTab === "weekend") return isThisWeekend;
    
        return false;
    });
    
    return (
        <div className="flex-1 max-w-[880px] md:max-w-[700px] lg:max-w-[880px] mx-auto p-4 space-y-4">
            
            {/* Header */}
            <div className="flex items-center space-x-2 text-xl font-semibold">
                <span>happnings in</span>
                <Badge variant="secondary" className="text-lg">{cityName}</Badge>
            </div>

            {/* Tabs */}
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
                        {isLoading ? <p className="text-sm text-muted-foreground">loading events...</p> : <EventList events={filteredEvents} />}
                    </TabsContent>

                    <TabsContent value="tomorrow">
                        {isLoading ? <p className="text-sm text-muted-foreground">loading events...</p> : <EventList events={filteredEvents} />}
                    </TabsContent>

                    <TabsContent value="weekend">
                        {isLoading ? <p className="text-sm text-muted-foreground">loading events...</p> : <EventList events={filteredEvents} />}
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
                <p className="text-sm text-muted-foreground">no events available</p>
            )}
        </div>
    )
}

export default EventGridDynamic;