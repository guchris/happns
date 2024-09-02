"use client"

import Link from "next/link";

import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button";

import { PlusCircledIcon } from "@radix-ui/react-icons"

const cities = ["Seattle", "New York City", "San Francisco"];

export default function Home() {
  return (

    <div className="flex h-full flex-col">
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
