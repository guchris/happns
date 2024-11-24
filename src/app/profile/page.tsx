"use client"

// Next and React Imports
import Image from "next/image"
import Link from "next/link"
import { useRef, useEffect, useState } from "react"

// App Imports
import { useAuth } from "@/context/AuthContext"
import { TopBar } from "@/components/top-bar"
import Footer from "@/components/footer"
import EmptyPage from "@/components/empty-page"
import EventGridBookmarkTabs from "@/components/event-grid-bookmark-tabs"
import EventGridAttendanceTabs from "@/components/event-grid-attendance-tabs"
import { toast } from "@/hooks/use-toast" 
import { getInitials } from "@/lib/userUtils"

// Firebase Imports
import { db } from "@/lib/firebase"
import { doc, getDoc, collection, getDocs } from "firebase/firestore"

// Shadcn Imports
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ExclamationTriangleIcon, CopyIcon, Pencil1Icon, Share2Icon } from "@radix-ui/react-icons"

export default function ProfilePage() {
    const inputRef = useRef<HTMLInputElement>(null);
    const { user, loading } = useAuth();
    const [calendarLink, setCalendarLink] = useState<string>("");
    const [userInfo, setUserInfo] = useState<any>(null);
    const [bookmarkCount, setBookmarkCount] = useState<number>(0);
    const [attendedCount, setAttendedCount] = useState<number>(0);
    const [bookmarkedEvents, setBookmarkedEvents] = useState<any[]>([]);
    const [attendingEvents, setAttendingEvents] = useState<any[]>([]);
    const [maybeEvents, setMaybeEvents] = useState<any[]>([]);
    const [notAttendingEvents, setNotAttendingEvents] = useState<any[]>([]);

    useEffect(() => {
        if (user?.uid) {
            // Generate the subscription link using the user's UID
            setCalendarLink(`webcal://ithappns.com/api/calendar-feed?userId=${user.uid}`);

            // Fetch user information from Firestore
            const fetchUserInfo = async () => {
                try {
                    const userRef = doc(db, "users", user.uid);
                    const userDoc = await getDoc(userRef);

                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        setUserInfo(userData);
                    } else {
                        console.error("No such user document!");
                    }

                    // Fetch user bookmarks count
                    const bookmarksRef = collection(userRef, "user-bookmarks");
                    const bookmarksSnapshot = await getDocs(bookmarksRef);
                    setBookmarkCount(bookmarksSnapshot.size);

                    // Fetch attended events count
                    const attendanceRef = collection(userRef, "user-attendance");
                    const attendanceSnapshot = await getDocs(attendanceRef);
                    const attending = [];
                    const maybe = [];
                    const notAttending = [];

                    for (const attendanceDoc of attendanceSnapshot.docs) {
                        const { status } = attendanceDoc.data();
                        const eventId = attendanceDoc.id;
                        const eventRef = doc(db, "events", eventId);
                        const eventDoc = await getDoc(eventRef);
                    
                        if (eventDoc.exists()) {
                            const eventData = { id: eventId, ...eventDoc.data() };
                            if (status === "yes") attending.push(eventData);
                            if (status === "maybe") maybe.push(eventData);
                            if (status === "not") notAttending.push(eventData);
                        }
                    }

                    // Update state with categorized events
                    setAttendingEvents(attending);
                    setMaybeEvents(maybe);
                    setNotAttendingEvents(notAttending);

                    // Update attended count for stats display
                    setAttendedCount(attending.length);

                    // Fetch the actual event details for each bookmark
                    const eventPromises = bookmarksSnapshot.docs.map(async (bookmarkDoc) => {
                        const eventId = bookmarkDoc.id;
                        const eventRef = doc(db, "events", eventId);
                        const eventDoc = await getDoc(eventRef);
                        return eventDoc.exists() ? { id: eventId, ...eventDoc.data() } : null;
                    });

                    const eventDetails = await Promise.all(eventPromises);
                    const validEvents = eventDetails.filter(Boolean);
                    setBookmarkedEvents(validEvents);
                } catch (error) {
                    console.error("Error fetching user data: ", error);
                }
            };

            fetchUserInfo();
        }
    }, [user]);

    const copyLink = () => {
        const link = inputRef.current?.value;
        if (link) {
            navigator.clipboard.writeText(link)
                .then(() => {
                    // Show toast notification
                    toast({
                        title: "Link Copied",
                        description: "The subscription link has been copied to your clipboard.",
                    });
                })
                .catch((err) => {
                    // Handle error if copy fails
                    toast({
                        title: "Error",
                        description: "Failed to copy the link. Please try again.",
                        variant: "destructive",
                    });
                });
        }
    };

    const shareProfile = () => {
        const profileLink = `https://ithappns.com/profile/${userInfo.username}`;
        navigator.clipboard.writeText(profileLink)
            .then(() => {
                toast({
                    title: "Profile Link Copied",
                    description: "The profile link has been copied to your clipboard.",
                });
            })
            .catch((err) => {
                toast({
                    title: "Error",
                    description: "Failed to copy the profile link. Please try again.",
                    variant: "destructive",
                });
            });
    };

    if (loading) {
        return <EmptyPage title="happns/profile" description="loading..." />;
    }

    if (!user) {
        return (
            <div className="min-h-screen flex flex-col">
                <TopBar title={`happns/profile`} />
                <Separator />
                <div className="px-4">
                    <Alert className="max-w-3xl my-6 mx-auto p-4">
                        <ExclamationTriangleIcon className="h-4 w-4" />
                        <AlertTitle>Not Authorized</AlertTitle>
                        <AlertDescription>
                            You do not have permission to view this page. Please <Link href="/auth" className="text-blue-500">login</Link>.
                        </AlertDescription>
                    </Alert>
                </div>
                <Footer className="mt-auto" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col">
            <TopBar title={`happns/profile`} />
            <Separator />

            {userInfo && (
                <div className="flex flex-1 flex-col">
                    <div className="p-4 flex gap-4">

                        {/* User Avatar */}
                        <div className="flex justify-left">
                            <Avatar className="h-24 w-24">
                                {userInfo.profilePicture ? (
                                    <Image
                                        src={userInfo.profilePicture}
                                        alt="Profile Picture"
                                        width={96}
                                        height={96}
                                        className="h-full w-full object-cover rounded-full"
                                    />
                                ) : (
                                    <AvatarFallback>{getInitials(userInfo.name)}</AvatarFallback>
                                )}
                            </Avatar>
                        </div>

                        {/* User Name and Username */}
                        <div className="flex flex-col">
                            <div className="text-lg font-semibold">{userInfo.name}</div>
                            <div className="text-base font-medium">@{userInfo.username}</div>
                        </div>
                        
                        {/* User Profile Quick Actions */}
                        <div className="ml-auto flex space-x-2">
                            <Link href="/settings">
                                <Button variant="outline" size="icon">
                                    <Pencil1Icon className="h-4 w-4" />
                                </Button>
                            </Link>
                            <Button variant="outline" size="icon" onClick={shareProfile}>
                                <Share2Icon className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <Separator />

                    {/* User Badges */}
                    <div className="flex whitespace-pre-wrap p-4 grid gap-4">
                        <div className="grid gap-2">

                            {/* Email */}
                            <div className="text-sm font-medium flex items-center space-x-2">
                                <span className="text-muted-foreground w-10">email</span>
                                <Badge variant="outline" className="inline-block">
                                    {userInfo.email}
                                </Badge>
                            </div>

                            {/* City */}
                            {userInfo.selectedCity && (
                                <div className="text-sm font-medium flex items-center space-x-2">
                                    <span className="text-muted-foreground w-10">city</span>
                                    <Link href={`/${userInfo.selectedCity.toLowerCase()}`} passHref>
                                        <Badge 
                                            variant="outline"
                                            className="inline-block"
                                        >
                                            {userInfo.selectedCity}
                                        </Badge>
                                    </Link>
                                </div>
                            )}

                            {/* Role */}
                            <div className="text-sm font-medium flex items-center space-x-2">
                                <span className="text-muted-foreground w-10">role</span>
                                <Badge variant="outline" className="inline-block">
                                    {userInfo.role}
                                </Badge>
                            </div>

                            {/* Instagram Handle */}
                            {userInfo.instagram && (
                                <div className="text-sm font-medium flex items-center space-x-2">
                                    <span className="text-muted-foreground w-10">insta</span>
                                    <Badge variant="outline" className="inline-block">
                                        <a 
                                            href={`https://www.instagram.com/${userInfo.instagram}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-inherit no-underline"
                                        >
                                            @{userInfo.instagram}
                                        </a>
                                    </Badge>
                                </div>
                            )}
                        </div>
                    </div>

                    <Separator />
                    
                    {/* User Stats */}
                    <div className="flex items-center gap-4">
                        <div className="flex-1 p-4">
                            <div className="text-sm font-medium text-muted-foreground">bookmarked</div>
                            <div className="text-sm font-medium">
                                {bookmarkCount} events bookmarked
                            </div>
                        </div>
                        <Separator orientation="vertical" className="h-auto self-stretch" />
                        <div className="flex-1 p-4">
                            <div className="text-sm font-medium text-muted-foreground">attended</div>
                            <div className="text-sm font-medium">
                                {attendedCount} events attended
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* User Calendar Link */}
                    <div className="flex-col p-4 space-y-2">
                        <div className="text-sm font-medium text-muted-foreground">google calendar subscription link</div>
                        <div className="space-y-2">
                            <p className="text-sm">
                                subscribe to your bookmarked events by adding this link to your gcal
                            </p>
                            <div className="flex space-x-2">
                                <Input ref={inputRef} value={calendarLink} readOnly />
                                <Button type="submit" className="px-4" onClick={copyLink}>
                                    <span className="sr-only">Copy</span>
                                    <CopyIcon className="h-4 w-4" />
                                </Button>
                            </div>
                            <Collapsible>
                                <CollapsibleTrigger asChild>
                                    <Button variant="outline">instructions</Button>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="pt-4 space-y-4">
                                    <ol className="list-decimal list-inside text-sm space-y-2">
                                        <li>Copy the link above by clicking the &quot;Copy Link&quot; button.</li>
                                        <li>
                                            Open <a href="https://calendar.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">Google Calendar</a> in your browser.
                                        </li>
                                        <li>On the left-hand sidebar, find the section labeled &quot;Other calendars&quot; and click the plus (<b>+</b>) icon next to it.</li>
                                        <li>Select <b>&quot;From URL&quot;</b> from the menu.</li>
                                        <li>Paste the link you copied earlier (starting with <b>webcal://</b>) into the field provided.</li>
                                        <li>Click the <b>&quot;Add calendar&quot;</b> button.</li>
                                        <li>Your bookmarked events will now appear in your Google Calendar. Google Calendar will automatically update with any changes you make to your bookmarks.</li>
                                    </ol>
                                    <Alert>
                                        <ExclamationTriangleIcon className="h-4 w-4" />
                                        <AlertTitle>note</AlertTitle>
                                        <AlertDescription>
                                            Google Calendar will get updated event information roughly every 24 hours.
                                        </AlertDescription>
                                    </Alert>
                                </CollapsibleContent>
                            </Collapsible>
                        </div>
                    </div>

                    <Separator />
                    
                    {/* User Attendance Events */}
                    <EventGridAttendanceTabs
                        attendingEvents={attendingEvents}
                        maybeEvents={maybeEvents}
                        notAttendingEvents={notAttendingEvents}
                    />

                    <Separator />

                    {/* User Bookmarked Events */}
                    <EventGridBookmarkTabs bookmarkedEvents={bookmarkedEvents} />

                </div>
            )}

            <Footer className="mt-auto" />
        </div>
    )
}