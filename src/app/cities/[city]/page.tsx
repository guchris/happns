"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button";

import { PlusCircledIcon } from "@radix-ui/react-icons"

import { Event } from "@/components/event"
import { events } from "@/app/data"

export default function CityPage() {
    const { city } = useParams();

    return (
        <>
            {/* Mobile View */}

            {/* Desktop View */}
            <div className="hidden h-full flex-col md:flex">
                <div className="w-full flex items-center justify-between py-4 px-4 md:h-14">
                    <h2 className="text-lg font-semibold">
                        <Link href="/">happns</Link>
                        /{city}
                    </h2>
                    <Button>
                        <PlusCircledIcon className="mr-2 h-4 w-4" />
                        <Link href="https://airtable.com/app0fFoxhSVvQHNmo/pag41f358zYRYELLj/form" target="_blank">
                            Add event
                        </Link>
                    </Button>
                </div>
                <Separator />
                <Event
                    events={events}
                />
            </div>
        </>
    );
}
