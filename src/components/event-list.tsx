// React Imports
import { useState } from "react";

// Next Imports
import Image from "next/image";

// Firebase Imports
import { db } from "@/app/firebase";
import { doc, updateDoc, increment } from "firebase/firestore";

// Lib Imports
import { cn } from "@/lib/utils";
import { Event } from "@/components/types";
import { useEvent } from "@/app/use-event";
import { categoryOptions } from "@/lib/selectOptions";

// Shadcn Imports
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";

// Icon Imports
import {
    Plus,
    Minus,
} from "lucide-react";

// Other Imports
import { format, parse, isWithinInterval, eachDayOfInterval } from "date-fns";


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

    // Get the range of dates between the first and last event
    const sortedEventDates = Object.keys(eventsByDate)
        .sort((a, b) => parse(a, "MMMM d, yyyy", new Date()).getTime() - parse(b, "MMMM d, yyyy", new Date()).getTime());

    if (sortedEventDates.length > 0) {
        const firstEventDate = parse(sortedEventDates[0], "MMMM d, yyyy", new Date());
        const lastEventDate = parse(sortedEventDates[sortedEventDates.length - 1], "MMMM d, yyyy", new Date());

        // Fill in missing dates between the first and last event date
        const allDates = eachDayOfInterval({ start: firstEventDate, end: lastEventDate });
        allDates.forEach((date) => {
            const formattedDate = format(date, "MMMM d, yyyy");
            if (!eventsByDate[formattedDate]) {
                eventsByDate[formattedDate] = []; // Add empty array for dates with no events
            }
        });
    }

    // Sort dates again after filling missing dates
    const sortedDates = Object.keys(eventsByDate).sort((a, b) => {
        const dateA = parse(a, "MMMM d, yyyy", new Date());
        const dateB = parse(b, "MMMM d, yyyy", new Date());
        return dateA.getTime() - dateB.getTime();
    });

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
    // Default to collapsed if there are no events
    const [isOpen, setIsOpen] = useState(events.length > 0);
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
                    {/* Left-aligned date */}
                        <span>{triggerDate}</span>

                    {/* Right-aligned number of events */}
                    <div className="flex items-center">
                        <span className="text-muted-foreground">{`(${events.length})`}</span>
                        {isOpen ? <Minus className="w-4 h-4 ml-2" /> : <Plus className="w-4 h-4 ml-2" />}
                    </div>
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
                            ? `${format(startDate, "MMM d")} - ${format(endDate, "MMM d")}`
                            : format(startDate, "MMM d");
                        
                        const [startTime, endTime] = item.time.split(" - ");
                        const parsedStartTime = parse(startTime.trim(), "hh:mm a", new Date());
                        const parsedEndTime = parse(endTime.trim(), "hh:mm a", new Date());
                        const formattedStartTime = format(parsedStartTime, "h:mm a");
                        const formattedEndTime = format(parsedEndTime, "h:mm a");
                        const formattedTime = `${formattedStartTime} - ${formattedEndTime}`;

                        const categoryLabels = item.category.map(cat => {
                            const foundOption = categoryOptions.find(option => option.value === cat);
                            return foundOption ? foundOption.label : "Unknown";
                        }).join(", ");

                        return (
                            <button
                                key={item.id}
                                className={cn(
                                    // If isVerticalLayout is true, apply flex-col (image on top, text below), else apply flex-row for mobile
                                    `${isVerticalLayout ? 'flex-col' : 'flex-row'} md:flex-row flex w-full items-start gap-4 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent`,
                                    event.selected === item.id && "bg-muted"
                                )}
                                onClick={async () => {
                                    // Update the selected event locally
                                    setEvent({
                                        ...event,
                                        selected: item.id,
                                    });
                        
                                    handleEventClick(item.id);
                                }}
                            >
                                <Image
                                    src={item.image || "/tempFlyer1.svg"}
                                    alt={item.name}
                                    width={150}
                                    height={150}
                                    className={cn(
                                        // In vertical layout on mobile, image takes full width, otherwise it is a fixed width
                                        isVerticalLayout ? "w-full" : "w-32",
                                        "object-cover rounded-lg md:w-40 md:h-auto" // For desktop: fixed width and height adjustment
                                    )}
                                />
                                <div className="flex flex-col gap-2 w-full">
                                    <div className="flex flex-col gap-1">
                                        <div className="line-clamp-1 font-semibold">{item.name}</div>
                                        <div className="line-clamp-1 text-xs font-medium">{formattedDate}</div>
                                        <div className="line-clamp-1 text-xs font-medium">{formattedTime}</div>
                                    </div>
                                    <div className="line-clamp-2 text-xs text-muted-foreground">
                                        {item.description.substring(0, 300)}
                                    </div>
                                    <div className="inline-flex">
                                        <Badge variant="outline" className="inline-block hidden md:inline-block">
                                            {item.clicks} clicks
                                        </Badge>
                                    </div>
                                    <div className="inline-flex gap-1 flex-wrap">
                                        {item.category.map((cat, index) => {
                                            const categoryLabel = categoryOptions.find(option => option.value === cat)?.label || "Unknown";
                                            return (
                                                <Badge key={index} variant="secondary" className="inline-block">
                                                    {categoryLabel}
                                                </Badge>
                                            );
                                        })}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </CollapsibleContent>
            </Collapsible>
            {!isLastItem && <Separator />}
        </div>
    )
}