"use client";

import { Separator } from "@/components/ui/separator"
import { Event } from "@/components/event"
import { events } from "@/app/data"
import { useParams } from "next/navigation";

export default function CityPage() {
    const { city } = useParams();

    return (
        <>
            {/* Mobile View */}

            {/* Desktop View */}
            <div className="hidden h-full flex-col md:flex">
                <div className="w-full flex items-center py-4 px-4 md:h-14">
                    <h2 className="text-lg font-semibold">happns/{city}</h2>
                </div>
                <Separator />
                <Event
                    events={events}
                />
            </div>
        </>
    );
}
