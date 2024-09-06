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
import { Event as EventComponent } from "@/components/event"

// Shadcn Imports
import { Separator } from "@/components/ui/separator"

export default function CityPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const { city } = useParams();

    console.log(city)

    useEffect(() => {
        const fetchEvents = async () => {
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
            setEvents(eventList);
        };
    
        fetchEvents();
      }, []);

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
