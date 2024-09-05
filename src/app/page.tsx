"use client"

// React Imports
import { useEffect, useState } from "react"

// Next Imports
import Link from "next/link";

// Firebase Imports
import { useAuthState } from "react-firebase-hooks/auth"
import { auth, db } from "@/app/firebase"
import { doc, getDoc } from "firebase/firestore"

// Shadcn Imports
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

// Icon Imports
import {
  CircleIcon as FilledCircleIcon,
  CalendarIcon
} from "@radix-ui/react-icons";

// Utility Function to get initials
function getInitials(name: string) {
  const [firstName, lastName] = name.split(" ");
  return firstName[0] + (lastName ? lastName[0] : "");
}

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
  const [user] = useAuthState(auth);
  const [userData, setUserData] = useState<{ name: string; email: string } | null>(null)

  // Fetch user details from Firestore
  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          setUserData(userDoc.data() as { name: string; email: string });
        }
      }
    };

    fetchUserData();
  }, [user]);

  return (
    <div className="flex h-full flex-col">

      {/* Top Nav */}
      <div className="w-full flex items-center justify-between py-4 px-4 h-14">
        <h2 className="text-lg font-semibold">happns</h2>
        {user && userData ? (
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-white font-semibold">
              {getInitials(userData.name)}
            </div>
          </div>
        ) : (
          <Button>
            <Link href="/auth">
              Log In
            </Link>
          </Button>
        )}
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
