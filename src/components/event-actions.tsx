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
import { formatEventDate, formatEventTime } from "@/lib/eventUtils"

// Firebase Imports
import { db } from "@/lib/firebase"
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore"

// Shadcn Imports
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// Other Imports
import { parse } from 'date-fns'
import { Send, Download, Bookmark, BookmarkCheck, CalendarPlus, Link as LinkIcon, Pencil } from "lucide-react"

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

        // Log the values for debugging
        console.log("Parsing start:", event.startDate, firstTimeEntry.startTime);
        console.log("Parsing end:", event.endDate, firstTimeEntry.endTime);

        // Parse using 24-hour format
        const eventStartDateTime = parse(
            `${event.startDate} ${firstTimeEntry.startTime}`,
            "yyyy-MM-dd HH:mm",
            new Date()
        );
        const eventEndDateTime = parse(
            `${event.endDate} ${firstTimeEntry.endTime}`,
            "yyyy-MM-dd HH:mm",
            new Date()
        );

        // Check for invalid dates
        if (isNaN(eventStartDateTime.getTime()) || isNaN(eventEndDateTime.getTime())) {
            console.error("Invalid date(s) for Google Calendar link:", {
                start: event.startDate,
                startTime: firstTimeEntry.startTime,
                end: event.endDate,
                endTime: firstTimeEntry.endTime,
            });
            return "#";
        }

        const formatForCalendar = (date: Date) =>
            date
                .toISOString()
                .replace(/[-:]/g, "")
                .replace(/\.\d{3}Z$/, "Z"); // Keep the T and Z

        const startDateTime = formatForCalendar(eventStartDateTime);
        const endDateTime = formatForCalendar(eventEndDateTime);

        return `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
            event.name || "Event"
        )}&dates=${startDateTime}/${endDateTime}&details=${encodeURIComponent(
            event.details || ""
        )}&location=${encodeURIComponent(event.location || "")}&sf=true&output=xml`;
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
    
        // Draw black background
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, width, height);
    
        // Draw text and image in new style
        drawTextAndImage(ctx, event, width, height);
    };

    const drawRoundedImage = (
        ctx: CanvasRenderingContext2D,
        img: HTMLImageElement,
        x: number,
        y: number,
        width: number,
        height: number,
        borderRadius: number
    ) => {
        // Draw a rounded rectangle for the image clipping path
        ctx.beginPath();
        ctx.moveTo(x + borderRadius, y);
        ctx.arcTo(x + width, y, x + width, y + height, borderRadius);
        ctx.arcTo(x + width, y + height, x, y + height, borderRadius);
        ctx.arcTo(x, y + height, x, y, borderRadius);
        ctx.arcTo(x, y, x + width, y, borderRadius);
        ctx.closePath();
        ctx.clip(); // Clip the canvas to the rounded rectangle
    
        // Draw the image
        ctx.drawImage(img, x, y, width, height);
    
        // Restore the canvas state to avoid clipping other elements
        ctx.restore();
    };

    const wrapText = (
        ctx: CanvasRenderingContext2D,
        text: string,
        x: number,
        y: number,
        maxWidth: number,
        lineHeight: number,
        center: boolean = false
    ) => {
        const words = text.split(" ");
        let line = "";
        let currentY = y;
        ctx.textAlign = center ? "center" : ctx.textAlign;
        for (let i = 0; i < words.length; i++) {
            const testLine = line + words[i] + " ";
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            if (testWidth > maxWidth && i > 0) {
                ctx.fillText(line, x, currentY);
                line = words[i] + " ";
                currentY += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, currentY);
        return currentY + lineHeight;
    };    

    const drawTextAndImage = (
        ctx: CanvasRenderingContext2D,
        event: Event,
        width: number,
        height: number
    ) => {
        // Spacing and font constants
        const brandingFontSize = 64;
        const imageWidth = width * 0.6;
        const imageHeight = imageWidth;
        const imageBorderRadius = 32;
        const brandingSpacing = 80;
        const imageSpacing = 100;
        const eventNameFontSize = 56;
        const eventNameSpacing = 40;
        const eventDetailsFontSize = 40;
        const eventTimeSpacing = 20;
        const eventLocationSpacing = 20;

        // Prepare text for measurement
        ctx.font = `bold ${eventNameFontSize}px Arial`;
        const eventName = event.name || "Event Name";
        const maxTextWidth = width * 0.8;

        // Estimate wrapped event name height
        const eventNameWidth = ctx.measureText(eventName).width;
        const eventNameLines = Math.max(1, Math.ceil(eventNameWidth / maxTextWidth));
        const eventNameBlockHeight = eventNameLines * (eventNameFontSize + 8);

        // Calculate total content height
        const totalContentHeight =
            brandingFontSize +
            brandingSpacing +
            imageHeight +
            imageSpacing +
            eventNameBlockHeight +
            eventNameSpacing +
            eventDetailsFontSize + // date
            eventTimeSpacing +
            eventDetailsFontSize + // time
            eventLocationSpacing +
            eventDetailsFontSize; // location

        // Calculate top Y to vertically center
        const topY = (height - totalContentHeight) / 2;

        // Draw 'happns/' branding
        ctx.fillStyle = "#FFFFFF";
        ctx.font = `bold ${brandingFontSize}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText("happns/", width / 2, topY);

        // Draw event image (centered)
        const img = new window.Image();
        img.src = event.image;
        img.crossOrigin = "anonymous";
        img.onload = () => {
            let currentY = topY + brandingFontSize + brandingSpacing;
            const imgX = (width - imageWidth) / 2;
            ctx.save();
            drawRoundedImage(ctx, img, imgX, currentY, imageWidth, imageHeight, imageBorderRadius);
            ctx.restore();
            currentY += imageHeight + imageSpacing;

            // Draw event name (centered, bold, large, white)
            ctx.fillStyle = "#FFFFFF";
            ctx.font = `bold ${eventNameFontSize}px Arial`;
            ctx.textAlign = "center";
            ctx.textBaseline = "top";
            let wrappedY = wrapText(ctx, eventName, width / 2, currentY, maxTextWidth, eventNameFontSize + 8, true);
            currentY = wrappedY + eventNameSpacing;

            // Draw date (centered, white)
            ctx.font = `${eventDetailsFontSize}px Arial`;
            const formattedDate = formatEventDate(event.startDate, event.endDate);
            ctx.fillText(formattedDate, width / 2, currentY);
            currentY += eventDetailsFontSize + eventTimeSpacing;

            // Draw time (centered, white, with dash, formatted)
            const startTime = formatEventTime(event.times[0].startTime);
            const endTime = formatEventTime(event.times[0].endTime);
            const timeString = `${startTime} - ${endTime}`;
            ctx.fillText(timeString, width / 2, currentY);
            currentY += eventDetailsFontSize + eventLocationSpacing;

            // Draw location (centered, white)
            ctx.fillText(event.location || "Event Location", width / 2, currentY);

            triggerDownload(ctx.canvas);
        };
        img.onerror = () => {
            console.error("Failed to load event image. Skipping image rendering.");
            triggerDownload(ctx.canvas);
        };
    };

    const triggerDownload = (canvas: HTMLCanvasElement) => {
        const dataUrl = canvas.toDataURL("image/png");
    
        if (/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) {
            // For mobile devices
            const newTab = window.open("", "_blank");
            if (newTab) {
                newTab.document.body.style.margin = "0"; // Remove margin for full image view
                newTab.document.body.style.display = "flex";
                newTab.document.body.style.justifyContent = "center";
                newTab.document.body.style.alignItems = "center";
                const img = newTab.document.createElement("img");
                img.src = dataUrl;
                img.style.maxWidth = "100%"; // Ensure the image fits the screen
                img.style.maxHeight = "100%"; // Ensure the image fits the screen
                newTab.document.body.appendChild(img);
            } else {
                toast({
                    title: "Error",
                    description: "Unable to open the image. Please try again.",
                    variant: "destructive",
                });
            }
        } else {
            // For desktop devices
            const link = document.createElement("a");
            link.href = dataUrl;
            link.download = `happns_${event!.name?.replace(/\s+/g, "_") || "happns_event_image"}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
    
            toast({
                title: "Image Downloaded",
                description: `The shareable event image for "${event!.name}" has been downloaded successfully.`,
            });
        }
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
                            <span className="sr-only">Edit Event</span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Edit Event</TooltipContent>
                </Tooltip>
            )}

            {/* Suggest Edit Button */}
            {user && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <SuggestEditDialog event={event} user={user} />
                    </TooltipTrigger>
                    <TooltipContent>Suggest Edits</TooltipContent>
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
                                {isBookmarked ? "Remove Nookmark" : "Nookmark"}
                            </span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        {isBookmarked ? "Remove Nookmark" : "Nookmark"}
                    </TooltipContent>
                </Tooltip>
            )}

            {/* Calendar Button */}
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" disabled={isDisabled} onClick={addToCalendar}>
                        <CalendarPlus className="h-4 w-4" />
                        <span className="sr-only">Add to Calendar</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>Add to Calendar</TooltipContent>
            </Tooltip>

            {/* Share Button Options */}
            <Tooltip>
                <TooltipTrigger asChild>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" disabled={isDisabled}>
                                <Send className="h-4 w-4" />
                                <span className="sr-only">Share</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {/* Copy Link Option */}
                            <DropdownMenuItem onClick={handleCopyEventLink}>
                                Copy Event Link
                            </DropdownMenuItem>

                            {/* Download Shareable Image Option */}
                            <DropdownMenuItem onClick={generateAndDownloadImage}>
                                Download Image
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </TooltipTrigger>
                <TooltipContent>Share</TooltipContent>
            </Tooltip>
        </div>
    );
};

export default EventActions;