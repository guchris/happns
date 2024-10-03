// Next Imports
import Link from "next/link"

// Shadcn Imports
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Other Imports
import { CalendarIcon } from "@radix-ui/react-icons"

interface City {
    name: string;
    slug: string;
    upcomingEventCount: number;
}

interface CityGridProps {
    cities: City[];
}

export function CityGrid({ cities }: CityGridProps) {
    return (
        <div className="flex-1 mx-auto max-w-[880px] py-12 p-4 space-y-4">

            {/* Header */}
            <h3 className="text-xl font-semibold">popular cities</h3>

            {/* Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
                {cities.map((city) => {
                    return (
                        <Link href={`/${city.slug}`} key={city.name}>
                            <Card className="w-full">
                                <CardHeader className="space-y-2">
                                    <CardTitle className="text-base w-full">{city.name}</CardTitle>
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
                    );
                })}
            </div>
        </div>
    )
}