// Next Imports
import { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

// App Imports
import { TopBar } from "@/components/top-bar"
import { Footer } from "@/components/footer"
import { Event } from "@/components/types"
import EventGrid from "@/components/event-grid"
import { cityOptions } from "@/lib/selectOptions"
import { getUpcomingEvents, getEventsHappeningToday, getEventsHappeningTomorrow, sortEventsByClicks } from "@/lib/eventUtils"

// Firebase Imports
import { db } from "@/lib/firebase"
import { collection, getDocs, query, where } from "firebase/firestore"

// Shadcn Imports
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"

type CityPageProps = {
    params: {
        city: string;
    };
};

// Metadata for SEO
export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
    const city = params.city || "";
    const cityLabel = cityOptions.find(option => option.value === city)?.label || "City";

    return {
        title: `happns | events in ${cityLabel}`,
        description: `explore curated events happening in ${cityLabel}`,
        openGraph: {
            title: `happns | events in ${cityLabel}`,
            description: `explore curated events happening in ${cityLabel}`,
            images: [`https://ithappns.com/covers/cover-${city}.png`],
            url: `https://ithappns.com/${city}`,
            type: "website"
        },
        twitter: {
            card: "summary_large_image",
            title: `happns | events in ${cityLabel}`,
            description: `explore curated events happening in ${cityLabel}`,
            images: [`https://ithappns.com/covers/cover-${city}.png`]
        }
    };
}

export default async function CityPage({ params }: CityPageProps) {
    const city = params.city || "";
    const cityLabel = cityOptions.find(option => option.value === city)?.label || "City";

    if (!city) {
        notFound();
    }

    // Fetch events from Firestore
    const eventsCol = collection(db, "events");
    const cityQuery = query(eventsCol, where("city", "==", city));
    const eventSnapshot = await getDocs(cityQuery);

    const events: Event[] = eventSnapshot.docs.map((doc) => ({
        category: doc.data().category,
        city: doc.data().city,
        clicks: doc.data().clicks,
        cost: doc.data().cost,
        details: doc.data().details,
        endDate: doc.data().endDate,
        format: doc.data().format,
        gmaps: doc.data().gmaps,
        id: doc.id,
        image: doc.data().image,
        link: doc.data().link,
        location: doc.data().location,
        name: doc.data().name,
        neighborhood: doc.data().neighborhood,
        startDate: doc.data().startDate,
        time: doc.data().time,
    }));

    // Get today's date
    const today = new Date();

    // Use utility functions for filtering and sorting events
    const upcomingEvents = getUpcomingEvents(events, today);
    const eventsHappeningToday = getEventsHappeningToday(events, today);
    const eventsHappeningTomorrow = getEventsHappeningTomorrow(events, today);
    const topEvents = sortEventsByClicks(upcomingEvents, 8);

    return (
        <div className="min-h-screen flex flex-col">
            <TopBar title={`happns/${city}`} />
            <Separator />

            <div className="flex-1 overflow-y-auto">

                {/* Hero Section */}
                <div className="bg-gray-100 py-24">
                    <div className="flex flex-col max-w-[1000px] mx-auto space-y-8 px-4 lg:flex-row lg:space-x-12 items-center">
                        
                        {/* Left Section: City Title and Description */}
                        <div className="lg:w-1/2 space-y-4">
                            <div>
                                <h2 className="text-lg font-bold">Events in</h2>
                                <h1 className="text-4xl font-black">{cityLabel}</h1>
                            </div>
                            <p className="text-base text-muted-foreground">
                                Explore a curated selection of {cityLabel}&#39;s best events and easily plan outings with your friends or discover new connections along the way. From exclusive experiences to hidden gems, happns helps you find the perfect events.
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
                        <h2 className="text-lg font-semibold tracking-tight">happnings</h2>
                        <EventGrid
                            eventsHappeningToday={eventsHappeningToday}
                            eventsHappeningTomorrow={eventsHappeningTomorrow}
                            topEvents={topEvents}
                        />
                    </div>
                </div>
            </div>
            
            <Footer />
        </div>
    );
}
