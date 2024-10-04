// Next Imports
import { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"

// App Imports
import { TopBar } from "@/components/top-bar"
import { Footer } from "@/components/footer"
import { Event } from "@/components/types"
import EventGrid from "@/components/event-grid"
import { cityOptions } from "@/lib/selectOptions"
import { mapFirestoreEvent, getUpcomingEvents, getEventsHappeningToday, getEventsHappeningTomorrow, sortEventsByClicks } from "@/lib/eventUtils"

// Firebase Imports
import { db } from "@/lib/firebase"
import { collection, getDocs, query, where } from "firebase/firestore"

// Shadcn Imports
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

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

    // Map Firestore data to EventType using the utility function
    const events: Event[] = eventSnapshot.docs.map(mapFirestoreEvent);

    // Use utility functions for filtering and sorting events
    const today = new Date();
    const upcomingEvents = getUpcomingEvents(events, today);
    const eventsHappeningToday = getEventsHappeningToday(events, today);
    const eventsHappeningTomorrow = getEventsHappeningTomorrow(events, today);
    const topEvents = sortEventsByClicks(upcomingEvents, 8);

    return (
        <div className="flex flex-col min-h-screen">
            <TopBar title={`happns/${city}`} />
            <Separator />

            <div className="flex-1 overflow-y-auto">

                {/* Hero Section */}
                <div className="flex flex-col max-w-[880px] mx-auto py-16 p-4 space-y-8 items-center lg:flex-row lg:space-x-12">
                    
                    {/* Left Section: City Name */}
                    <div className="lg:w-1/2 space-y-4">
                        <h2 className="text-3xl font-bold">uncover events shaping Seattle's culture and scene</h2>
                        <Link href={`/${city}/explore`}>
                            <Button className="mt-4">explore {city} events</Button>
                        </Link>
                    </div>

                    {/* Right Section: City Image */}
                    {/* <div className="lg:w-1/2 lg:block">
                        <Image
                            src={`/covers/cover-${city}.png`} 
                            alt={`${cityLabel} cover image`} 
                            className="rounded-lg object-cover w-full h-full"
                            width={500}
                            height={300}
                            priority
                        />
                    </div> */}
                </div>

                <Separator />

                <div className="py-12 space-y-8">

                    {/* Bio Card */}
                    <div className="flex-1 mx-auto max-w-[880px] p-4 space-y-4">
                        <Card className="w-full bg-neutral-50 border-none">
                            <CardHeader>
                                <CardTitle className="text-xl font-semibold">connect with your city</CardTitle>
                                <CardDescription className="mt-8 text-sm">
                                    Explore a curated selection of {cityLabel}&apos;s best events and easily plan outings with your friends or discover new connections along the way. From exclusive experiences to &quot;emerald&quot; gems, happns helps you find the perfect events.
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </div>

                    {/* Events Section */}
                    <div className="flex flex-col max-w-[880px] mx-auto px-4">
                        <div className="space-y-4">
                            <div>
                                <h2 className="text-lg font-semibold">happnings</h2>
                                <p className="text-sm">upcoming top events</p>
                            </div>
                            <EventGrid
                                eventsHappeningToday={eventsHappeningToday}
                                eventsHappeningTomorrow={eventsHappeningTomorrow}
                                topEvents={topEvents}
                            />
                        </div>
                    </div>
                </div>
            </div>
            
            <Footer />
        </div>
    );
}
