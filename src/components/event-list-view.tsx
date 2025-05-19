// Next and React Imports
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

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

export function EventListView({ items, isFilterActive, startDate }: EventListViewProps) {
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
    const startDateFilter = startDate
        ? startDate.toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" })
        : today; // Use the selected start date or today if no start date is provided

    const eventsByDate = items.reduce((acc, item) => {
        const eventStartDate = parseISO(item.startDate); // Convert to Date object
        const eventEndDate = parseISO(item.endDate); // Convert to Date object
        const filterDate = startDate ? startDate : new Date(); // Already a Date object
        const todayDate = parseISO(today); // Convert 'today' string to Date object
    
        // Determine the first applicable date for the event
        const applicableDate =
            todayDate >= eventStartDate && todayDate <= eventEndDate
                ? todayDate // Use today if it falls in the event's range
                : filterDate >= eventStartDate && filterDate <= eventEndDate
                ? filterDate // Use the filtered start date if it falls in the event's range
                : eventStartDate >= filterDate
                ? eventStartDate // Use the event's start date if it's after or equal to the filter
                : null;
    
        // If no applicable date is found, skip the event
        if (!applicableDate) return acc;
    
        const formattedDate = applicableDate.toISOString().split("T")[0]; // Format date as 'yyyy-MM-dd'
    
        // Only add the event to the first applicable collapsible
        if (!acc[formattedDate]) acc[formattedDate] = [];
        acc[formattedDate].push(item);
    
        return acc;
    }, {} as Record<string, Event[]>);

    // Sort events within each collapsible
    Object.keys(eventsByDate).forEach((date) => {
        eventsByDate[date] = sortEventsByTypeAndDateAndName(eventsByDate[date]);
    });

    // Sort the collapsible dates chronologically
    const sortedDates = Object.keys(eventsByDate)
        .filter((date) => eventsByDate[date].length > 0) // Exclude empty groups
        .sort((a, b) => parseISO(a).getTime() - parseISO(b).getTime());

    return (
        <ScrollArea className="h-full overflow-y-auto">
            <div className="flex h-full flex-col">
                {sortedDates.map((date, index) => {
                    if (isFilterActive && eventsByDate[date].length === 0) return null;
                    return (
                        <div key={date}>
                            <CollapsibleItem
                                date={date}
                                events={eventsByDate[date]}
                                isLastItem={index === sortedDates.length - 1}
                            />
                        </div>
                    );
                })}
            </div>
        </ScrollArea>
    )
}

interface CollapsibleItemProps {
    date: string
    events: Event[]
    isLastItem: boolean
}

function CollapsibleItem({ date, events, isLastItem }: CollapsibleItemProps) {
    const [isOpen, setIsOpen] = useState(events.length > 0)
    const [event, setEvent] = useEvent()
    const router = useRouter()
    const [isMobile, setIsMobile] = useState(false)

    // Parse the date for display in the trigger
    const parsedDate = parseISO(date);
    const triggerDate = format(parsedDate, "EEE, MMM d"); // Format as "Mon, Sep 2"

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768); // Adjust the breakpoint as needed
        };
        handleResize(); // Check on mount
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const handleEventClick = async (eventId: string) => {
        // Increment the clicks in Firestore
        const eventRef = doc(db, "events", eventId);
        await updateDoc(eventRef, {
            clicks: increment(1),
        });

        // If on mobile, navigate directly to the event page without changing the selected state
        if (isMobile) {
            router.push(`/events/${eventId}`);
        } else {
            // If not on mobile, update the selected event locally
            setEvent({ ...event, selected: eventId });
        }
    };

    return (
        <div>
            <Collapsible defaultOpen={isOpen} className="p-4" onOpenChange={() => setIsOpen(!isOpen)}>
                <CollapsibleTrigger className="flex w-full justify-between text-left text-sm font-semibold py-0.5 gap-1">
                    {/* Left-aligned date */}
                        <span>{triggerDate}</span>

                    {/* Right-aligned number of events */}
                    <div className="flex items-center">
                        <span className="text-muted-foreground">{`${events.length}`}</span>
                        {isOpen ? <Minus className="w-4 h-4 ml-2" /> : <Plus className="w-4 h-4 ml-2" />}
                    </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 pt-2">
                    {events.map((item) => {
                        const startDate = parseISO(item.startDate);
                        const endDate = parseISO(item.endDate);
                    
                        // Calculate the index of the collapsible date relative to the event's start date
                        const collapsibleDate = parseISO(date);
                        const dateIndex = differenceInDays(collapsibleDate, startDate);
                    
                        // Use dateIndex to get the corresponding time entry for this collapsible date
                        let timeEntry = item.times[dateIndex];

                        // If timeEntry is undefined and times array has only one entry, use that single entry
                        if (!timeEntry && item.times.length === 1) {
                            timeEntry = item.times[0];
                        }

                        // Check if timeEntry exists before trying to format the time
                        const formattedTime = timeEntry
                            ? `${formatEventTime(timeEntry.startTime)} - ${formatEventTime(timeEntry.endTime)}`
                            : "Time not available";
                    
                        // Format the display date for rendering
                        const formattedDate = startDate.getTime() === endDate.getTime()
                            ? format(startDate, "MMM d")
                            : `${format(startDate, "MMM d")} - ${format(endDate, "MMM d")}`;

                        return (
                            <button
                                key={item.id}
                                className={cn(
                                    'flex flex-row w-full items-start gap-4 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent',
                                    event.selected === item.id && "bg-muted"
                                )}
                                onClick={() => handleEventClick(item.id)}
                            >
                                <Image
                                    src={item.image || "/tempFlyer1.svg"}
                                    alt={item.name}
                                    width={150}
                                    height={150}
                                    loading="lazy"
                                    className={cn(
                                        "w-24 object-cover rounded-lg"
                                    )}
                                />
                                <div className="flex flex-col gap-2 w-full min-w-0">
                                    <div className="flex flex-col">
                                        <div className="line-clamp-1 text-base font-semibold">{item.name}</div>
                                        <div className="line-clamp-1 text-sm font-medium">{formattedDate}</div>
                                        <div className="line-clamp-1 text-sm font-medium">{formattedTime}</div>
                                    </div>
                                    <div className="inline-flex gap-1 whitespace-nowrap overflow-hidden text-ellipsis w-full max-w-full">
                                        <Badge
                                            className={cn(
                                                "inline-block",
                                                item.eventDurationType === "single" && "bg-green-200 text-black hover:bg-green-200",
                                                item.eventDurationType === "multi" && "bg-blue-200 text-black hover:bg-blue-200",
                                                item.eventDurationType === "extended" && "bg-purple-200 text-black hover:bg-purple-200"
                                            )}
                                        >
                                            {item.eventDurationType === "single"
                                                ? "Single Day"
                                                : item.eventDurationType === "multi"
                                                ? "Multi-Day"
                                                : "Extended"}
                                        </Badge>
                                        {item.category.map((cat, index) => {
                                            const categoryLabel = categoryOptions.find(option => option.value === cat)?.label || "Unknown";
                                            return (
                                                <Badge key={index} variant="outline" className="inline-block">
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