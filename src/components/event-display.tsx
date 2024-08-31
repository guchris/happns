import {
    CalendarPlus,
    Send,
    Link
} from "lucide-react"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"

import { Event } from "@/app/data"

interface EventDisplayProps {
    event: Event | null
}

export function EventDisplay({ event }: EventDisplayProps) {
    const today = new Date()

    const openExternalLink = () => {
        if (event && event.link) {
            window.open(event.link, "_blank")
        }
    }

    function getGoogleCalendarLink(event: Event) {
        // Parse the date
        const eventDate = new Date(`${event.date} ${event.time.split(" - ")[0]}`);
        const eventEndTime = event.time.split(" - ")[1];
        
        // If the event spans multiple days, use the end date; otherwise, assume it ends the same day
        const eventEndDate = eventEndTime 
            ? new Date(`${event.date} ${eventEndTime}`)
            : new Date(eventDate.getTime() + 3600000); // Default to 1 hour duration if no end time
    
        // Format dates for Google Calendar (YYYYMMDDTHHMMSSZ)
        const startDate = eventDate.toISOString().replace(/-|:|\.\d\d\d/g, "");
        const endDate = eventEndDate.toISOString().replace(/-|:|\.\d\d\d/g, "");
    
        return `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.name)}&dates=${startDate}/${endDate}&details=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.location)}&sf=true&output=xml`;
    }
    

    const addToCalendar = () => {
        if (event) {
            const googleCalendarLink = getGoogleCalendarLink(event);
            window.open(googleCalendarLink, "_blank");
        }
    };

    return (
        <ScrollArea className="h-screen">
            <div className="flex h-full flex-col">
                <div className="flex items-center p-2">
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
                                <Button variant="ghost" size="icon" disabled={!event}>
                                    <Send className="h-4 w-4" />
                                    <span className="sr-only">Share</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Share</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" disabled={!event} onClick={openExternalLink}>
                                    <Link className="h-4 w-4" />
                                    <span className="sr-only">External Link</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>External Link</TooltipContent>
                        </Tooltip>
                    </div>
                </div>
                <Separator />
                {event ? (
                    <div className="flex flex-1 flex-col">
                        <div className="flex items-start p-4">
                            <div className="flex items-start gap-4 text-sm">
                                <div className="grid gap-2">
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
                                    <div className="text-sm text-muted-foreground">{event.subject}</div>
                                </div>
                            </div>
                        </div>
                        <Separator />
                        <div className="flex-1 whitespace-pre-wrap p-4 text-sm">
                            {event.description}
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