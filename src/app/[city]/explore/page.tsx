// Next Imports
import { Metadata } from "next"
import { notFound } from "next/navigation"

// App Imports
import { TopBar } from "@/components/top-bar"
import { Event as EventType } from "@/components/types"
import { Event as EventComponent } from "@/components/event"
import { cityOptions } from "@/lib/selectOptions"

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

// Helper function to parse the event date string
function parseEventDate(dateString: string) {
    if (dateString.includes("-")) {
        const [startPart, endPart] = dateString.split(" - ");
        const startDate = new Date(startPart.trim());
        const endDate = new Date(endPart.trim());
        return { startDate, endDate };
    } else {
        const date = new Date(dateString.trim());
        return { startDate: date, endDate: date };
    }
}

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
    const cityLabel = cityOptions.find(option => option.value === city)?.label || "City";

    if (!city) {
        notFound();
    }

    // Fetch events from Firestore
    const eventsCol = collection(db, "events");
    const cityQuery = query(eventsCol, where("city", "==", city));
    const eventSnapshot = await getDocs(cityQuery);

    const events: EventType[] = eventSnapshot.docs.map((doc) => ({
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