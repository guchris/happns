"use client";

// React Imports
import { useEffect, useState } from "react";

// Next Imports
import { useParams } from "next/navigation";
import Link from "next/link";

// Firebase Imports
import { db } from "@/app/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

// Components Imports
import { TopBar } from "@/components/top-bar";
import { Event } from "@/components/types";

// Shadcn Imports
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
  

// Lib Imports
import { cityOptions } from "@/lib/selectOptions";

// Other Imports
import { isAfter, isSameMonth, parse, isWithinInterval, isToday } from "date-fns";

const eventCache: { [key: string]: Event[] } = {};

export default function CityPage() {
    const [events, setEvents] = useState<Event[]>([]);
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
                description: doc.data().description,
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

        // Check if the event happens today or later, and if it's in the current month
        const isInDateRange = isAfter(endDate, today) || isWithinInterval(today, { start: startDate, end: endDate });
        const isInCurrentMonth = isSameMonth(startDate, today);

        return isInDateRange && isInCurrentMonth;
    });

    // Filter events happening today
    const eventsHappeningToday = events.filter((event) => {
        const { startDate, endDate } = parseEventDate(event.date);
        return isToday(startDate) || isToday(endDate);
    });


    // Sort the events by clicks in descending order and take the top 5
    const topEvents = upcomingEvents
        .sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
        .slice(0, 5);

    return (
        <div className="h-screen flex flex-col">
            <TopBar title={`happns/${city}`} />
            <Separator />

            <div className="flex-1 overflow-y-auto">

                {/* Hero Section */}
                <div className="bg-gray-100 py-24">
                    <div className="flex flex-col max-w-[1000px] mx-auto space-y-8 px-4 py-8 lg:flex-row lg:space-x-12 items-center">
                        
                        {/* Left Section: City Title and Description */}
                        <div className="lg:w-1/2 space-y-4">
                            <div>
                                <h2 className="text-lg font-bold">Events in</h2>
                                <h1 className="text-4xl font-black">{cityLabel}</h1>
                            </div>
                            <p className="text-base text-muted-foreground">
                                Explore a curated selection of {cityLabel}'s best events and easily plan outings with your friends or discover new connections along the way. From exclusive experiences to hidden gems, happns helps you find the perfect events.
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
                            <h2 className="text-lg font-semibold tracking-tight">
                                Happening Today
                            </h2>
                            <p className="text-sm">
                                Top events in {cityLabel} happening today.
                            </p>
                        </div>

                        {/* Grid of Event Cards for Happening Today */}
                        <div className="overflow-x-auto scrollbar-none">
                            <div className="flex space-x-4 min-w-full">
                                {eventsHappeningToday.length > 0 ? (
                                    eventsHappeningToday.map((event) => (
                                        <Card key={event.id} className="min-w-[200px] max-w-[250px]">
                                            <Link href={`/events/${event.id}`}>
                                                <CardHeader className="p-2">
                                                    <div className="aspect-w-1 aspect-h-1 w-full">
                                                        <img
                                                            src={event.image || "/default-event.png"}
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
                                    <p className="text-sm text-muted-foreground">No events happening today</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {/* Events Happening This Month */}
                        <div className="space-y-1">
                            <h2 className="text-lg font-semibold tracking-tight">
                                Happening This Month
                            </h2>
                            <p className="text-sm">
                                Top events in {cityLabel} happening this month.
                            </p>
                        </div>

                        {/* Grid of Event Cards */}
                        <div className="overflow-x-auto scrollbar-none">
                            <div className="flex space-x-4 min-w-full">
                                {topEvents.length > 0 ? (
                                    topEvents.map((event) => (
                                        <Card key={event.id} className="min-w-[200px] max-w-[250px]">
                                            <Link href={`/events/${event.id}`}>
                                                <CardHeader className="p-2">
                                                    <div className="aspect-w-1 aspect-h-1 w-full">
                                                        <img
                                                            src={event.image || "/default-event.png"}
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
                                    <p className="text-sm text-muted-foreground">No upcoming events this month</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
