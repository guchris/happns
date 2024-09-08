// React Imports
import { useEffect, useState } from "react";

// Next Imports
import Image from "next/image"
import Link from "next/link"

// Context Imports
import { useAuth } from "@/context/AuthContext";

// Firebase Imports
import { db } from "@/app/firebase";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

// Components Imports
import { Event } from "@/components/types"

// Shadcn Imports
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
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
    Link as LinkIcon,
    Bookmark,
    BookmarkCheck
} from "lucide-react"

// Other Imports
import { format, parse } from "date-fns";

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

// Function to format event times
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

interface EventDisplayProps {
    event: Event | null
    onBack: () => void
}

export function EventDisplay({ event, onBack }: EventDisplayProps) {
    const today = new Date()
    const { toast } = useToast()
    const { user } = useAuth()
    const [isBookmarked, setIsBookmarked] = useState(false)

    // Function to check if the event is already bookmarked
    useEffect(() => {
        if (user && event) {
            const checkIfBookmarked = async () => {
                const bookmarkRef = doc(db, `users/${user.uid}/user-bookmarks`, event.id);
                const bookmarkSnap = await getDoc(bookmarkRef);

                setIsBookmarked(bookmarkSnap.exists()); // Set state based on bookmark existence
            };
            checkIfBookmarked();
        }
    }, [user, event]);

    const addBookmark = async () => {
        if (!user || !event) return;

        try {
            const bookmarkRef = doc(db, `users/${user.uid}/user-bookmarks`, event.id);
            await setDoc(bookmarkRef, {});

            setIsBookmarked(true)
            toast({
                title: "Event Bookmarked",
                description: `You have bookmarked the event: ${event.name}`,
            });
        } catch (error) {
            console.error("Error adding bookmark: ", error);
            toast({
                title: "Error",
                description: "Failed to bookmark the event",
                variant: "destructive",
            });
        }
    };

    const removeBookmark = async () => {
        if (!user || !event) return;

        try {
            const bookmarkRef = doc(db, `users/${user.uid}/user-bookmarks`, event.id);
            await deleteDoc(bookmarkRef);

            setIsBookmarked(false);
            toast({
                title: "Bookmark Removed",
                description: `You have removed the bookmark for: ${event.name}`,
            });
        } catch (error) {
            console.error("Error removing bookmark: ", error);
            toast({
                title: "Error",
                description: "Failed to remove the bookmark",
                variant: "destructive",
            });
        }
    };

    const handleBookmarkClick = () => {
        if (isBookmarked) {
            removeBookmark();
        } else {
            addBookmark();
        }
    };

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

    const handleCopyEventLink = async () => {
        if (event) {
            const eventUrl = `${window.location.origin}/events/${event.id}`;

            try {
                await navigator.clipboard.writeText(eventUrl);
            } catch (err) {
                console.error("Failed to copy event URL: ", err);
            }
        }
    };

    return (
        <ScrollArea>
            <div className="flex h-full flex-col">
                <div className="flex items-center justify-between p-2">

                    {/* Back Button */}
                    <Button variant="ghost" size="icon" disabled={!event} onClick={onBack}>
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Back to List</span>
                    </Button>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                        {user && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        disabled={!event}
                                        onClick={handleBookmarkClick}
                                    >
                                        {isBookmarked ? (
                                            <BookmarkCheck className="h-4 w-4" />
                                        ) : (
                                            <Bookmark className="h-4 w-4" />
                                        )}
                                        <span className="sr-only">
                                            {isBookmarked ? "Remove Bookmark" : "Bookmark"}
                                        </span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    {isBookmarked ? "Remove Bookmark" : "Bookmark"}
                                </TooltipContent>
                            </Tooltip>
                        )}
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
                                <Button 
                                    variant="ghost"
                                    size="icon"
                                    disabled={!event}
                                    onClick={() => {
                                        handleCopyEventLink()
                                        toast({
                                          title: "Copied Event Link "
                                        })
                                      }}
                                >
                                    <LinkIcon className="h-4 w-4" />
                                    <span className="sr-only">Event Link</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Event Link</TooltipContent>
                        </Tooltip>
                    </div>
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
                                    <span className="text-muted-foreground">Category: </span>
                                    <Badge variant="outline" className="inline-block">
                                        {event.category}
                                    </Badge>
                                </div>
                                <div className="text-sm font-medium">
                                    <span className="text-muted-foreground">Format: </span>
                                    <Badge variant="outline" className="inline-block">
                                        {event.format}
                                    </Badge>
                                </div>
                                <div className="text-sm font-medium">
                                    <span className="text-muted-foreground">Neighborhood: </span>
                                    <Badge variant="outline" className="inline-block">
                                        {event.neighborhood}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        <Separator />
                        
                        <div className="flex items-center gap-4">
                            {/* Event Location */}
                            <div className="flex-1 p-4">
                                <div className="text-sm font-medium text-muted-foreground">Location</div>
                                <Link href={event.gmaps} passHref legacyBehavior>
                                    <a
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm font-medium text-black underline"
                                    >
                                        {event.location}
                                    </a>
                                </Link>
                            </div>
                            <Separator orientation="vertical" className="h-auto self-stretch" />
                            <div className="flex-1 p-4">
                                <div className="text-sm font-medium text-muted-foreground">Cost</div>
                                <div className="text-sm font-medium">${event.cost}</div>
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
                                    className="text-sm font-medium text-black underline"
                                >
                                    {event.link}
                                </a>
                            </Link>
                        </div>

                        <Separator />

                        {/* Event Description */}
                        <div className="flex-1 whitespace-pre-wrap p-4 text-sm">{event.description}</div>

                        <Separator />

                        {/* Event Details */}
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