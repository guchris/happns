"use client";

// React Imports
import { useEffect, useState } from "react"

// Next Imports
import { useParams, useRouter } from "next/navigation"

// Firebase Imports
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/app/firebase"

// Components Imports
import { Event } from "@/components/types"
import { EventDisplay } from "@/components/event-display"
import { TopBar } from "@/components/top-bar"
import { Footer } from "@/components/footer"

// Shadcn Imports
import { Separator } from "@/components/ui/separator"
import { TooltipProvider } from "@/components/ui/tooltip"

const slugify = (name: string) => {
    return name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '');
};

const eventCache: { [id: string]: Event } = {};

const EventPage = () => {
    const [event, setEvent] = useState<Event | null>(null);
    const params = useParams();
    const id = typeof params?.id === "string" ? params.id : null;
    const router = useRouter();

    useEffect(() => {
        const scrollContainer = document.querySelector('.scrollable-container'); // Replace with your container's selector
        if (scrollContainer) {
            scrollContainer.scrollTo(0, 0);
        } else {
            window.scrollTo(0, 0);
        }
    }, []);

    useEffect(() => {
        const fetchEvent = async () => {
            if (!id) return;

             // Check if the event is cached
             if (eventCache[id]) {
                console.log(`Using cached event data for ID: ${id}`);
                setEvent(eventCache[id]);
                return;
            }

            // Fetch the event from Firestore
            console.log(`Fetching event with ID: ${id}`);
            const eventDoc = doc(db, "events", id as string);
            const eventSnapshot = await getDoc(eventDoc);

            if (eventSnapshot.exists()) {
                const eventData = eventSnapshot.data() as Event;

                // Cache the fetched event
                eventCache[id] = eventData;

                setEvent(eventData);
            }
        };
        fetchEvent();
    }, [id]);

    if (!event) {
        return (
            <TooltipProvider>
                <div className="min-h-screen flex flex-col">
                    <TopBar title={`happns/`} />
                    <Separator />
                    <div className="flex-1 overflow-y-auto p-4">
                        Loading event...
                    </div>
                </div>
            </TooltipProvider>
        )
    }

    return (
        <TooltipProvider>
            <div className="min-h-screen flex flex-col">
                <TopBar title={`happns/${slugify(event.name)}`} />
                <Separator />
                <div className="flex-1 overflow-y-auto">
                    <EventDisplay event={event} onBack={() => router.back()} />
                </div>
                <Footer />
            </div>
        </TooltipProvider>
    );

};

export default EventPage;