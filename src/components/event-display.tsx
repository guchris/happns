// Next Imports
import Link from "next/link"
import Image from "next/image"

// Shadcn Imports
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

// App Imports
import { Event } from "@/components/types"
import EventActions from "@/components/event-actions"
import EventComments from "@/components/event-comments"
import ClientButton from "@/components/client-button"
import { categoryOptions, formatOptions, neighborhoodOptions } from "@/lib/selectOptions"
import { formatEventDate, formatEventCost } from "@/lib/eventUtils"

// Other Imports
import { differenceInDays, parseISO, addDays, format } from "date-fns"

interface EventDisplayProps {
    event: Event | null;
}

export function EventDisplay({ event }: EventDisplayProps) {
    const today = new Date();

    const categoryLabels = event?.category?.map(cat => categoryOptions.find(option => option.value === cat)?.label || "Unknown") || [];
    const formatLabel = formatOptions.find(option => option.value === event?.format)?.label || "Unknown";
    const city = event?.city || "";
    const neighborhoodsForCity = neighborhoodOptions[city] || [];
    const neighborhoodLabel = neighborhoodsForCity.find(option => option.value === event?.neighborhood)?.label || "Unknown";

    // Calculate the number of days away from the event start date
    const startDate = event?.startDate ? parseISO(event.startDate) : null;
    const endDate = event?.endDate ? parseISO(event.endDate) : null;
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

    return (
        <ScrollArea>
            <div className="flex h-full flex-col">
                <div className="flex items-center justify-between p-2">
                    <div className="md:hidden">
                        <ClientButton />
                    </div>
                    <div></div>
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
                                    <div className="text-base font-medium">{formatEventDate(event.startDate, event.endDate)}</div>

                                    {/* Conditionally render either the single time or times array */}
                                    {event.startDate === event.endDate ? (
                                        <div className="text-sm font-medium">
                                            {`${event.times[0].startTime} - ${event.times[0].endTime}`}
                                        </div>
                                    ) : (
                                        <div className="text-sm font-medium max-h-12 overflow-y-auto">
                                            {event.times?.map((time, index) => {
                                                const currentDate = startDate ? addDays(startDate, index) : null;
                                                const formattedDate = currentDate ? format(currentDate, 'MMM d') : '';

                                                return (
                                                    <div key={index} className="flex items-center font-normal">
                                                        <span className="inline-block w-20">{formattedDate}</span>
                                                        <span>{`${time.startTime} - ${time.endTime}`}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Event Category, Format, Neighborhood */}
                        <div className="flex-1 whitespace-pre-wrap p-4 grid gap-4">
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
                        
                        {/* Event Location and Cost */}
                        <div className="flex items-center gap-4">
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
                        
                        {/* Event Comments */}
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