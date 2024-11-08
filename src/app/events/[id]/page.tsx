// Next Imports
import { Metadata } from "next"
import { notFound } from "next/navigation"

// App Imports
import { Event } from "@/components/types"
import { EventDisplay } from "@/components/event-display"
import { TopBar } from "@/components/top-bar"
import Footer from "@/components/footer"

// Firebase Imports
import { doc, getDoc, updateDoc, increment } from "firebase/firestore"
import { db } from "@/lib/firebase"

// Shadcn Imports
import { Separator } from "@/components/ui/separator"
import { TooltipProvider } from "@/components/ui/tooltip"

type EventPageProps = {
    params: {
        id: string;
    };
};

const slugify = (name: string) => {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9\s]+/g, '')
        .replace(/\s+/g, '-');
};

// Define metadata for SEO
export async function generateMetadata({ params }: EventPageProps): Promise<Metadata> {
    const id = params.id;
    const eventDoc = doc(db, "events", id);
    const eventSnapshot = await getDoc(eventDoc);

    if (!eventSnapshot.exists()) {
        return {
            title: "Event Not Found",
            description: "The event you are looking for does not exist."
        };
    }

    const event = eventSnapshot.data() as Event;

    return {
        title: `happns | ${event.name}`,
        description: event.details,
        openGraph: {
            title: `happns | ${event.name}`,
            description: event.details,
            images: event.image,
            url: `https://ithappns.com/events/${id}`,
            type: "website"
        },
        twitter: {
            card: "summary_large_image",
            title: `happns | ${event.name}`,
            description: event.details,
            images: event.image
        }
    };
}

export default async function EventPage({ params }: EventPageProps) {
    const id = params.id;

    if (!id) {
        notFound();
    }

    const eventDoc = doc(db, "events", id);
    await updateDoc(eventDoc, { clicks: increment(1) });
    const eventSnapshot = await getDoc(eventDoc);

    if (!eventSnapshot.exists()) {
        notFound();
    }

    const eventData = eventSnapshot.data() as Event;
    const event = { ...eventData, id };

    return (
        <TooltipProvider>
            <div className="min-h-screen flex flex-col">
                <TopBar title={`happns/${slugify(event.name)}`} />
                <Separator />
                <div className="flex-1 overflow-y-auto">
                    <EventDisplay event={event} />
                </div>
                <Footer />
            </div>
        </TooltipProvider>
    );
};