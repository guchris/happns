"use client"

// Next and React Imports
import { useRouter } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import React from "react"

// App Imports
import { useAuth } from "@/context/AuthContext"
import { Event } from "@/components/types"
import { useToast } from "@/hooks/use-toast"
import SuggestEditDialog from "@/components/dialog-suggest-edit"
import { formatEventDate } from "@/lib/eventUtils"

// Firebase Imports
import { db } from "@/lib/firebase"
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore"

// Shadcn Imports
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"

// Other Imports
import { parse } from 'date-fns'
import { Download, Bookmark, BookmarkCheck, CalendarPlus, Link as LinkIcon, Pencil } from "lucide-react"

interface EventActionsProps {
    event: Event | null;
}

const EventActions = ({ event }: EventActionsProps) => {
    const router = useRouter();
    const { user, userData } = useAuth();
    const { toast } = useToast();

    const [isBookmarked, setIsBookmarked] = useState(false);
    const isDisabled = !event;

    useEffect(() => {
        if (user && event) {
            const checkIfBookmarked = async () => {
                try {
                    const bookmarkRef = doc(db, `users/${user.uid}/user-bookmarks`, event.id);
                    const bookmarkSnap = await getDoc(bookmarkRef);
                    setIsBookmarked(bookmarkSnap.exists());
                } catch (error) {
                    console.error("Error checking bookmark: ", error);
                }
            };
            checkIfBookmarked();
        }
    }, [user, event]);

    const addBookmark = async () => {
        if (!user || !event) return;

        try {
            const bookmarkRef = doc(db, `users/${user.uid}/user-bookmarks`, event.id);
            await setDoc(bookmarkRef, {});
            setIsBookmarked(true);
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

    function getGoogleCalendarLink(event: Event) {
        const firstTimeEntry = event.times[0];
    
        // Parse the start and end times with the correct format
        const eventStartDateTime = parse(`${event.startDate} ${firstTimeEntry.startTime}`, "yyyy-MM-dd h:mm a", new Date());
        const eventEndDateTime = parse(`${event.endDate} ${firstTimeEntry.endTime}`, "yyyy-MM-dd h:mm a", new Date());
    
        // Convert to ISO string format and remove unwanted characters
        const startDateTime = eventStartDateTime.toISOString().replace(/-|:|\.\d\d\d/g, "");
        const endDateTime = eventEndDateTime.toISOString().replace(/-|:|\.\d\d\d/g, "");
    
        return `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.name)}&dates=${startDateTime}/${endDateTime}&details=${encodeURIComponent(event.details)}&location=${encodeURIComponent(event.location)}&sf=true&output=xml`;
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
                toast({
                    title: "Copied Event Link",
                });
            } catch (err) {
                console.error("Failed to copy event URL: ", err);
            }
        }
    };

    const generateAndDownloadImage = () => {
        if (!event) return;

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
            console.error("Canvas context not available.");
            return;
        }

        // Set canvas dimensions
        const width = 1080;
        const height = 1920;
        canvas.width = width;
        canvas.height = height;

        // Draw background
        ctx.fillStyle = "#ffffff"; // White background
        ctx.fillRect(0, 0, width, height);

        // Draw event image
        if (event.image) {
            const img = new Image();
            img.src = event.image;
            img.crossOrigin = "anonymous"; // Avoid CORS issues
            console.log("Attempting to load image:", event.image);
    
            img.onload = () => {
                const imgWidth = width * 0.8; // 80% of canvas width
                const imgHeight = height * 0.4; // 40% of canvas height
                const imgX = (width - imgWidth) / 2;
                const imgY = 50;
    
                ctx.drawImage(img, imgX, imgY, imgWidth, imgHeight);
                console.log("Image successfully loaded and drawn on canvas.");
    
                // Draw text after the image has loaded
                drawText(ctx, width, height);
                triggerDownload(canvas);
            };
    
            img.onerror = () => {
                console.error("Failed to load event image. Rendering text only.");
                drawText(ctx, width, height);
                triggerDownload(canvas);
            };
        } else {
            console.warn("No event image provided. Rendering text only.");
            drawText(ctx, width, height);
            triggerDownload(canvas);
        }
    };

    const drawText = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
        const textPadding = 40; // Padding from the top and left
        const lineSpacing = 20; // Spacing between lines
    
        // Calculate positions
        let currentY = textPadding;
    
        // Draw "happns/"
        ctx.fillStyle = "#000000";
        ctx.font = "36px Arial";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText("happns/", textPadding, currentY);
    
        // Move to the next line
        currentY += 40 + lineSpacing;
    
        // Draw event name
        ctx.font = "44px Arial"; // Larger font for event name
        ctx.fillText(event!.name || "Event Name", textPadding, currentY);
    
        // Move to the next line
        currentY += 40 + lineSpacing;
    
        // Draw formatted event dates
        const formattedDate = formatEventDate(event!.startDate, event!.endDate);
        ctx.font = "36px Arial";
        ctx.fillText(formattedDate, textPadding, currentY);
    };
    

    const triggerDownload = (canvas: HTMLCanvasElement) => {
        const link = document.createElement("a");
        link.download = `${event!.name?.replace(/\s+/g, "_") || "event_image"}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();

        // Show toast notification
        toast({
            title: "Image Downloaded",
            description: `The shareable event image for "${event!.name}" has been downloaded successfully.`,
        });
    };

    return (
        <div className="flex items-center gap-2">
            
            {/* Curator Edit Button */}
            {user && userData?.role === "curator" && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            disabled={isDisabled}
                            onClick={() => {
                                if (event) {
                                    router.push(`/event-form?id=${event.id}`);
                                }
                            }}
                        >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">edit event</span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>edit event</TooltipContent>
                </Tooltip>
            )}

            {/* Suggest Edit Button */}
            {user && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <SuggestEditDialog event={event} user={user} />
                    </TooltipTrigger>
                    <TooltipContent>suggest edits</TooltipContent>
                </Tooltip>
            )}

            {/* Bookmark Button */}
            {user && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            disabled={isDisabled}
                            onClick={handleBookmarkClick}
                        >
                            {isBookmarked ? (
                                <BookmarkCheck className="h-4 w-4" />
                            ) : (
                                <Bookmark className="h-4 w-4" />
                            )}
                            <span className="sr-only">
                                {isBookmarked ? "remove bookmark" : "bookmark"}
                            </span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        {isBookmarked ? "remove bookmark" : "bookmark"}
                    </TooltipContent>
                </Tooltip>
            )}

            {/* Calendar Button */}
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" disabled={isDisabled} onClick={addToCalendar}>
                        <CalendarPlus className="h-4 w-4" />
                        <span className="sr-only">add to calendar</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>add to calendar</TooltipContent>
            </Tooltip>

            {/* Link Button */}
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" disabled={isDisabled} onClick={handleCopyEventLink}>
                        <LinkIcon className="h-4 w-4" />
                        <span className="sr-only">event link</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>event link</TooltipContent>
            </Tooltip>

            {/* Download Shareable Image Button */}
            {event && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            disabled={!event}
                            onClick={generateAndDownloadImage}
                        >
                            <Download className="h-4 w-4" />
                            <span className="sr-only">download shareable image</span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>download shareable image</TooltipContent>
                </Tooltip>
            )}
        </div>
    );
};

export default EventActions;