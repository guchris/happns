// Next and React Imports
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import Link from "next/link"

// App Imports
import { cn } from "@/lib/utils"
import { Event } from "@/components/types"
import { useEvent } from "@/hooks/use-event"
import { categoryOptions } from "@/lib/selectOptions"
import { sortEventsByTypeAndDateAndName, formatEventTime } from "@/lib/eventUtils"

// Firebase Imports
import { db } from "@/lib/firebase"
import { doc, updateDoc, increment } from "firebase/firestore"

// Shadcn Imports
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

// Other Imports
import { Plus, Minus } from "lucide-react"
import { format, parseISO, differenceInDays } from "date-fns"


interface EventListViewProps {
    items: Event[]
    isFilterActive: boolean
    startDate: Date | undefined;
}

export function EventListView({ items }: EventListViewProps) {
    // Sort all events by type, date, and name (reuse existing sort)
    const sortedEvents = sortEventsByTypeAndDateAndName(items);

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {sortedEvents.length > 0 ? (
                sortedEvents.map((item) => {
                    const startDate = parseISO(item.startDate);
                    const endDate = parseISO(item.endDate);
                    const formattedDate = startDate.getTime() === endDate.getTime()
                        ? format(startDate, "MMM d")
                        : `${format(startDate, "MMM d")} - ${format(endDate, "MMM d")}`;
                    return (
                        <Link
                            key={item.id}
                            href={`/events/${item.id}`}
                            className="no-underline"
                        >
                            <div className="aspect-w-1 aspect-h-1 w-full relative">
                                <Image
                                    src={item.image || "/tempFlyer1.svg"}
                                    alt={item.name}
                                    width={150}
                                    height={150}
                                    loading="lazy"
                                    className="object-cover w-full h-full rounded-lg"
                                />
                            </div>
                            <div className="line-clamp-1 text-base font-semibold mt-1">{item.name}</div>
                            <div className="line-clamp-1 text-sm text-muted-foreground">
                                {formattedDate}
                            </div>
                        </Link>
                    );
                })
            ) : (
                <p className="text-sm text-muted-foreground col-span-full">no events available</p>
            )}
        </div>
    );
}