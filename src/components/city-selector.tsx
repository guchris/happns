"use client"

// Next Imports
import Link from "next/link"
import { useEffect, useState } from "react"

// App Imports
import { City } from "@/components/types"
import { useAuth } from "@/context/AuthContext"
import { calculateDistance } from "@/lib/geoUtils"

// Firebase Imports
import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"

// Shadcn Imports
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CitySelectorProps {
    cities: City[];
}

export default function CitySelector({ cities }: CitySelectorProps) {
    const { user } = useAuth();
    const [selectedCity, setSelectedCity] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Function to find the closest city based on the user's location
    const findClosestCity = (userLat: number, userLon: number) => {
        // let closestCity = cities[0];
        // let minDistance = calculateDistance(userLat, userLon, cities[0].lat, cities[0].lon);

        // cities.forEach((city) => {
        // const distance = calculateDistance(userLat, userLon, city.lat, city.lon);
        // if (distance < minDistance) {
        //     closestCity = city;
        //     minDistance = distance;
        // }
        // });

        // return closestCity.slug; // Return the slug of the closest city
        return "seattle";
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
            // if (navigator.geolocation) {
            //     navigator.geolocation.getCurrentPosition(
            //         (position) => {
            //             const userLat = position.coords.latitude;
            //             const userLon = position.coords.longitude;
            //             const closestCitySlug = findClosestCity(userLat, userLon);
            //             setSelectedCity(closestCitySlug);
            //             setIsLoading(false);
            //         },
            //         (error) => {
            //             console.error("Error getting user location:", error);
            //             setSelectedCity("seattle"); // Fallback city if geolocation fails
            //             setIsLoading(false);
            //         }
            //     );
            // } else {
                setSelectedCity("seattle"); // Fallback city if geolocation is unavailable
                setIsLoading(false);
            // }
        };

        loadUserCity();
    }, [user, cities]);

    return (
        <div className="flex items-center space-x-2 w-full">
            {isLoading ? (
                // Temporary loading placeholder
                <>
                    <Select>
                        <SelectTrigger disabled className="flex-1 min-w-0 h-10">
                            <SelectValue placeholder="loading location..." />
                        </SelectTrigger>
                    </Select>
                    <Link href="#" className="flex-1">
                        <Button disabled className="w-full h-10">explore</Button>
                    </Link>
                </>
            ) : selectedCity ? (
                <>
                    <Select value={selectedCity ?? undefined} onValueChange={(value) => setSelectedCity(value)}>
                        <SelectTrigger className="flex-1 min-w-0 h-10">
                            <SelectValue>{cities.find((city) => city.slug === selectedCity)?.name.toLowerCase() || "select your city"}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {cities.map((city) => (
                                <SelectItem key={city.slug} value={city.slug}>
                                    {city.name.toLowerCase()}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Explore Button */}
                    <Link href={`/${selectedCity}/explore`} className="flex-1">
                        <Button className="w-full h-10">explore</Button>
                    </Link>
                </>
            ) : (
                // Fallback UI in case `selectedCity` fails to set
                <div>
                    <p>error: could not set city</p>
                </div>
            )}
        </div>
    )
}