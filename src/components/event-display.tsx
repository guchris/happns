// Next Imports
import Link from "next/link";
import Image from "next/image";

// Shadcn Imports
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

// App Imports
import { Event } from "@/components/types";
import EventActions from "@/components/event-actions";
import EventComments from "@/components/event-comments";
import ClientButton from "@/components/client-button";
import { categoryOptions, formatOptions, neighborhoodOptions } from "@/lib/selectOptions";

// Other Imports
import { format, parse, differenceInDays } from "date-fns";

interface EventDisplayProps {
    event: Event;
}

function formatEventDate(dateString: string) {
    if (dateString.includes(" - ")) {
        // Handle date ranges like "09/14/2024 - 09/15/2024"
        const [startPart, endPart] = dateString.split(" - ");
        const startDate = parse(startPart.trim(), "MM/dd/yyyy", new Date());
        const endDate = parse(endPart.trim(), "MM/dd/yyyy", new Date());

        // Format both dates
        const formattedStartDate = format(startDate, "EEE, MMM d"); // "Sat, Sep 14"
        const formattedEndDate = format(endDate, "EEE, MMM d");     // "Sun, Sep 15"
        
        return `${formattedStartDate} - ${formattedEndDate}`;
    } else {
        // Handle single dates like "09/14/2024"
        const date = parse(dateString.trim(), "MM/dd/yyyy", new Date());
        return format(date, "EEE, MMM d"); // "Sat, Sep 14"
    }
}

function formatEventTime(timeString: string) {
    if (timeString.includes(" - ")) {
        // Handle time ranges like "09:00 AM - 05:00 PM"
        const [startTime, endTime] = timeString.split(" - ");
        const parsedStartTime = parse(startTime.trim(), "hh:mm a", new Date());
        const parsedEndTime = parse(endTime.trim(), "hh:mm a", new Date());

        // Format the times to remove unnecessary zeros
        const formattedStartTime = format(parsedStartTime, "h:mm a"); // "9:00 AM"
        const formattedEndTime = format(parsedEndTime, "h:mm a");     // "5:00 PM"
        
        return `${formattedStartTime} - ${formattedEndTime}`;
    } else {
        // Handle single time like "09:00 AM"
        const parsedTime = parse(timeString.trim(), "hh:mm a", new Date());
        return format(parsedTime, "h:mm a"); // "9:00 AM"
    }
}

function formatEventCost(cost: { type: "single" | "range" | "minimum"; value: number | [number, number] }) {
    switch (cost.type) {
        case "single":
            return `$${cost.value}`;
        case "range":
            if (Array.isArray(cost.value)) {
                return `$${cost.value[0]} - $${cost.value[1]}`;
            }
            return "";
        case "minimum":
            return `$${cost.value}+`;
        default:
            return "N/A";
    }
}

export function EventDisplay({ event }: EventDisplayProps) {
    const today = new Date();

    const categoryLabels = event?.category?.map(cat => categoryOptions.find(option => option.value === cat)?.label || "Unknown") || [];
    const formatLabel = formatOptions.find(option => option.value === event?.format)?.label || "Unknown";
    const city = event?.city || "";
    const neighborhoodsForCity = neighborhoodOptions[city] || [];
    const neighborhoodLabel = neighborhoodsForCity.find(option => option.value === event?.neighborhood)?.label || "Unknown";

    // Calculate the number of days away from the event start date
    const { startDate } = parseEventDate(event?.date || "");
    const daysAway = startDate ? differenceInDays(startDate, today) : null;

    let daysAwayLabel = "";
    if (daysAway === 0) {
        daysAwayLabel = "0";
    } else if (daysAway && daysAway < 0) {
        daysAwayLabel = "0";
    } else if (daysAway !== null) {
        daysAwayLabel = `${daysAway}`;
    } else {
        daysAwayLabel = "Date not available";
    }

    // Function to parse both single dates and date ranges
    function parseEventDate(dateString: string) {
        if (dateString.includes("-")) {
            // Handle ranges like "MM/dd/yyyy - MM/dd/yyyy"
            const [startPart, endPart] = dateString.split(" - ");
            const startDate = parse(startPart.trim(), "MM/dd/yyyy", new Date());
            const endDate = parse(endPart.trim(), "MM/dd/yyyy", new Date());
            return { startDate, endDate };
        } else {
            // Handle single dates like "MM/dd/yyyy"
            const date = parse(dateString, "MM/dd/yyyy", new Date());
            return { startDate: date, endDate: date }; // Same start and end date for single-day events
        }
    }

    return (
        <ScrollArea>
            <div className="flex h-full flex-col">
                <div className="flex items-center justify-between p-2">
                    <ClientButton />
                    <EventActions event={event} />
                </div>

                <Separator />

                {/* Event Details */}
                {event ? (
                    <div className="flex flex-1 flex-col">


                        <div className="p-4">
                            <div className="grid gap-4 text-sm">

                                {/* Event Image */}
                                {event.image && (
                                    <div className="flex justify-center mb-4">
                                        <Image
                                            src={event.image || "/tempFlyer1.svg"}
                                            alt={event.name}
                                            width={300}
                                            height={300}
                                            className="object-cover rounded-lg"
                                            loading="lazy"
                                        />
                                    </div>
                                )}

                                {/* Event Name, Date, and Time */}
                                <div className="grid gap-1">
                                    <div className="text-lg font-semibold">{event.name}</div>
                                    <div className="text-base font-medium">{formatEventDate(event.date)}</div>
                                    <div className="text-sm font-medium">{formatEventTime(event.time)}</div>
                                </div>
                            </div>
                        </div>

                        <Separator />
                        
                        <div className="flex-1 whitespace-pre-wrap p-4 grid gap-4">
                            {/* Event Category, Format, Neighborhood */}
                            <div className="grid gap-1">
                                <div className="text-sm font-medium">
                                    <span className="text-muted-foreground">Categories: </span>
                                    {categoryLabels.map((label, index) => (
                                        <Badge key={index} variant="outline" className="inline-block mr-1">
                                            {label}
                                        </Badge>
                                    ))}
                                </div>
                                <div className="text-sm font-medium">
                                    <span className="text-muted-foreground">Format: </span>
                                    <Badge variant="outline" className="inline-block">
                                        {formatLabel}
                                    </Badge>
                                </div>
                                <div className="text-sm font-medium">
                                    <span className="text-muted-foreground">Neighborhood: </span>
                                    <Badge variant="outline" className="inline-block">
                                        {neighborhoodLabel}
                                    </Badge>
                                </div>
                                <div className="text-sm font-medium">
                                    <span className="text-muted-foreground">Days Away: </span>
                                    <Badge variant="outline" className="inline-block">
                                        {daysAwayLabel}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        <Separator />
                        
                        <div className="flex items-center gap-4">
                            {/* Event Location */}
                            <div className="flex-1 p-4">
                                <div className="text-sm font-medium text-muted-foreground">Location</div>
                                <Link href={event.gmaps} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-black underline">
                                    {event.location}
                                </Link>
                            </div>
                            <Separator orientation="vertical" className="h-auto self-stretch" />
                            <div className="flex-1 p-4">
                                <div className="text-sm font-medium text-muted-foreground">Cost</div>
                                <div className="text-sm font-medium">
                                    {event?.cost ? formatEventCost(event.cost) : "N/A"}
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Event Website */}
                        <div className="flex-1 p-4">
                            <div className="text-sm font-medium text-muted-foreground">External Website</div>
                            <Link href={event.link} passHref legacyBehavior>
                                <a
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm font-medium text-black underline break-words"
                                >
                                    {event.link}
                                </a>
                            </Link>
                        </div>

                        <Separator />

                        {/* Event Details */}
                        <div className="flex-1 whitespace-pre-wrap p-4 text-sm">
                            {event.details}
                        </div>

                        <Separator className="mt-auto" />

                        <EventComments eventId={event.id} />
                    </div>
                ) : (
                    <div className="p-8 text-center text-muted-foreground">
                        No event selected
                    </div>
                )}
            </div>
        </ScrollArea>
    )
}