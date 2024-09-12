"use client";

// React Imports
import { useEffect, useState } from "react";

// Next Imports
import { useParams } from "next/navigation";

// Firebase Imports
import { db } from "@/app/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

// Components Imports
import { TopBar } from "@/components/top-bar";
import { Event } from "@/components/types";
import { Event as EventComponent } from "@/components/event";

// Shadcn Imports
import { Separator } from "@/components/ui/separator";

const eventCache: { [key: string]: Event[] } = {};

export default function CityPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const params = useParams();

    // Ensure city is a string
    const city = typeof params?.city === "string" ? params.city : "";

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

    return (
        <div className="h-screen flex flex-col">
            <TopBar title={`happns/${city}`} />
            <Separator />
            <div className="flex-1 overflow-y-auto">
                <EventComponent
                    events={events}
                />
            </div>
        </div>
    );
}
