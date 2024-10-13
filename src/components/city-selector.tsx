"use client"

// Next and React Imports
import Link from "next/link"
import { useEffect, useState } from "react"

// App Imports
import { City } from "@/components/types"
import { calculateDistance } from "@/lib/geoUtils"

// Shadcn Imports
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CitySelectorProps {
    cities: City[];
    initialCity: string;
}

const CitySelector = ({ cities, initialCity }: CitySelectorProps) => {
    const [selectedCity, setSelectedCity] = useState<string>("");

    useEffect(() => {
        if (initialCity) {
            // Use the user's default city if it’s set
            setSelectedCity(initialCity);
        } else if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const userLat = position.coords.latitude;
                    const userLon = position.coords.longitude;
                    let closestCity = cities[0];
                    let minDistance = calculateDistance(userLat, userLon, cities[0].lat, cities[0].lon);
    
                    cities.forEach((city) => {
                        const distance = calculateDistance(userLat, userLon, city.lat, city.lon);
                        if (distance < minDistance) {
                            closestCity = city;
                            minDistance = distance;
                        }
                    });
                    setSelectedCity(closestCity.slug);
                },
                () => {
                    // If geolocation fails, use a fallback city if needed
                    setSelectedCity("seattle");
                }
            );
        } else {
            setSelectedCity("seattle");
        }
    }, [cities, initialCity]);

    return (
        <div className="flex items-center space-x-2">
            <Select value={selectedCity} onValueChange={(value) => setSelectedCity(value)}>
                <SelectTrigger>
                    <SelectValue>
                        {selectedCity === "" 
                            ? "loading city..." 
                            : cities.find((city) => city.slug === selectedCity)?.name || "select your city"}
                    </SelectValue>
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
        </div>
    )
}

export default CitySelector;