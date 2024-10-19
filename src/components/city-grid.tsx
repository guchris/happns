// Next Imports
import Link from "next/link"

// App Imports
import { City } from "@/components/types"

// Shadcn Imports
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarIcon } from "@radix-ui/react-icons"

interface CityGridProps {
    cities: City[];
}

export default function CityGrid({ cities }: CityGridProps) {

    const sortedCities = cities.sort((a, b) => (b.upcomingEventCount || 0) - (a.upcomingEventCount || 0));

    return (
        <div className="flex-1 mx-auto max-w-[880px] md:max-w-[700px] lg:max-w-[880px] p-4 space-y-4">

            {/* Header */}
            <h3 className="text-xl font-semibold">popular cities</h3>

            {/* Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
                {sortedCities.map((city) => {
                        const isReadycity = city.name === "Seattle" || city.name === "San Francisco";

                        return (
                            <div key={city.name} className={`${!isReadycity ? "pointer-events-none opacity-50" : ""}`}>
                                <Link href={isReadycity ? `/${city.slug}` : "#"} passHref>
                                    <Card className="w-full">
                                        <CardHeader className="space-y-2">
                                            <CardTitle className="line-clamp-1 text-base w-full">{city.name.toLowerCase()}</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex flex-col space-y-2 text-sm text-muted-foreground">
                                                <div className="flex items-center">
                                                    <CalendarIcon className="mr-1 h-3 w-3" />
                                                    {city.upcomingEventCount} events
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            </div>
                        );
                    })}
            </div>
        </div>
    )
}