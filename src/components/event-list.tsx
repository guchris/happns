// React Imports
import { useState } from "react"

// Next Imports
import Image from "next/image"

// Firebase Imports
import { db } from "@/app/firebase"
import { doc, updateDoc, increment } from "firebase/firestore"

// Lib Imports
import { cn } from "@/lib/utils"
import { Event } from "@/components/types"
import { useEvent } from "@/app/use-event"

// Shadcn Imports
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"

// Icon Imports
import {
    Plus,
    Minus
} from "lucide-react"

// Other Imports
import { format, parse, isWithinInterval } from "date-fns"

interface EventListProps {
    items: Event[]
    isVerticalLayout: boolean
}

// Utility function to determine the correct date for display
const getCurrentDateForDisplay = (startDate: Date, endDate: Date) => {
    const today = new Date();
    // If today's date is within the range, return today
    if (isWithinInterval(today, { start: startDate, end: endDate })) {
        return today;
    }
    // Otherwise, return the start date
    return startDate;
};

export function EventList({ items, isVerticalLayout }: EventListProps) {
    const [event, setEvent] = useEvent()

    // Group events by the display date (either start date or today's date if within range)
    const eventsByDate = items.reduce((acc, item) => {
        let startDate: Date;
        let endDate: Date;

        // Handle date ranges like "10/14/2024 - 10/15/2024"
        if (item.date.includes("-")) {
            const [startPart, endPart] = item.date.split(" - ");
            startDate = parse(startPart.trim(), "MM/dd/yyyy", new Date());
            endDate = parse(endPart.trim(), "MM/dd/yyyy", new Date());
        } else {
            // Handle single dates like "09/14/2024"
            startDate = parse(item.date, "MM/dd/yyyy", new Date());
            endDate = startDate;
        }

        // Use the new logic to determine whether to use today's date or start date
        const displayDate = getCurrentDateForDisplay(startDate, endDate);
        const formattedDate = format(displayDate, "MMMM d, yyyy");

        if (!acc[formattedDate]) {
            acc[formattedDate] = [];
        }
        acc[formattedDate].push(item);
        return acc;
    }, {} as Record<string, Event[]>);

    // Sort dates in ascending order based on Date objects
    const sortedDates = Object.keys(eventsByDate).sort((a, b) => {
        const dateA = parse(a, "MMMM d, yyyy", new Date())
        const dateB = parse(b, "MMMM d, yyyy", new Date())
        return dateA.getTime() - dateB.getTime()
    })

    return (
        <ScrollArea className="h-full">
            <div className="flex flex-col">
                {sortedDates.map((date, index) => (
                    <div key={date}>
                        <CollapsibleItem date={date} events={eventsByDate[date]} isLastItem={index === sortedDates.length - 1} isVerticalLayout={isVerticalLayout} />
                    </div>
                ))}
            </div>
        </ScrollArea>
    )
}

interface CollapsibleItemProps {
    date: string
    events: Event[]
    isLastItem: boolean
    isVerticalLayout: boolean
}

function CollapsibleItem({ date, events, isLastItem, isVerticalLayout }: CollapsibleItemProps) {
    const [isOpen, setIsOpen] = useState(true)
    const [event, setEvent] = useEvent()

    // Parse the date for display in the trigger
    const parsedDate = parse(date, "MMMM d, yyyy", new Date())
    const triggerDate = format(parsedDate, "EEE, MMM d") // Format as "Mon, Sep 2"

    const handleEventClick = async (eventId: string) => {
        setEvent({ ...event, selected: eventId })

        // Reference the document in Firestore and increment the `clicks` field
        const eventRef = doc(db, "events", eventId);

        await updateDoc(eventRef, {
            clicks: increment(1),
        })
    }

    return (
        <div>
            <Collapsible defaultOpen={isOpen} className="p-4" onOpenChange={() => setIsOpen(!isOpen)}>
                <CollapsibleTrigger className="flex w-full justify-between text-left text-sm font-semibold py-0.5 gap-1">
                    <span>{triggerDate}</span>
                    {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 pt-2">
                    {events.map((item) => {
                        // Parse start and end dates
                        const startDate = item.date.includes("-")
                            ? parse(item.date.split(" - ")[0].trim(), "MM/dd/yyyy", new Date())
                            : parse(item.date, "MM/dd/yyyy", new Date());

                        const endDate = item.date.includes("-")
                            ? parse(item.date.split(" - ")[1].trim(), "MM/dd/yyyy", new Date())
                            : startDate;

                        // Format the display date for rendering
                        const formattedDate = item.date.includes("-")
                            ? `${format(startDate, "MMM d, yyyy")} - ${format(endDate, "MMM d, yyyy")}`
                            : format(startDate, "MMM d, yyyy");

                        return (
                            <button
                                key={item.id}
                                className={cn(
                                    "flex w-full items-start gap-4 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent",
                                    isVerticalLayout ? "flex-col" : "flex-row",
                                    event.selected === item.id && "bg-muted"
                                )}
                                onClick={() => handleEventClick(item.id)}
                            >
                                <Image
                                    src={item.image || "/tempFlyer1.svg"}
                                    alt={item.name}
                                    width={isVerticalLayout ? 150 : 100}
                                    height={isVerticalLayout ? 150 : 100}
                                    className={cn("object-cover rounded-lg", isVerticalLayout ? "w-full" : "w-1/3")}
                                />
                                <div className={`flex flex-col gap-2 w-full ${isVerticalLayout ? "" : "ml-4"}`}>
                                    <div className="flex flex-col gap-1">
                                        <div className="font-semibold">{item.name}</div>
                                        <div className="text-xs font-medium">{formattedDate}</div>
                                        <div className="text-xs font-medium">{item.time}</div>
                                    </div>
                                    <div className="line-clamp-3 text-xs text-muted-foreground">
                                        {item.description.substring(0, 300)}
                                    </div>
                                    <div className="inline-flex">
                                        <Badge variant="outline" className="inline-block">
                                            {item.clicks} clicks
                                        </Badge>
                                    </div>
                                    <div className="inline-flex">
                                        <Badge variant="secondary" className="inline-block">
                                            {item.category}
                                        </Badge>
                                    </div>
                                </div>
                            </button>
                        )
                    })}
                </CollapsibleContent>
            </Collapsible>
            {!isLastItem && <Separator />}
        </div>
    )
}