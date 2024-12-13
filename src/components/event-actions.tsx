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
    
        // Draw gray background
        const { bgX, bgY, bgWidth, bgHeight } = drawGrayBackground(ctx, width, height);

        // Draw text and image inside the gray background
        drawTextAndImage(ctx, event, bgX, bgY, bgWidth, bgHeight);
    };
    
    const drawText = (
        ctx: CanvasRenderingContext2D,
        width: number,
        height: number
    ): number => {
        const padding = 40;
        const lineSpacing = 20;
        const grayBackgroundColor = "#FAFAFA";
        const grayTextColor = "#78716C";

        // Gray background dimensions
        const bgWidth = width * 0.8; // 80% of canvas width
        const bgHeight = height * 0.6; // 60% of canvas height
        const bgX = (width - bgWidth) / 2; // Center horizontally
        const bgY = (height - bgHeight) / 2; // Center vertically

        // Draw rounded gray background
        const borderRadius = 20;
        ctx.fillStyle = grayBackgroundColor;
        ctx.beginPath();
        ctx.moveTo(bgX + borderRadius, bgY);
        ctx.arcTo(bgX + bgWidth, bgY, bgX + bgWidth, bgY + bgHeight, borderRadius);
        ctx.arcTo(bgX + bgWidth, bgY + bgHeight, bgX, bgY + bgHeight, borderRadius);
        ctx.arcTo(bgX, bgY + bgHeight, bgX, bgY, borderRadius);
        ctx.arcTo(bgX, bgY, bgX + bgWidth, bgY, borderRadius);
        ctx.closePath();
        ctx.fill();

        // Text positioning within the gray background
        let currentY = bgY + padding; // Start inside the gray background
        const textX = bgX + padding; // Align text with padding

        // Draw "happns/"
        ctx.fillStyle = "#000000"; // Black text
        ctx.font = "bold 36px Arial";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText("happns/", textX, currentY);

        // Move to next line
        currentY += 40 + lineSpacing;

        // Draw event name
        ctx.font = "bold 44px Arial";
        ctx.fillText(event!.name || "Event Name", textX, currentY);

        // Move to next line
        currentY += 50 + lineSpacing;

        // Draw formatted event dates
        const formattedDate = formatEventDate(event!.startDate, event!.endDate);
        ctx.fillStyle = grayTextColor; // Gray text
        ctx.font = "36px Arial";
        ctx.fillText(formattedDate, textX, currentY);
    
        return bgY + bgHeight; // Return the bottom Y-coordinate of the gray background
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

    const drawGrayBackground = (
        ctx: CanvasRenderingContext2D,
        width: number,
        height: number
    ): { bgX: number; bgY: number; bgWidth: number; bgHeight: number } => {
        const bgWidth = width * 0.8; // 80% of canvas width
        const bgHeight = height * 0.65; // 65% of canvas height
        const bgX = (width - bgWidth) / 2; // Center horizontally
        const bgY = (height - bgHeight) / 2; // Center vertically
    
        // Draw rounded gray background
        const borderRadius = 20;
        ctx.fillStyle = "#FAFAFA"; // Light gray background color
        ctx.beginPath();
        ctx.moveTo(bgX + borderRadius, bgY);
        ctx.arcTo(bgX + bgWidth, bgY, bgX + bgWidth, bgY + bgHeight, borderRadius);
        ctx.arcTo(bgX + bgWidth, bgY + bgHeight, bgX, bgY + bgHeight, borderRadius);
        ctx.arcTo(bgX, bgY + bgHeight, bgX, bgY, borderRadius);
        ctx.arcTo(bgX, bgY, bgX + bgWidth, bgY, borderRadius);
        ctx.closePath();
        ctx.fill();
    
        return { bgX, bgY, bgWidth, bgHeight };
    };

    const drawTextAndImage = (
        ctx: CanvasRenderingContext2D,
        event: Event,
        bgX: number,
        bgY: number,
        bgWidth: number,
        bgHeight: number
    ) => {
        const padding = 40; // Padding inside the gray background
        const verticalPadding = 20; // Additional vertical padding above "happns/"
        let currentY = bgY + padding + verticalPadding; // Start with extra padding above "happns/"
    
        // Draw "happns/"
        ctx.fillStyle = "#000000"; // Black text
        ctx.font = "bold 40px Arial";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText("happns/", bgX + padding, currentY);
    
        // Move to next section for the image
        currentY += 100;
    
        // Draw the event image
        const img = new Image();
        img.src = event.image;
        console.log("Event image URL:", event?.image);
        img.crossOrigin = "anonymous"; // Avoid CORS issues
    
        img.onload = () => {
            const imgSize = bgWidth - 2 * padding; // Image width matches gray background minus padding
            const imgX = bgX + padding; // Left-align inside the gray background
            const imgY = currentY; // Position the image below the "happns/" text
            const borderRadius = 20; // Rounded corners for the image
            ctx.save(); // Save the current canvas state before clipping
            drawRoundedImage(ctx, img, imgX, imgY, imgSize, imgSize, borderRadius); // Draw the rounded image
    
            // Move to the section below the image
            const textStartY = imgY + imgSize + 75; // Add some spacing below the image
    
            // Draw event name
            ctx.fillStyle = "#000000"; // Black text
            ctx.font = "bold 40px Arial";
            ctx.fillText(event.name || "Event Name", bgX + padding, textStartY);
    
            // Move to next line for date
            const dateY = textStartY + 75;
            ctx.fillStyle = "#78716C"; // Gray text color
            ctx.font = "36px Arial";
            const formattedDate = formatEventDate(event.startDate, event.endDate);
            ctx.fillText(formattedDate, bgX + padding, dateY);
    
            // Move to next line for time
            const timeY = dateY + 40;
            ctx.fillText(`${event.times[0].startTime} - ${event.times[0].endTime}`, bgX + padding, timeY);
    
            console.log("Image and text successfully drawn on canvas.");
            triggerDownload(ctx.canvas); // Trigger download after everything is drawn
        };
    
        img.onerror = () => {
            console.error("Failed to load event image. Skipping image rendering.");
            triggerDownload(ctx.canvas); // Proceed with text-only image
        };
    };
    
    const drawEventImage = (
        ctx: CanvasRenderingContext2D,
        textBottomY: number,
        width: number,
        height: number
    ) => {

        if (!event?.image) {
            console.error("No event image provided.");
            triggerDownload(ctx.canvas); // Proceed with text-only image if no image exists
            return;
        }

        const img = new Image();
        img.src = event.image;
        img.crossOrigin = "anonymous"; // Avoid CORS issues
    
        img.onload = () => {
            // Calculate square dimensions
            const maxImageSize = width * 0.8; // 80% of canvas width
            const imgSize = Math.min(maxImageSize, height * 0.4); // Constrain by both width and height
            const imgX = (width - imgSize) / 2; // Center horizontally
            const imgY = textBottomY + 20; // Place below the text with padding
            
            // Add rounded corners
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(imgX + 20, imgY); // Top-left corner
            ctx.arcTo(imgX + imgSize, imgY, imgX + imgSize, imgY + imgSize, 20); // Top-right corner
            ctx.arcTo(imgX + imgSize, imgY + imgSize, imgX, imgY + imgSize, 20); // Bottom-right corner
            ctx.arcTo(imgX, imgY + imgSize, imgX, imgY, 20); // Bottom-left corner
            ctx.arcTo(imgX, imgY, imgX + imgSize, imgY, 20); // Close path
            ctx.clip();
            ctx.drawImage(img, imgX, imgY, imgSize, imgSize);
            ctx.restore();

            triggerDownload(ctx.canvas); // Trigger download after image is drawn
        };
    
        img.onerror = () => {
            console.error("Failed to load placeholder image. Skipping image rendering.");
            triggerDownload(ctx.canvas); // Proceed with text-only image
        };
    };

    const triggerDownload = (canvas: HTMLCanvasElement) => {
        const link = document.createElement("a");
        link.download = `happns_${event!.name?.replace(/\s+/g, "_") || "happns_event_image"}.png`;
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