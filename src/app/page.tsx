"use client"

import Link from "next/link";

import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button";

const cities = ["Seattle", "New York City", "San Francisco"];

export default function Home() {
  return (

    <div className="hidden h-full flex-col md:flex">
        <div className="w-full flex items-center py-4 px-4 md:h-14">
            <h2 className="text-lg font-semibold">happns</h2>
        </div>
        <Separator />
        <div className="flex flex-col items-start space-y-4 p-4">
          {cities.map(city => {
            const citySlug = city.toLowerCase().replace(/ /g, "-");
            return (
              <Link href={`/cities/${citySlug}`} key={city}>
                <Button variant="outline">{city}</Button>
              </Link>
            );
          })}
        </div>
    </div>
  );
}
