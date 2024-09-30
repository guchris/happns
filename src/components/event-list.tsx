// Next and React Imports
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

// App Imports
import { cn } from "@/lib/utils"
import { Event } from "@/components/types"
import { useEvent } from "@/hooks/use-event"
import { categoryOptions } from "@/lib/selectOptions"

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
import { format, parse, parseISO, isWithinInterval, eachDayOfInterval, isValid } from "date-fns"


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

    // Group events by the display date (either start date or today's date if within range)
    const eventsByDate = items.reduce((acc, item) => {
        const startDate = parseISO(item.startDate);
        const endDate = parseISO(item.endDate);

        // Use the new logic to determine whether to use today's date or start date
        const displayDate = getCurrentDateForDisplay(startDate, endDate);
        const isoDate = displayDate.toISOString().split("T")[0];

        if (!acc[isoDate]) {
            acc[isoDate] = [];
        }
        acc[isoDate].push(item);
        return acc;
    }, {} as Record<string, Event[]>);

    const firstEventDate = parseISO(new Date().toISOString().split("T")[0]);
    const lastEventDate = parseISO(
        items.reduce((latest, item) => {
            const endDate = parseISO(item.endDate);
            return endDate > latest ? endDate : latest;
        }, new Date(0)).toISOString().split("T")[0]
    );

    const allDates = eachDayOfInterval({ start: firstEventDate, end: lastEventDate });
    allDates.forEach((date) => {
        const isoDate = date.toISOString().split("T")[0];
        if (!eventsByDate[isoDate]) {
            eventsByDate[isoDate] = [];
        }
    });

    const sortedDates = Object.keys(eventsByDate).sort((a, b) => parseISO(a).getTime() - parseISO(b).getTime());

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
                            // Parse start and end dates using ISO strings
                            const startDate = parseISO(item.startDate);
                            const endDate = parseISO(item.endDate);

                            // Format the display date for rendering
                            const formattedDate = startDate.getTime() === endDate.getTime()
                                ? format(startDate, "MMM d")
                                : `${format(startDate, "MMM d")} - ${format(endDate, "MMM d")}`;

                            // Parse and format time strings separately from dates
                            let formattedTime = "Time not available";
                            if (item.time && item.time.includes(" - ")) {
                                const [startTime, endTime] = item.time.split(" - ");
                                try {
                                    // Parse and format time separately from dates
                                    const parsedStartTime = parse(startTime.trim(), "hh:mm a", new Date());
                                    const parsedEndTime = parse(endTime.trim(), "hh:mm a", new Date());
                                    if (isValid(parsedStartTime) && isValid(parsedEndTime)) {
                                        const formattedStartTime = format(parsedStartTime, "h:mm a");
                                        const formattedEndTime = format(parsedEndTime, "h:mm a");
                                        formattedTime = `${formattedStartTime} - ${formattedEndTime}`;
                                    }
                                } catch (error) {
                                    console.error("Error parsing time for event:", item, error);
                                }
                            }

                            return (
                                <button
                                    key={item.id}
                                    className={cn(
                                        // If isVerticalLayout is true, apply flex-col (image on top, text below), else apply flex-row for mobile
                                        `${isVerticalLayout ? 'flex-col' : 'flex-row'} md:flex-row flex w-full items-start gap-4 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent`,
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
                                            isVerticalLayout ? "w-full" : "w-28",
                                            "object-cover rounded-lg md:w-40 md:h-40"
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