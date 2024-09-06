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
    { name: "Seattle", slug: "seattle", nickname: "The Emerald City", color: "text-green-500", events: 0, description: "Dive into SEA's dynamic events scene, where tech meets nature..." },
    { name: "New York City", slug: "new-york-city", nickname: "The Big Apple", color: "text-red-500", events: 0, description: "Explore NYC's endless events..." },
    { name: "San Francisco", slug: "san-francisco", nickname: "The Golden City", color: "text-yellow-500", events: 0, description: "Experience SF's unique mix of tech and creativity..." }
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
                    <CardDescription className="w-full">{city.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <CircleIcon className={`mr-1 h-3 w-3 ${city.color}`} />
                        {city.nickname}
                      </div>
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
