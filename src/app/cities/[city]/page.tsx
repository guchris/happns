"use client";

// React Imports
import { useEffect, useState } from "react";

// Next Imports
import Link from "next/link";
import { useParams } from "next/navigation";

// Firebase Imports
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/app/firebase";

// Components Imports
import { Event } from "@/components/types";

// Shadcn Imports
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button";
import { Event as EventComponent } from "@/components/event"

// Icon Imports
import { PlusCircledIcon } from "@radix-ui/react-icons"

export default function CityPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const { city } = useParams();

    useEffect(() => {
        const fetchEvents = async () => {
          const eventsCol = collection(db, "events");
          const eventSnapshot = await getDocs(eventsCol);
          const eventList: Event[] = eventSnapshot.docs.map((doc) => ({
            category: doc.data().category,
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
            <div className="w-full flex items-center justify-between py-4 px-4 h-14 sticky top-0 z-10 bg-white">
                <h2 className="text-lg font-semibold">
                    <Link href="/">happns</Link>
                    /{city}
                </h2>
                <Button>
                    <PlusCircledIcon className="mr-2 h-4 w-4" />
                    <Link href="/event-form">
                        Add event
                    </Link>
                </Button>
            </div>
            <Separator />
            <div className="flex-1 overflow-y-auto">
                <EventComponent
                    events={events}
                />
            </div>
        </div>
    );
}
