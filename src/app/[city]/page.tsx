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

type Curator = {
    name: string;
    username: string;
    profilePicture: string;
}

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

    // Step 1: Find the city document that has the slug "seattle"
    const citiesCol = collection(db, "cities");
    const cityQuery2 = query(citiesCol, where("slug", "==", "seattle"));
    const citySnapshot = await getDocs(cityQuery2);

    if (citySnapshot.empty) {
        console.log("No city found with the slug 'seattle'");
        return;
    }

    // Assuming there is only one document for "seattle"
    const cityDoc = citySnapshot.docs[0]; 
    const cityDocId = cityDoc.id; // Get the document ID of the city

    // Step 2: Fetch the curators sub-collection for the found city document
    const curatorsCol = collection(db, "cities", cityDocId, "curators");
    const curatorsSnapshot = await getDocs(curatorsCol);

    if (curatorsSnapshot.empty) {
        console.log(`No curators found for city with document ID: ${cityDocId}`);
        return;
    }

    // Step 3: Fetch user details from the global 'users' collection using the UIDs in the curators sub-collection
    const curators = await Promise.all(
        curatorsSnapshot.docs.map(async (curatorDoc) => {
            const uid = curatorDoc.id; // The UID stored in curators sub-collection
            const userDoc = await getDoc(doc(db, "users", uid)); // Fetch the user data from the global 'users' collection

            if (!userDoc.exists()) {
                console.log(`No user found for UID: ${uid}`);
                return null; // Handle missing user case
            }

            const userData = userDoc.data();

            return {
                name: userData?.name || "Unknown Curator",
                username: userData?.username || "unknown",
                profilePicture: userData?.profilePicture || "/default-profile.png",
            };
        })
    );

    // Filter out any null results (in case user data was missing for some UIDs)
    const validCurators = curators.filter((curator): curator is Curator => curator !== null);

    return (
        <div className="flex flex-col min-h-screen">
            <TopBar title={`happns/${city}`} />
            <Separator />

            <div className="flex-1 overflow-y-auto">

                {/* Hero Section */}
                <div className="flex flex-col max-w-[880px] mx-auto py-16 p-4 space-y-8 items-center lg:flex-row lg:space-x-12">
                    
                    {/* Left Section: City Name */}
                    <div className="lg:w-1/2 space-y-4">
                        <h2 className="text-3xl font-bold">uncover events shaping Seattle&apos;s culture and scene</h2>
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
                    <div className="flex-1 mx-auto max-w-[880px] px-4 space-y-4">
                        <Card className="w-full bg-neutral-50 border-none">
                            <CardHeader>
                                <CardTitle className="text-xl font-semibold">connect with your city</CardTitle>
                                <CardDescription className="mt-8 text-sm">
                                    Explore a curated selection of {cityLabel}&apos;s best events and easily plan outings with your friends or discover new connections along the way. From exclusive experiences to &quot;emerald&quot; gems, happns helps you find the perfect events.
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </div>

                    {/* Curators Section */}
                    <div className="flex flex-col max-w-[880px] mx-auto px-4 space-y-4">
                        <h2 className="text-lg font-semibold">meet the curators</h2>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {validCurators.map((curator, index) => (
                                <Card key={index} className="w-full">
                                    <CardHeader className="p-4">
                                        <div className="aspect-square w-full overflow-hidden relative">
                                            <Image
                                                src={curator.profilePicture}
                                                alt={`${curator.name}'s profile picture`}
                                                layout="fill"
                                                objectFit="cover"
                                                className="rounded-full"
                                            />
                                        </div>
                                        <CardTitle className="line-clamp-1 text-md font-semibold">{curator.name}</CardTitle>
                                        <CardDescription className="text-xs text-sm text-gray-500">@{curator.username}</CardDescription>
                                    </CardHeader>
                                </Card>
                            ))}
                        </div>
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
