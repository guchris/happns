"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { useParams } from "next/navigation";

import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button";
import { Event as EventComponent } from "@/components/event"

import { PlusCircledIcon } from "@radix-ui/react-icons"

import { collection, getDocs } from "firebase/firestore";
import { db } from "@/app/firebase";
import { Event } from "@/app/types";

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
        <>
            <div className="flex h-full flex-col">
                <div className="w-full flex items-center justify-between py-4 px-4 h-14">
                    <h2 className="text-lg font-semibold">
                        <Link href="/">happns</Link>
                        /{city}
                    </h2>
                    <Button>
                        <PlusCircledIcon className="mr-2 h-4 w-4" />
                        <Link href="https://airtable.com/app0fFoxhSVvQHNmo/pag41f358zYRYELLj/form" target="_blank">
                            Add event
                        </Link>
                    </Button>
                </div>
                <Separator />
                <EventComponent
                    events={events}
                />
            </div>
        </>
    );
}
