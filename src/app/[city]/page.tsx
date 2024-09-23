"use client";

// React Imports
import { useEffect, useState } from "react"

// Next Imports
import { useParams } from "next/navigation"
import Head from "next/head"
import Link from "next/link"

// Firebase Imports
import { db } from "@/app/firebase"
import { collection, getDocs, query, where } from "firebase/firestore"

// Components Imports
import { TopBar } from "@/components/top-bar"
import { Footer } from "@/components/footer"
import { Event } from "@/components/types"

// Shadcn Imports
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
  

// Lib Imports
import { cityOptions } from "@/lib/selectOptions"

// Other Imports
import { isAfter, isSameDay, isSameMonth, addDays, parse } from "date-fns"

const eventCache: { [key: string]: Event[] } = {};

export default function CityPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [activeTab, setActiveTab] = useState('today');
    const params = useParams();

    const city = typeof params?.city === "string" ? params.city : "";
    const cityLabel = cityOptions.find(option => option.value === city)?.label || "City";

    useEffect(() => {
        const fetchEvents = async () => {
            if (!city) return;

            if (eventCache[city]) {
                console.log(`Using cached events for city: ${city}`);
                setEvents(eventCache[city]);
                return; // Skip fetching from Firestore
            }
            
            const eventsCol = collection(db, "events");
            const cityQuery = query(eventsCol, where("city", "==", city));
            const eventSnapshot = await getDocs(cityQuery);

            const eventList: Event[] = eventSnapshot.docs.map((doc) => ({
                category: doc.data().category,
                city: doc.data().city,
                clicks: doc.data().clicks,
                cost: doc.data().cost,
                date: doc.data().date,
                details: doc.data().details,
                format: doc.data().format,
                gmaps: doc.data().gmaps,
                id: doc.id,
                image: doc.data().image,
                link: doc.data().link,
                location: doc.data().location,
                name: doc.data().name,
                neighborhood: doc.data().neighborhood,
                time: doc.data().time,
            }));

            eventCache[city] = eventList; // Cache the fetched events for future use
            setEvents(eventList);
        };
    
        fetchEvents();
    }, [city]);

    // Get today's date
    const today = new Date();

    // Helper function to parse the event date string
    const parseEventDate = (dateString: string) => {
        if (dateString.includes("-")) {
            // Handle ranges like "MM/dd/yyyy - MM/dd/yyyy"
            const [startPart, endPart] = dateString.split(" - ");
            const startDate = parse(startPart.trim(), "MM/dd/yyyy", new Date());
            const endDate = parse(endPart.trim(), "MM/dd/yyyy", startDate);
            return { startDate, endDate };
        } else {
            // Handle single dates like "MM/dd/yyyy"
            const date = parse(dateString, "MM/dd/yyyy", new Date());
            return { startDate: date, endDate: date };
        }
    };

    // Filter events happening today or later, and within the current month
    const upcomingEvents = events.filter((event) => {
        const { startDate, endDate } = parseEventDate(event.date);
        return isAfter(endDate, today) && isSameMonth(startDate, today);
    });

    // Filter events happening today
    const eventsHappeningToday = events.filter((event) => {
        const { startDate } = parseEventDate(event.date);
        return isSameDay(startDate, today);
    });

    // Filter events happening tomorrow
    const eventsHappeningTomorrow = events.filter((event) => {
        const { startDate } = parseEventDate(event.date);
        return isSameDay(startDate, addDays(today, 1));
    });

    // Sort the events by clicks in descending order and take the top 5 for the month
    const topEvents = upcomingEvents
        .sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
        .slice(0, 8);

    // Filter events based on the active tab
    const filteredEvents = activeTab === 'today'
      ? eventsHappeningToday
      : activeTab === 'tomorrow'
      ? eventsHappeningTomorrow
      : topEvents; // For "this month" tab

    return (
        <div className="min-h-screen flex flex-col">
            <Head>
                <title>{`happns | events in ${cityLabel}`}</title>
                <meta name="description" content={`explore curated events happening in ${cityLabel}`} />
                <meta property="og:title" content={`happns | events in ${cityLabel}`} />
                <meta property="og:description" content={`explore curated events happening in ${cityLabel}`} />
                <meta property="og:image" content={`https://ithappns.com/covers/cover-${city}.png`} /> {/* Replace with your image URL */}
                <meta property="og:url" content={`https://ithappns.com/${city}`} />
                <meta property="og:type" content="website" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={`happns | events in ${cityLabel}`} />
                <meta name="twitter:description" content={`explore curated events happening in ${cityLabel}`} />
                <meta name="twitter:image" content={`https://ithappns.com/covers/cover-${city}.png`} /> {/* Replace with your image URL */}
            </Head>

            <TopBar title={`happns/${city}`} />
            <Separator />

            <div className="flex-1 overflow-y-auto">

                {/* Hero Section */}
                <div className="bg-gray-100 py-24">
                    <div className="flex flex-col max-w-[1000px] mx-auto space-y-8 px-4 lg:flex-row lg:space-x-12 items-center">
                        
                        {/* Left Section: City Title and Description */}
                        <div className="lg:w-1/2 space-y-4">
                            <div>
                                <h2 className="text-lg font-bold">Events in</h2>
                                <h1 className="text-4xl font-black">{cityLabel}</h1>
                            </div>
                            <p className="text-base text-muted-foreground">
                                Explore a curated selection of {cityLabel}&#39;s best events and easily plan outings with your friends or discover new connections along the way. From exclusive experiences to hidden gems, happns helps you find the perfect events.
                            </p>
                            <Link href={`/${city}/explore`}>
                                <Button variant="outline" className="mt-4">Explore {cityLabel} Events</Button>
                            </Link>
                        </div>

                        {/* Right Section: City Image */}
                        <div className="lg:w-1/2">
                            <img
                                src={`/covers/cover-${city}.png`} 
                                alt={`${cityLabel} cover image`} 
                                className="rounded-lg object-cover w-full h-auto"
                            />
                        </div>
                    </div>
                </div>

                {/* Events Section */}
                <div className="flex flex-col max-w-[1000px] mx-auto space-y-8 px-4 py-16">

                    <div className="space-y-2">
                        {/* Events Happening Today */}
                        <div className="space-y-1">
                            <h2 className="text-lg font-semibold tracking-tight">happnings</h2>
                        </div>

                        <Tabs defaultValue="today" onValueChange={setActiveTab}>
                            <div className="mb-4">
                                <TabsList>
                                    <TabsTrigger value="today">Today</TabsTrigger>
                                    <TabsTrigger value="tomorrow">Tomorrow</TabsTrigger>
                                    <TabsTrigger value="month">This Month</TabsTrigger>
                                </TabsList>
                            </div>

                            <TabsContent value="today">
                                {/* Grid of Events for Today */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    {filteredEvents.length > 0 ? (
                                        filteredEvents.map((event) => (
                                            <Card key={event.id} className="w-full">
                                                <Link href={`/events/${event.id}`}>
                                                    <CardHeader className="p-2">
                                                        <div className="aspect-w-1 aspect-h-1 w-full">
                                                            <img
                                                                src={event.image}
                                                                alt={event.name}
                                                                className="object-cover w-full h-full rounded-lg"
                                                            />
                                                        </div>
                                                        <CardTitle className="text-sm font-semibold mt-2">{event.name}</CardTitle>
                                                        <CardDescription className="text-xs text-muted-foreground">{event.date}</CardDescription>
                                                    </CardHeader>
                                                </Link>
                                            </Card>
                                        ))
                                    ) : (
                                        <p className="text-sm text-muted-foreground">No events</p>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="tomorrow">
                                {/* Grid of Events for Tomorrow */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    {filteredEvents.length > 0 ? (
                                        filteredEvents.map((event) => (
                                            <Card key={event.id} className="w-full">
                                                <Link href={`/events/${event.id}`}>
                                                    <CardHeader className="p-2">
                                                        <div className="aspect-w-1 aspect-h-1 w-full">
                                                            <img
                                                                src={event.image}
                                                                alt={event.name}
                                                                className="object-cover w-full h-full rounded-lg"
                                                            />
                                                        </div>
                                                        <CardTitle className="text-sm font-semibold mt-2">{event.name}</CardTitle>
                                                        <CardDescription className="text-xs text-muted-foreground">{event.date}</CardDescription>
                                                    </CardHeader>
                                                </Link>
                                            </Card>
                                        ))
                                    ) : (
                                        <p className="text-sm text-muted-foreground">No events</p>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="month">
                                {/* Grid of Events for This Month */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    {filteredEvents.length > 0 ? (
                                        filteredEvents.map((event) => (
                                            <Card key={event.id} className="w-full">
                                                <Link href={`/events/${event.id}`}>
                                                    <CardHeader className="p-2">
                                                        <div className="aspect-w-1 aspect-h-1 w-full">
                                                            <img
                                                                src={event.image}
                                                                alt={event.name}
                                                                className="object-cover w-full h-full rounded-lg"
                                                            />
                                                        </div>
                                                        <CardTitle className="text-sm font-semibold mt-2">{event.name}</CardTitle>
                                                        <CardDescription className="text-xs text-muted-foreground">{event.date}</CardDescription>
                                                    </CardHeader>
                                                </Link>
                                            </Card>
                                        ))
                                    ) : (
                                        <p className="text-sm text-muted-foreground">No events</p>
                                    )}
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>
            
            <Footer />
        </div>
    );
}
