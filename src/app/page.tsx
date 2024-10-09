// Next Imports
import { Metadata } from "next"

// App Imports
import { TopBar } from "@/components/top-bar"
import { Footer } from "@/components/footer"
import { CitySelector } from "@/components/city-selector"
import { EventCarousel } from "@/components/event-carousel"
import { CityGrid } from "@/components/city-grid"
import JoinCard from "@/components/join-card"
import EventGridDynamic from "@/components/event-grid-dynamic"
import { CarouselEvent } from "@/components/types"
import { getTotalUpcomingEvents } from "@/lib/eventUtils"

// Firebase Imports
import { db } from "@/lib/firebase"
import { collection, doc, getDoc, getDocs } from "firebase/firestore"

// Shadcn Imports
import { Separator } from "@/components/ui/separator"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Music, PartyPopper, Theater, Globe, Dumbbell, Users, Gamepad, Film } from "lucide-react"

export const dynamic = 'force-dynamic';

// Helper function to get metadata
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "happns | events in your city",
    description: "discover curated events happening in your city with happns",
    openGraph: {
      title: "happns | events in your city",
      description: "discover curated events happening in your city with happns",
      images: ["https://ithappns.com/logo.png"],
      url: "https://ithappns.com",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "happns | events in your city",
      description: "discover curated events happening in your city with happns",
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
        id: doc.id,
        name: cityData.name,
        slug: cityData.slug,
        lat: cityData.lat,
        lon: cityData.lon,
        slogan: cityData.slogan,
        description: cityData.description,
        upcomingEventCount,
      };
    })
  );

  return cities;
}

// Fetch carousel event data
async function fetchCarouselEvents() {
  const carouselRef = collection(db, "carousel");
  const carouselSnapshot = await getDocs(carouselRef);

  // For each carousel item, fetch the corresponding event details from the "events" collection
  const carouselEvents = await Promise.all(
    carouselSnapshot.docs.map(async (carouselDoc) => {
      const eventId = carouselDoc.id;

      const eventDocRef = doc(db, "events", eventId);
      const eventDoc = await getDoc(eventDocRef);

      if (eventDoc.exists()) {
        const eventData = eventDoc.data();
        return {
          uid: eventId,
          image: eventData.image,
        };
      } else {
        return null;
      }
    })
  );

  // Filter out any null values (in case an event was not found)
  return carouselEvents.filter((event): event is CarouselEvent => event !== null);
}

export default async function Home() {

  const cities = await fetchCities();
  const carouselEvents = await fetchCarouselEvents();

  return (
    <div>
      {/* Intro Animation */}
      <div className="intro-animation">
          <h1>happns/</h1>
      </div>
      <div className="flex flex-col min-h-screen">
        <TopBar title="happns" />
        <Separator />

        <div className="flex-1 overflow-y-auto">

          {/* Hero Section */}
          <div className="flex flex-col max-w-[880px] mx-auto py-16 p-4 space-y-8 items-center lg:flex-row lg:space-x-12">
              
              {/* Left Section: Slogan, City Selector */}
              <div className="lg:w-1/2 space-y-4">
                  <h2 className="text-3xl font-bold">discover curated events happning in your city</h2>
                  <CitySelector cities={cities} />
              </div>

              {/* Right Section: Event Photo Carousel */}
              <EventCarousel carouselEvents={carouselEvents} />

          </div>
          
          <Separator />

          <div className="py-12 space-y-8">

            {/* Events Grid */}
            <EventGridDynamic cities={cities} />

            {/* City Grid */}
            <CityGrid cities={cities} />

            {/* Join Card */}
            <JoinCard />

            {/* Categories Section */}
            <div className="flex-1 max-w-[880px] mx-auto p-4 space-y-4">
              <h3 className="text-xl font-semibold">explore top categories</h3>
              <div className="grid grid-cols-4 lg:grid-cols-6 gap-4">
                  {[
                      { name: "music", icon: <Music /> },
                      { name: "nightlife", icon: <PartyPopper /> },
                      { name: "arts", icon: <Theater /> },
                      { name: "culture", icon: <Globe /> },
                      { name: "fitness", icon: <Dumbbell /> },
                      { name: "family", icon: <Users /> },
                      { name: "gaming", icon: <Gamepad /> },
                      { name: "film", icon: <Film /> }
                  ].map((category) => (
                      <div key={category.name} className="pointer-events-none opacity-50">
                          <Card key={category.name} className="flex flex-col items-center justify-center p-4 h-24 space-y-1">
                              <div className="flex items-center justify-center w-10 h-10 text-muted-foreground">{category.icon}</div>
                              <CardTitle className="line-clamp-1 text-center text-base font-medium">{category.name}</CardTitle>
                          </Card>
                      </div>
                  ))}
              </div>
            </div>

          </div>
        </div>

        <Footer />

      </div>
    </div>
  );
}