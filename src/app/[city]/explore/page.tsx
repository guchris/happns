// Next Imports
import { Metadata } from "next"
import { notFound } from "next/navigation"

// App Imports
import { TopBar } from "@/components/top-bar"
import { Event as EventType } from "@/components/types"
import { Event as EventComponent } from "@/components/event"
import { cityOptions } from "@/lib/selectOptions"
import { mapFirestoreEvent } from "@/lib/eventUtils"

// Firebase Imports
import { db } from "@/lib/firebase"
import { collection, getDocs, query, where } from "firebase/firestore"

// Shadcn Imports
import { Separator } from "@/components/ui/separator"

type ExploreCityPageProps = {
    params: {
        city: string;
    };
};

// Metadata for SEO
export async function generateMetadata({ params }: ExploreCityPageProps): Promise<Metadata> {
    const city = params.city || "";
    const cityLabel = cityOptions.find(option => option.value === city)?.label || "City";

    return {
        title: `happns | explore events in ${cityLabel}`,
        description: `discover and explore curated events happening in ${cityLabel}`,
        openGraph: {
            title: `happns | explore events in ${cityLabel}`,
            description: `discover and explore curated events happening in ${cityLabel}`,
            images: [`https://ithappns.com/covers/cover-${city}.png`],
            url: `https://ithappns.com/${city}/explore`,
            type: "website",
        },
        twitter: {
            card: "summary_large_image",
            title: `happns | explore events in ${cityLabel}`,
            description: `discover and explore curated events happening in ${cityLabel}`,
            images: [`https://ithappns.com/covers/cover-${city}.png`],
        },
    };
}

export default async function ExploreCityPage({ params }: ExploreCityPageProps) {
    const city = params.city || "";

    if (!city) {
        notFound();
    }

    // Fetch events from Firestore
    const eventsCol = collection(db, "events");
    const cityQuery = query(eventsCol, where("city", "==", city));
    const eventSnapshot = await getDocs(cityQuery);

    // Map Firestore data to EventType using the utility function
    const events: EventType[] = eventSnapshot.docs.map(mapFirestoreEvent);

    return (
        <div className="md:h-screen min-h-screen flex flex-col">
            <TopBar title={`happns/${city}/explore`} />
            <Separator />
            <div className="flex-1 overflow-y-auto">
                <EventComponent
                    events={events}
                    city={city}
                />
            </div>
        </div>
    );
}