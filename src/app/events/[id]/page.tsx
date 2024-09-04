"use client";

// React Imports
import { useEffect, useState } from "react";

// Next Imports
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

// Firebase Imports
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/app/firebase";

// Components Imports
import { Event } from "@/components/types";
import { EventDisplay } from "@/components/event-display";

// Shadcn Imports
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";

// Icon Imports
import { PlusCircledIcon } from "@radix-ui/react-icons"

const slugify = (name: string) => {
    return name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '');
};

const EventPage = () => {
    const [event, setEvent] = useState<Event | null>(null);
    const { id } = useParams();
    const router = useRouter();

    useEffect(() => {
        const fetchEvent = async () => {
            if (id) {
                const eventDoc = doc(db, "events", id as string);
                const eventSnapshot = await getDoc(eventDoc);
                console.log(`Fetching event with ID: ${id}`);

                if (eventSnapshot.exists()) {
                    const eventData = eventSnapshot.data() as Event;
                    setEvent({
                        ...eventData
                    });
                }
            }
        };
        fetchEvent();
    }, [id]);

    if (!event) {
        return <div>Loading event...</div>; 
    }

    return (
        <TooltipProvider>
            <div className="h-screen flex flex-col">
                <div className="w-full flex items-center justify-between py-4 px-4 h-14 sticky top-0 z-10 bg-white">
                    <h2 className="text-lg font-semibold">
                        <Link href="/">happns</Link>
                        /{slugify(event.name)}
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
                    <EventDisplay event={event} onBack={() => router.back()} />
                </div>
            </div>
        </TooltipProvider>
    );

};

export default EventPage;