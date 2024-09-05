"use client"

{/* Next Imports */}
import Link from "next/link";

{/* Shadcn Imports */}
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

{/* Icon Imports */}
import {
  PlusCircledIcon,
  CircleIcon as FilledCircleIcon,
  CalendarIcon
} from "@radix-ui/react-icons";

const ad = { id: 1, imageUrl: "/ads/ad1.jpg", link: "https://seattle.boo-halloween.com/" };
const cities = [
  {
    name: "Seattle",
    nickname: "The Emerald City",
    color: "text-green-500",
    events: "345",
    description: "Dive into SEA's dynamic events scene, where tech meets nature. From indie concerts to food festivals, connect with a community that blends urban life with outdoor adventures."
  },
  {
    name: "New York City",
    nickname: "The Big Apple",
    color: "text-red-500",
    events: "234",
    description: "Explore NYC's endless events, from Broadway shows to rooftop parties. Discover the city’s vibrant culture and connect with a diverse crowd at every turn."
  },
  {
    name: "San Francisco",
    nickname: "The Golden City",
    color: "text-yellow-500",
    events: "123",
    description: "Experience SF's unique mix of tech and creativity. Attend meetups, festivals, and events that showcase the city's innovative and eclectic spirit."
  }
];

export default function Home() {
  return (
    <div className="flex h-full flex-col">

      {/* Top Nav */}
      <div className="w-full flex items-center justify-between py-4 px-4 h-14">
          <h2 className="text-lg font-semibold">happns</h2>
          <Button>
            <PlusCircledIcon className="mr-2 h-4 w-4" />
            <Link href="/event-form">
              Add event
            </Link>
          </Button>
      </div>

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
                        <FilledCircleIcon className={`mr-1 h-3 w-3 ${city.color}`} />
                        {city.nickname}
                      </div>
                      <div className="flex items-center">
                        <CalendarIcon className="mr-1 h-3 w-3" />
                        {city.events} events
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
