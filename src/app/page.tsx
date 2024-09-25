// Next Imports
import { Metadata } from "next"
import Link from "next/link"

// App Imports
import { TopBar } from "@/components/top-bar"
import { Footer } from "@/components/footer"
import { getTotalUpcomingEvents } from "@/lib/eventUtils"

// Firebase Imports
import { db } from "@/lib/firebase"
import { collection, getDocs } from "firebase/firestore"

// Shadcn Imports
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Other Imports
import { CalendarIcon } from "@radix-ui/react-icons"

const ad = { id: 1, imageUrl: "/ads/ad1.jpg", link: "https://seattle.boo-halloween.com/" }

export const dynamic = 'force-dynamic';

// Helper function to get metadata
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "happns | events in your city",
    description: "discover curated events happening in your city with happn",
    openGraph: {
      title: "happns | events in your city",
      description: "discover curated events happening in your city with happn",
      images: ["https://ithappns.com/logo.png"],
      url: "https://ithappns.com",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "happns | events in your city",
      description: "discover curated events happening in your city with happn",
      images: ["https://ithappns.com/logo.png"],
    },
  };
}

// Fetch cities and total upcoming events
async function fetchCities() {
  const citiesRef = collection(db, "cities");
  const citySnapshot = await getDocs(citiesRef);
  
  // Use Promise.all to fetch event counts for all cities in parallel
  const cities = await Promise.all(
    citySnapshot.docs.map(async (doc) => {
      const cityData = doc.data();
      const upcomingEventCount = await getTotalUpcomingEvents(cityData.slug);
      return {
        name: cityData.name,
        slug: cityData.slug,
        description: cityData.description,
        upcomingEventCount,
      };
    })
  );

  return cities;
}

export default async function Home() {

  const cities = await fetchCities();

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar title="happns" />
      <Separator />

      <div className="flex-grow w-full max-w-[880px] mx-auto p-4">
        {/* Sponsored AD */}
        <div className="w-full p-4">
          <Link href={ad.link}>
            <img
              src={ad.imageUrl}
              alt={`Ad ${ad.id}`}
              className="w-full h-auto rounded-lg object-cover"
            />
          </Link>
          <p className="text-center text-xs text-gray-500 mt-1">sponsored</p>
        </div>

        {/* City Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 w-full">
          {cities.map((city) => {
            return (
              <Link href={`/${city.slug}`} key={city.name}>
                <Card className="w-full">
                  <CardHeader className="space-y-2">
                    <CardTitle className="text-base w-full">{city.name}</CardTitle>
                    <CardDescription className="line-clamp-2 w-full">{city.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <CalendarIcon className="mr-1 h-3 w-3" />
                        {city.upcomingEventCount} upcoming events
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      <Footer />
    </div>
  );
}
