"use client"

// Next and React Imports
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

// App Imports
import { useAuth } from "@/context/AuthContext"
import { Event } from "@/components/types"
import { useToast } from "@/hooks/use-toast"
import { updateAttendance } from "@/lib/eventUtils"

// Firebase Imports
import { db } from "@/lib/firebase"
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore"

// Shadcn Imports
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"

// Other Imports
import { parse } from 'date-fns'
import { Bookmark, BookmarkCheck, CalendarPlus, Link as LinkIcon, Pencil } from "lucide-react"

interface EventActionsProps {
    event: Event | null;
}

const EventActions = ({ event }: EventActionsProps) => {
    const router = useRouter();
    const { user, userData } = useAuth();
    const { toast } = useToast();

    const [isBookmarked, setIsBookmarked] = useState(false);
    const [attendanceStatus, setAttendanceStatus] = useState<"yes" | "maybe" | "no" | null>(null);
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

    useEffect(() => {
        if (user && event) {
            const fetchAttendanceStatus = async () => {
                try {
                    const attendanceRef = doc(db, `events/${event.id}/attendances`, user.uid);
                    const attendanceSnap = await getDoc(attendanceRef);
                    if (attendanceSnap.exists()) {
                        setAttendanceStatus(attendanceSnap.data().status); // Set initial attendance status
                    }
                } catch (error) {
                    console.error("Error fetching attendance status: ", error);
                }
            };
            fetchAttendanceStatus();
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

    const handleAttendanceChange = async (status: "yes" | "maybe" | "no") => {
        if (attendanceStatus === status) {
            // If the button is already selected, unselect it by setting to null
            setAttendanceStatus(null); // No attendance selected
            await updateAttendance(event!.id, user!.uid, null); // Pass null to remove attendance in Firestore
        } else {
            // Set the new status if it’s different and update in Firestore
            setAttendanceStatus(status);
            await updateAttendance(event!.id, user!.uid, status);
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

            {/* Attendance Buttons */}
            {user && event && (
                <div className="attendance-buttons flex gap-2">
                    <Button 
                        variant={attendanceStatus === "yes" ? "default" : "outline"} 
                        onClick={() => handleAttendanceChange("yes")}
                    >
                        yes
                    </Button>
                    <Button 
                        variant={attendanceStatus === "maybe" ? "default" : "outline"} 
                        onClick={() => handleAttendanceChange("maybe")}
                    >
                        maybe
                    </Button>
                    <Button 
                        variant={attendanceStatus === "no" ? "default" : "outline"} 
                        onClick={() => handleAttendanceChange("no")}
                    >
                        no
                    </Button>
                </div>
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
                                {isBookmarked ? "Remove Bookmark" : "Bookmark"}
                            </span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        {isBookmarked ? "Remove Bookmark" : "Bookmark"}
                    </TooltipContent>
                </Tooltip>
            )}

            {/* Calendar and Link Buttons */}
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" disabled={isDisabled} onClick={addToCalendar}>
                        <CalendarPlus className="h-4 w-4" />
                        <span className="sr-only">Add to Calendar</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>Add to Calendar</TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" disabled={isDisabled} onClick={handleCopyEventLink}>
                        <LinkIcon className="h-4 w-4" />
                        <span className="sr-only">Event Link</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>Event Link</TooltipContent>
            </Tooltip>
        </div>
    );
};

export default EventActions;