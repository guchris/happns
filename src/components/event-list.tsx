// Next and React Imports
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

// App Imports
import { cn } from "@/lib/utils"
import { Event } from "@/components/types"
import { useEvent } from "@/hooks/use-event"
import { categoryOptions } from "@/lib/selectOptions"
import { sortEventsByDateAndName } from "@/lib/eventUtils"


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
import { format, parse, parseISO, isWithinInterval, eachDayOfInterval, differenceInDays } from "date-fns"


interface EventListProps {
    items: Event[]
    isVerticalLayout: boolean
    isFilterActive: boolean
}

export function EventList({ items, isVerticalLayout, isFilterActive }: EventListProps) {

    const today = new Date().toISOString().split("T")[0]; // ISO format for today's date

    // Group events by display date (today if within range, otherwise start date)
    const eventsByDate = items.reduce((acc, item) => {
        const startDate = parseISO(item.startDate);
        const endDate = parseISO(item.endDate);

        // Ensure multi-day events appear under today if today is within their date range
        const isTodayInRange = new Date(today).getTime() >= startDate.getTime() && new Date(today).getTime() <= endDate.getTime();

        if (isTodayInRange) {
            // If today is within the event's range, ensure the event is in today's collapsible
            if (!acc[today]) {
                acc[today] = [];
            }
            acc[today].push(item);
        } else if (startDate.getTime() > new Date(today).getTime()) {
            // Only create a collapsible for future events (skip past dates if they span today)
            const startIsoDate = startDate.toISOString().split("T")[0];
            if (!acc[startIsoDate]) {
                acc[startIsoDate] = [];
            }
            acc[startIsoDate].push(item);
        }

        return acc;
    }, {} as Record<string, Event[]>);

    // Sort the events in each collapsible by date and then alphabetically by name
    Object.keys(eventsByDate).forEach(date => {
        eventsByDate[date] = sortEventsByDateAndName(eventsByDate[date]);
    });

    // Sort the collapsibles by date, ensuring today comes first
    const sortedDates = Object.keys(eventsByDate).sort((a, b) => {
        if (a === today) return -1; // Ensure today's collapsible is first
        if (b === today) return 1;
        return parseISO(a).getTime() - parseISO(b).getTime();
    });

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
                                isVerticalLayout={isVerticalLayout}
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
    isVerticalLayout: boolean
}

function CollapsibleItem({ date, events, isLastItem, isVerticalLayout }: CollapsibleItemProps) {
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
            {events.length > 0 ? (
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
                            const timeEntry = item.times[dateIndex];
                            const formattedTime = `${timeEntry.startTime} - ${timeEntry.endTime}`;
                        
                            // Format the display date for rendering
                            const formattedDate = startDate.getTime() === endDate.getTime()
                                ? format(startDate, "MMM d")
                                : `${format(startDate, "MMM d")} - ${format(endDate, "MMM d")}`;

                            return (
                                <button
                                    key={item.id}
                                    className={cn(
                                        // If isVerticalLayout is true, apply flex-col (image on top, text below), else apply flex-row for mobile
                                        `${isVerticalLayout ? 'flex-col' : 'flex-row'} flex w-full items-start gap-4 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent`,
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
                                            isVerticalLayout ? "w-full" : "w-28", "object-cover rounded-lg md:w-40 md:h-40"
                                        )}
                                    />
                                    <div className="flex flex-col gap-2 w-full">
                                        <div className="flex flex-col gap-1">
                                            <div className="line-clamp-1 font-semibold">{item.name}</div>
                                            <div className="line-clamp-1 text-xs font-medium hidden md:inline-flex">{formattedDate}</div>
                                            <div className="line-clamp-1 text-xs font-medium">{formattedTime}</div>
                                        </div>
                                        <div className="line-clamp-2 text-xs text-muted-foreground">
                                            {item.details}
                                        </div>
                                        <div className="hidden md:inline-flex">
                                            <Badge variant="outline" className="inline-block">
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
            ) : (
                <div className="p-4 text-muted-foreground text-sm">
                    {/* Display date without being clickable if no events */}
                    <div className="flex justify-between">
                        <span>{triggerDate}</span>
                    </div>
                </div>
            )}
            {!isLastItem && <Separator />}
        </div>
    )
}