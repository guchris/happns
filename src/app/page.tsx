"use client"

// React Imports
import { useEffect, useState } from "react";

// Next Imports
import Link from "next/link";

// Firebase Imports
import { db } from "@/app/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

// Components Imports
import { TopBar } from "@/components/top-bar"

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
  CircleIcon,
  CalendarIcon
} from "@radix-ui/react-icons";

const ad = { id: 1, imageUrl: "/ads/ad1.jpg", link: "https://seattle.boo-halloween.com/" };

export default function Home() {

  const [cities, setCities] = useState([
    { name: "Seattle", slug: "seattle", events: 0, description: "Dive into SEA's dynamic events scene, where tech meets nature. From indie concerts to food festivals, connect with a community that blends urban life with outdoor adventures." },
    { name: "Portland", slug: "portland", events: 0, description: "Embrace Portland's quirky charm with events ranging from craft beer festivals to indie art shows. Dive into the city’s laid-back, creative atmosphere, where nature meets culture." },
    { name: "Vancouver", slug: "vancouver", events: 0, description: "Explore Vancouver's vibrant event scene, from film festivals to outdoor adventures. Connect with a diverse community in a city that seamlessly blends urban life with stunning nature." },
    { name: "Los Angeles", slug: "los-angeles", events: 0, description: "Immerse yourself in LA's world-famous entertainment scene, from Hollywood premieres to music festivals. Explore diverse cultural neighborhoods and sun-soaked beaches."},
    { name: "New York City", slug: "new-york-city", events: 0, description: "Explore NYC's endless events, from Broadway shows to rooftop parties. Discover the city’s vibrant culture and connect with a diverse crowd at every turn." },
    { name: "San Francisco", slug: "san-francisco", events: 0, description: "Experience SF's unique mix of tech and creativity. Attend meetups, festivals, and events that showcase the city's innovative and eclectic spirit." },
    { name: "Austin", slug: "austin", events: 0, description: "Discover Austin’s vibrant culture with its legendary live music, tech meetups, and food truck festivals. Connect with creative communities in the heart of Texas."}
  ]);

  useEffect(() => {
    const fetchEvents = async () => {
      const updatedCities = await Promise.all(
        cities.map(async (city) => {
          const eventsCol = collection(db, "events");

          const q = query(eventsCol, where("city", "==", city.slug));
          const eventSnapshot = await getDocs(q);
          const totalEvents = eventSnapshot.size;

          return { ...city, events: totalEvents };
        })
      );

      setCities(updatedCities);
    };

    fetchEvents();
  }, []);

  return (
    <div className="flex h-full flex-col">

      {/* Top Bar */}
      <TopBar title="happns" />

      <Separator />

      <div className="w-full max-w-[1192px] mx-auto p-4">
        
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
              <Link href={`/cities/${citySlug}`} key={city.name}>
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
    </div>
  );
}
