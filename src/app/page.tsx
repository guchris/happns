// Next Imports
import { Metadata } from "next"
import Link from "next/link"

// App Imports
import { TopBar } from "@/components/top-bar"
import { Footer } from "@/components/footer"

// Firebase Imports
import { db } from "@/lib/firebase"
import { collection, getDocs, query, where } from "firebase/firestore"

// Shadcn Imports
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Other Imports
import { CalendarIcon } from "@radix-ui/react-icons"

const ad = { id: 1, imageUrl: "/ads/ad1.jpg", link: "https://seattle.boo-halloween.com/" }
const initialCities = [
  { name: "Seattle", slug: "seattle", events: 0, description: "Dive into SEA's dynamic events scene, where tech meets nature. From indie concerts to food festivals, connect with a community that blends urban life with outdoor adventures." },
  { name: "Portland", slug: "portland", events: 0, description: "Embrace Portland's quirky charm with events ranging from craft beer festivals to indie art shows. Dive into the city’s laid-back, creative atmosphere, where nature meets culture." },
  { name: "Vancouver", slug: "vancouver", events: 0, description: "Explore Vancouver's vibrant event scene, from film festivals to outdoor adventures. Connect with a diverse community in a city that seamlessly blends urban life with stunning nature." },
  { name: "San Francisco", slug: "san-francisco", events: 0, description: "Experience SF's unique mix of tech and creativity. Attend meetups, festivals, and events that showcase the city's innovative and eclectic spirit." },
]

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

// Server-side function to fetch city events
async function fetchCityEvents() {
  const today = new Date();
  const updatedCities = await Promise.all(
    initialCities.map(async (city) => {
      const eventsQuery = query(collection(db, "events"), where("city", "==", city.slug));
      const eventSnapshot = await getDocs(eventsQuery);

      // Filter for events happening today or later
      const totalUpcomingEvents = eventSnapshot.docs.filter((doc) => {
        const eventData = doc.data();
        const eventDateStr = eventData.date;

        let eventDate;
        if (eventDateStr.includes("-")) {
          // Handle date ranges like "MM/dd/yyyy - MM/dd/yyyy"
          const endDateStr = eventDateStr.split(" - ")[1];
          eventDate = new Date(endDateStr);
        } else {
          eventDate = new Date(eventDateStr);
        }

        return eventDate >= today;
      }).length;

      return { ...city, events: totalUpcomingEvents };
    })
  );

  return updatedCities;
}

export default async function Home() {

  // Fetch updated cities with event counts
  const cities = await fetchCityEvents();

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
            const citySlug = city.name.toLowerCase().replace(/ /g, "-");
            return (
              <Link href={`/${citySlug}`} key={city.name}>
                <Card className="w-full">
                  <CardHeader className="space-y-2">
                    <CardTitle className="text-base w-full">{city.name}</CardTitle>
                    <CardDescription className="line-clamp-2 w-full">{city.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <CalendarIcon className="mr-1 h-3 w-3" />
                        {city.events} upcoming events
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
