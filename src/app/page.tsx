"use client"

// React Imports
import { useEffect, useState } from "react"

// Next Imports
import Link from "next/link"

// Firebase Imports
import { db } from "@/app/firebase"
import { collection, getDocs, query, where } from "firebase/firestore"

// Components Imports
import { TopBar } from "@/components/top-bar"
import { Footer } from "@/components/footer"

// Shadcn Imports
import { Separator } from "@/components/ui/separator"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

// Icon Imports
import {
  CalendarIcon
} from "@radix-ui/react-icons"

const ad = { id: 1, imageUrl: "/ads/ad1.jpg", link: "https://seattle.boo-halloween.com/" }
const initialCities = [
  { name: "Seattle", slug: "seattle", events: 0, description: "Dive into SEA's dynamic events scene, where tech meets nature. From indie concerts to food festivals, connect with a community that blends urban life with outdoor adventures." },
  { name: "Portland", slug: "portland", events: 0, description: "Embrace Portland's quirky charm with events ranging from craft beer festivals to indie art shows. Dive into the city’s laid-back, creative atmosphere, where nature meets culture." },
  { name: "Vancouver", slug: "vancouver", events: 0, description: "Explore Vancouver's vibrant event scene, from film festivals to outdoor adventures. Connect with a diverse community in a city that seamlessly blends urban life with stunning nature." },
  { name: "San Francisco", slug: "san-francisco", events: 0, description: "Experience SF's unique mix of tech and creativity. Attend meetups, festivals, and events that showcase the city's innovative and eclectic spirit." },
]

export default function Home() {

  const [cities, setCities] = useState(initialCities);

  useEffect(() => {
    const fetchCityEvents = async () => {
      const today = new Date();

      const updatedCities = await Promise.all(cities.map(async (city) => {
        const eventsQuery = query(
          collection(db, "events"),
          where("city", "==", city.slug)
        );

        const eventSnapshot = await getDocs(eventsQuery);

        const totalUpcomingEvents = eventSnapshot.docs.filter(doc => {
          const eventData = doc.data();
          const eventDateStr = eventData.date;

          let eventDate;

          // Check if it's a date range (MM/dd/yyyy - MM/dd/yyyy)
          if (eventDateStr.includes("-")) {
            const dateRangeParts = eventDateStr.split(" - ");
            // Use the second date in the range (end date) for comparison
            const endDateStr = dateRangeParts[1];
            eventDate = new Date(endDateStr);
          } else {
            // Single date format
            eventDate = new Date(eventDateStr);
          }

          // Compare the event date with today
          return eventDate >= today;
        }).length;

        return { ...city, events: totalUpcomingEvents };
      }));
  
      setCities(updatedCities);
    };
  
    fetchCityEvents();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">

      {/* Top Bar */}
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
