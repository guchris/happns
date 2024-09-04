// Next Imports
import Image from "next/image"

// Components Imports
import { Event } from "@/components/types"

// Shadcn Imports
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"

// Icon Imports
import {
    ArrowLeft,
    CalendarPlus,
    SquareArrowOutUpRight,
    MapPin,
    Send
} from "lucide-react"

// Other Imports
import { parse } from "date-fns";


interface EventDisplayProps {
    event: Event | null
    onBack: () => void
}

export function EventDisplay({ event, onBack }: EventDisplayProps) {
    const today = new Date()

    const openExternalLink = () => {
        if (event && event.link) {
            window.open(event.link, "_blank")
        }
    }

    const openGoogleMapsLink = () => {
        if (event && event.gmaps) {
            window.open(event.gmaps, "_blank")
        }
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

    function getGoogleCalendarLink(event: Event) {
        // Parse the event's date using the new parse function
        const { startDate, endDate } = parseEventDate(event.date);
    
        // Format dates for Google Calendar (YYYYMMDDTHHMMSSZ)
        const startDateTime = new Date(`${startDate.toDateString()} ${event.time.split(" - ")[0]}`).toISOString().replace(/-|:|\.\d\d\d/g, "");
        const endDateTime = event.time.split(" - ")[1]
            ? new Date(`${endDate.toDateString()} ${event.time.split(" - ")[1]}`).toISOString().replace(/-|:|\.\d\d\d/g, "")
            : new Date(startDate.getTime() + 3600000).toISOString().replace(/-|:|\.\d\d\d/g, ""); // Default to 1 hour if no end time
    
        // Return the Google Calendar link with the parsed dates
        return `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.name)}&dates=${startDateTime}/${endDateTime}&details=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.location)}&sf=true&output=xml`;
    }
    

    const addToCalendar = () => {
        if (event) {
            const googleCalendarLink = getGoogleCalendarLink(event);
            window.open(googleCalendarLink, "_blank");
        }
    };

    return (
        <ScrollArea>
            <div className="flex h-full flex-col">
                <div className="flex items-center justify-between p-2">

                    {/* Back Button */}
                    <Button variant="ghost" size="icon" onClick={onBack}>
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Back to List</span>
                    </Button>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" disabled={!event} onClick={addToCalendar}>
                                    <CalendarPlus className="h-4 w-4" />
                                    <span className="sr-only">Add to Calendar</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Add to Calendar</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" disabled={!event} onClick={openExternalLink}>
                                    <SquareArrowOutUpRight className="h-4 w-4" />
                                    <span className="sr-only">External Link</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>External Link</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" disabled={!event} onClick={openGoogleMapsLink}>
                                    <MapPin className="h-4 w-4" />
                                    <span className="sr-only">Directions</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Directions</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" disabled={!event}>
                                    <Send className="h-4 w-4" />
                                    <span className="sr-only">Share</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Share</TooltipContent>
                        </Tooltip>
                    </div>
                </div>

                <Separator />

                {/* Event Details */}
                {event ? (
                    <div className="flex flex-1 flex-col">
                        <div className="flex items-start p-4">
                            <div className="flex items-start gap-4 text-sm">
                                <div className="grid gap-2">
                                    {event.image && (
                                        <Image
                                            src={event.image || "/tempFlyer1.svg"}
                                            alt={event.name}
                                            width={300}
                                            height={300}
                                            className="object-cover rounded-lg"
                                        />
                                    )}
                                    <div className="grid gap-1">
                                        <div className="text-base font-semibold">{event.name}</div>
                                        <div className="text-sm font-medium">{event.date}</div>
                                        <div className="text-sm font-medium">{event.time}</div>
                                    </div>
                                    <div className="grid gap-1">
                                        <div className="text-sm">{event.location}</div>
                                        <div className="text-sm">
                                            <span>Cost: $</span>{event.cost}
                                        </div>
                                    </div>
                                    <div className="text-sm text-muted-foreground">{event.description}</div>
                                </div>
                            </div>
                        </div>
                        <Separator />
                        <div className="flex-1 whitespace-pre-wrap p-4 text-sm">
                            {event.details}
                        </div>
                        <Separator className="mt-auto" />
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