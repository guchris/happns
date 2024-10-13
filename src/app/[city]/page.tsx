// Next Imports
import { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"

// App Imports
import { Event } from "@/components/types"
import { TopBar } from "@/components/top-bar"
import Footer from "@/components/footer"
import EventGrid from "@/components/event-grid"
import { cityOptions } from "@/lib/selectOptions"
import { Curator } from "@/components/types"
import { mapFirestoreEvent, getUpcomingEvents, getEventsHappeningToday, getEventsHappeningTomorrow, sortEventsByClicks } from "@/lib/eventUtils"

// Firebase Imports
import { db } from "@/lib/firebase"
import { collection, getDoc, getDocs, doc, query, where } from "firebase/firestore"

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

    if (!city) {
        notFound();
    }

    // Step 1: Fetch city data from Firestore using the slug
    const citiesCol = collection(db, "cities");
    const cityQuery = query(citiesCol, where("slug", "==", city));
    const citySnapshot = await getDocs(cityQuery);

    if (citySnapshot.empty) {
        console.log(`No city found with the slug '${city}'`);
        notFound();
    }

    // Assuming there's only one document for the city slug
    const cityDoc = citySnapshot.docs[0];
    const cityData = cityDoc.data();
    const cityLabel = cityData?.name || "City";

    // Step 2: Fetch events for this city
    const eventsCol = collection(db, "events");
    const eventQuery = query(eventsCol, where("city", "==", city));
    const eventSnapshot = await getDocs(eventQuery);
    const events: Event[] = eventSnapshot.docs.map(mapFirestoreEvent);

    // Use utility functions for filtering and sorting events
    const today = new Date();
    const upcomingEvents = getUpcomingEvents(events, today);
    const eventsHappeningToday = getEventsHappeningToday(events, today);
    const eventsHappeningTomorrow = getEventsHappeningTomorrow(events, today);
    const topEvents = sortEventsByClicks(upcomingEvents, 8);

    // Step 3: Fetch curators for this city
    const curatorsCol = collection(db, "cities", cityDoc.id, "curators");
    const curatorsSnapshot = await getDocs(curatorsCol);
    const curators = await Promise.all(
        curatorsSnapshot.docs.map(async (curatorDoc) => {
            const uid = curatorDoc.id;
            const userDoc = await getDoc(doc(db, "users", uid));
            if (!userDoc.exists()) return null;
            const userData = userDoc.data();
            return {
                name: userData?.name || "Unknown Curator",
                username: userData?.username || "unknown",
                profilePicture: userData?.profilePicture || "/default-profile.png",
            };
        })
    );
    const validCurators = curators.filter((curator): curator is Curator => curator !== null);

    return (
        <div className="flex flex-col min-h-screen">
            <TopBar title={`happns/${city}`} />
            <Separator />

            <div className="flex-1 overflow-y-auto">

                {/* Hero Section */}
                <div className="flex flex-col max-w-[880px] mx-auto py-16 p-4 space-y-8 items-center lg:flex-row lg:space-x-12 lg:items-center">
                    
                    {/* Left Section: City Name */}
                    <div className="lg:w-1/2 space-y-4">
                        <h2 className="text-3xl font-bold">{cityData.slogan}</h2>
                        <Link href={`/${city}/explore`}>
                            <Button className="mt-4">explore {city} events</Button>
                        </Link>
                    </div>

                    {/* Right Section: City Image */}
                    <div className="lg:w-1/2 flex justify-center items-center">
                        <div className="relative w-full h-auto" style={{ aspectRatio: '600 / 250' }}>
                            <Image
                                src={`/covers/cover-${city}.jpg`}
                                alt={`${cityLabel} cover image`}
                                className="rounded-lg object-cover"
                                fill
                                priority
                            />
                        </div>
                    </div>
                </div>

                <Separator />

                <div className="py-12 space-y-8">

                    {/* Bio Card */}
                    <div className="flex-1 mx-auto max-w-[880px] px-4 space-y-4">
                        <Card className="w-full bg-neutral-50 border-none">
                            <CardHeader>
                                <CardTitle className="text-xl font-semibold">connect with your city</CardTitle>
                                <CardDescription className="mt-8 text-sm">
                                    {cityData.description}
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </div>

                    {/* Curators Section */}
                    <div className="flex flex-col max-w-[880px] mx-auto px-4 space-y-4">
                        <h2 className="text-xl font-semibold">meet the curators</h2>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {validCurators.map((curator, index) => (
                                <Card key={index} className="w-full">
                                    <CardHeader className="p-4">
                                        <div className="aspect-square w-full overflow-hidden relative">
                                            <Image
                                                src={curator.profilePicture}
                                                alt={`${curator.name}'s profile picture`}
                                                className="object-cover rounded-full"
                                                fill
                                            />
                                        </div>
                                        <CardTitle className="line-clamp-1 text-base font-semibold">{curator.name}</CardTitle>
                                        <CardDescription className="line-clamp-1 text-sm text-gray-500">@{curator.username}</CardDescription>
                                    </CardHeader>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Events Section */}
                    <div className="flex flex-col max-w-[880px] mx-auto px-4">
                        <div className="space-y-4">
                            <div>
                                <h2 className="text-xl font-semibold">find what&apos;s happning</h2>
                                <p className="text-sm">trending events</p>
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
