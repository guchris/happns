"use client"

// Next Imports
import { useEffect, useState } from "react"
import Link from "next/link"

// App Imports
import { useAuth } from "@/context/AuthContext"
import { calculateDistance } from "@/lib/geoUtils"

// Firebase Imports
import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"

// Shadcn Imports
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

interface City {
    name: string;
    slug: string;
    lat: number;
    lon: number;
}

interface CitySelectorProps {
    cities: City[];
}

export function CitySelector({ cities }: CitySelectorProps) {
    const { user } = useAuth();
    const [selectedCity, setSelectedCity] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Function to find the closest city based on the user's location
    const findClosestCity = (userLat: number, userLon: number) => {
        let closestCity = cities[0];
        let minDistance = calculateDistance(userLat, userLon, cities[0].lat, cities[0].lon);

        cities.forEach((city) => {
        const distance = calculateDistance(userLat, userLon, city.lat, city.lon);
        if (distance < minDistance) {
            closestCity = city;
            minDistance = distance;
        }
        });

        return closestCity.slug; // Return the slug of the closest city
    };

    // Set city selection
    useEffect(() => {
        // Load default city from Firestore if available
        const loadUserCity = async () => {
            if (user) {
                const userDocRef = doc(db, "users", user.uid);
                const userDoc = await getDoc(userDocRef);

                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    if (userData.selectedCity && userData.selectedCity !== "") {
                        setSelectedCity(userData.selectedCity);
                        setIsLoading(false);
                        return; // Exit the function if default city is set
                    }
                }
            }

            // If no default city, fallback to geolocation
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const userLat = position.coords.latitude;
                        const userLon = position.coords.longitude;
                        const closestCitySlug = findClosestCity(userLat, userLon);
                        setSelectedCity(closestCitySlug);
                        setIsLoading(false);
                    },
                    (error) => {
                        console.error("Error getting user location:", error);
                        setSelectedCity("seattle"); // Fallback city if geolocation fails
                        setIsLoading(false);
                    }
                );
            } else {
                setSelectedCity("seattle"); // Fallback city if geolocation is unavailable
                setIsLoading(false);
            }
        };

        loadUserCity();
    }, [user, cities]);

    return (
        <div className="flex items-center space-x-2">
            {isLoading ? (
                // Temporary loading placeholder
                <>  
                    <Select>
                        <SelectTrigger disabled>
                            <SelectValue placeholder="Loading location..." />
                        </SelectTrigger>
                    </Select>
                    <Button disabled>explore</Button>
                </>
            ) : selectedCity ? (
                <>
                    <Select value={selectedCity ?? undefined} onValueChange={(value) => setSelectedCity(value)}>
                        <SelectTrigger>
                            <SelectValue>{cities.find((city) => city.slug === selectedCity)?.name || "Select your city"}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {cities.map((city) => (
                                <SelectItem key={city.slug} value={city.slug}>
                                    {city.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Explore Button */}
                    <Link href={`/${selectedCity}/explore`}>
                        <Button>explore</Button>
                    </Link>
                </>
            ) : (
                // Fallback UI in case `selectedCity` fails to set
                <div>
                    <p>Error: Could not set city</p>
                </div>
            )}
        </div>
    )
}
