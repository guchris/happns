"use client"

// Next Imports
import Link from "next/link"
import Image from "next/image"

// App Imports
import { cn } from "@/lib/utils"
import { Event } from "@/components/types"
import EventActions from "@/components/event-actions"
import EventAttendance from "@/components/event-attendance"
import EventComments from "@/components/event-comments"
import ClientButton from "@/components/client-button"
import { categoryOptions } from "@/lib/selectOptions"
import { formatEventDate, formatEventCost, formatEventTime, getShortWebsite } from "@/lib/eventUtils"
import { useAuth } from "@/context/AuthContext"

// Shadcn Imports
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

// Other Imports
import { differenceInDays, parseISO, addDays, format } from "date-fns"
import React, { useState } from "react"

interface EventDisplayProps {
    event: Event | null;
}

export function EventDisplay({ event }: EventDisplayProps) {
    const { user } = useAuth();
    const today = new Date();
    const [showAllTimes, setShowAllTimes] = useState(false);
    const maxVisible = 3;

    const categoryLabels = event?.category?.map(cat => categoryOptions.find(option => option.value === cat)?.label || "Unknown") || [];
    const city = event?.city || "";

    // Calculate the number of days away from the event start date
    const startDate = event?.startDate ? parseISO(event.startDate) : null;
    const endDate = event?.endDate ? parseISO(event.endDate) : null;
    let daysAway: number | null = null;
    let hasEventPassed = false;
    if (event?.eventDurationType === "multi" || event?.eventDurationType === "extended") {
        daysAway = startDate ? differenceInDays(startDate, today) : null;
        hasEventPassed = endDate ? differenceInDays(endDate, today) < 0 : false;
    } else {
        daysAway = startDate ? differenceInDays(startDate, today) : null;
        hasEventPassed = daysAway !== null && daysAway < 0;
    }

    let daysAwayLabel = "";
    let daysAwayBadgeVariant: "outline" | "default" | "secondary" | "destructive" = "outline";
    if (hasEventPassed) {
        daysAwayLabel = "Event Has Passed";
        daysAwayBadgeVariant = "destructive";
    } else if (daysAway === 0) {
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
                                    <div className="flex justify-center my-4">
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

                                {user && (
                                    <div className="flex items-center justify-center mb-2">
                                        <EventAttendance key={event.id} event={event} />
                                    </div>
                                )}

                                {/* Event Name, Date, and Time */}
                                <div className="grid gap-1">
                                    <div className="text-lg font-semibold">{event.name}</div>
                                    <div className="text-base font-medium">{formatEventDate(event.startDate, event.endDate)}</div>

                                    {/* Conditionally render either the single time or times array */}
                                    {event.times.length === 1 ? (
                                        <div className="text-base font-medium">
                                            {`${formatEventTime(event.times[0].startTime)} - ${formatEventTime(event.times[0].endTime)}`}
                                        </div>
                                    ) : (
                                        <div className="grid gap-1">
                                            {(showAllTimes ? event.times : event.times.slice(0, maxVisible)).map((time: any, idx: number) => {
                                                const currentDate = startDate ? addDays(startDate, idx) : null;
                                                const formattedDate = currentDate ? format(currentDate, 'EEE, MMM d') : '';
                                                return (
                                                    <div key={idx} className="flex items-center">
                                                        <span className="font-medium w-28 min-w-max">{formattedDate}</span>
                                                        <span className="text-muted-foreground">
                                                            {`${formatEventTime(time.startTime)} - ${formatEventTime(time.endTime)}`}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                            {event.times.length > maxVisible && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    type="button"
                                                    className="mt-1 px-2 py-1 h-auto text-xs bg-accent"
                                                    onClick={() => setShowAllTimes((prev) => !prev)}
                                                >
                                                    {showAllTimes
                                                        ? 'Show less'
                                                        : `Show ${event.times.length - maxVisible} more...`}
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Event Badge Details */}
                        <div className="flex whitespace-pre-wrap p-4 grid gap-4">
                            <div className="grid gap-2">

                                {/* Event Duration */}
                                {event.eventDurationType && (
                                    <div className="text-sm font-medium flex items-center space-x-2">
                                        <span className="text-muted-foreground w-28">Event Duration</span>
                                        <Badge
                                            className={cn(
                                                "inline-block",
                                                event.eventDurationType === "single" && "bg-green-200 text-black hover:bg-green-200",
                                                event.eventDurationType === "multi" && "bg-blue-200 text-black hover:bg-blue-200",
                                                event.eventDurationType === "extended" && "bg-purple-200 text-black hover:bg-purple-200"
                                            )}
                                        >
                                            {event.eventDurationType === "single"
                                                ? "Single Day"
                                                : event.eventDurationType === "multi"
                                                ? "Multi-Day"
                                                : "Extended"}
                                        </Badge>
                                    </div>
                                )}

                                {/* Categories */}
                                {categoryLabels.length > 0 && (
                                    <div className="text-sm font-medium flex items-center space-x-2">
                                        <span className="text-muted-foreground w-28">Categories</span>
                                        <div className="flex flex-wrap gap-2">
                                            {categoryLabels.map((label, index) => (
                                                <Badge key={index} variant="outline" className="inline-block">
                                                    {label}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Days Away */}
                                <div className="text-sm font-medium flex items-center space-x-2">
                                    <span className="text-muted-foreground w-28">Days Away</span>
                                    <Badge
                                        variant={daysAwayBadgeVariant}
                                        className="inline-block"
                                    >
                                        {daysAwayLabel}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                        
                        <Separator />
                        
                        {/* Event Location and Cost */}
                        <div className="flex items-center">
                            <Link href={event.link} passHref legacyBehavior>
                                <a
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 p-4 block cursor-pointer hover:bg-muted transition"
                                    style={{ textDecoration: 'none' }}
                                >
                                    <div className="text-sm font-medium text-muted-foreground">Location</div>
                                    <div className="line-clamp-1 text-sm font-medium text-black underline break-words">
                                        {event.location}
                                    </div>
                                </a>
                            </Link>
                            <Separator orientation="vertical" className="h-auto self-stretch" />
                            <div className="flex-1 p-4">
                                <div className="text-sm font-medium text-muted-foreground">Cost</div>
                                <div className="text-sm font-medium">
                                    {event?.cost && (typeof event.cost === 'number' ? event.cost === 0 : event.cost.value === 0)
                                        ? 'FREE'
                                        : event?.cost
                                            ? formatEventCost(event.cost)
                                            : 'N/A'}
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Event Website */}
                        <Link href={event.link} passHref legacyBehavior>
                            <a
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 p-4 block cursor-pointer hover:bg-muted transition"
                                style={{ textDecoration: 'none' }}
                            >
                                <div className="text-sm font-medium text-muted-foreground">Website</div>
                                <div className="line-clamp-1 text-sm font-medium text-black underline break-words">
                                    {getShortWebsite(event.link)}
                                </div>
                            </a>
                        </Link>

                        <Separator />

                        {/* Event Stats */}
                        {user ? (
                            <div className="flex items-center gap-4">
                                <div className="flex-1 p-4">
                                    <div className="text-sm font-medium text-muted-foreground">Clicks</div>
                                    <div className="text-sm font-medium">
                                        {event.clicks}
                                    </div>
                                </div>
                                <Separator orientation="vertical" className="h-auto self-stretch" />
                                <div className="flex-1 p-4">
                                    <div className="text-sm font-medium text-muted-foreground">Going</div>
                                    <div className="text-sm font-medium">
                                        {event.attendanceSummary.yesCount}
                                    </div>
                                </div>
                                <Separator orientation="vertical" className="h-auto self-stretch" />
                                <div className="flex-1 p-4">
                                    <div className="text-sm font-medium text-muted-foreground">Maybe</div>
                                    <div className="text-sm font-medium">
                                        {event.attendanceSummary.maybeCount}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 text-sm text-muted-foreground">
                                Please <a href={`/auth`} className="underline">
                                    login
                                </a> to view event stats
                            </div>
                        )}

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