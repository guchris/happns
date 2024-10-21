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
import { toast } from "@/hooks/use-toast" 
import { getInitials } from "@/lib/userUtils"
import { formatEventDate } from "@/lib/eventUtils"

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

function sortByDateAndName(events: any[]): any[] {
    return events.sort((a, b) => {
        const dateA = new Date(a.startDate).getTime();
        const dateB = new Date(b.startDate).getTime();

        // First, compare by date
        if (dateA < dateB) return -1;
        if (dateA > dateB) return 1;

        // If the dates are the same, compare alphabetically by name
        return a.name.localeCompare(b.name);
    });
}

export default function ProfilePage() {
    const inputRef = useRef<HTMLInputElement>(null);
    const { user, loading } = useAuth();
    const [calendarLink, setCalendarLink] = useState<string>("");
    const [userInfo, setUserInfo] = useState<any>(null);
    const [bookmarkCount, setBookmarkCount] = useState<number>(0);
    const [bookmarkedEvents, setBookmarkedEvents] = useState<any[]>([]);

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

                    // Fetch the actual event details for each bookmark
                    const eventPromises = bookmarksSnapshot.docs.map(async (bookmarkDoc) => {
                        const eventId = bookmarkDoc.id;
                        const eventRef = doc(db, "events", eventId);
                        const eventDoc = await getDoc(eventRef);
                        return eventDoc.exists() ? { id: eventId, ...eventDoc.data() } : null;
                    });

                    const eventDetails = await Promise.all(eventPromises);

                    const validEvents = eventDetails.filter(Boolean);
                    const sortedEvents = sortByDateAndName(validEvents);

                    setBookmarkedEvents(sortedEvents);
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
                                        width={96} // Use appropriate size for your avatar
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
                                <span className="text-muted-foreground w-10">Email</span>
                                <Badge variant="outline" className="inline-block">
                                    {userInfo.email}
                                </Badge>
                            </div>

                            {/* City */}
                            {userInfo.selectedCity && (
                                <div className="text-sm font-medium flex items-center space-x-2">
                                    <span className="text-muted-foreground w-10">City</span>
                                    <Badge variant="outline" className="inline-block">
                                        {userInfo.selectedCity}
                                    </Badge>
                                </div>
                            )}

                            {/* Role */}
                            <div className="text-sm font-medium flex items-center space-x-2">
                                <span className="text-muted-foreground w-10">Role</span>
                                <Badge variant="outline" className="inline-block">
                                    {userInfo.role}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    <Separator />
                    
                    {/* User Stats */}
                    <div className="flex items-center gap-4">
                        <div className="flex-1 p-4">
                            <div className="text-sm font-medium text-muted-foreground">Bookmarked</div>
                            <div className="text-sm font-medium">
                                {bookmarkCount} events bookmarked
                            </div>
                        </div>
                        <Separator orientation="vertical" className="h-auto self-stretch" />
                        <div className="flex-1 p-4">
                            <div className="text-sm font-medium text-muted-foreground">Attended</div>
                            <div className="text-sm font-medium">
                                0 events attended
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* User Calendar Link */}
                    <div className="flex-col p-4 space-y-2">
                        <div className="text-sm font-medium text-muted-foreground">Google Calendar Subscription Link</div>
                        <div className="space-y-2">
                            <p className="text-sm">
                                Subscribe to your bookmarked events by adding this link to your Google Calendar.
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
                                    <Button variant="outline">Instructions</Button>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="p-4 space-y-4">
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
                                        <AlertTitle>Note</AlertTitle>
                                        <AlertDescription>
                                            Google Calendar will get updated event information roughly every 24 hours.
                                        </AlertDescription>
                                    </Alert>
                                </CollapsibleContent>
                            </Collapsible>
                        </div>
                    </div>

                    <Separator />

                    {/* User Bookmarked Events */}
                    <div className="p-4 space-y-4">
                        <div className="text-lg font-semibold">bookmarked events</div>
                        <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-6">
                            {bookmarkedEvents.length > 0 ? (
                                bookmarkedEvents.map((event) => (
                                    <div key={event.id} className="w-full">
                                        <Link href={`/events/${event.id}`} className="no-underline">
                                            <div className="aspect-w-1 aspect-h-1 w-full relative">
                                                <Image
                                                    src={event.image || "/tempFlyer1.svg"}
                                                    alt={event.name}
                                                    width={150}
                                                    height={150}
                                                    loading="lazy"
                                                    className="object-cover w-full h-full rounded-lg"
                                                />
                                            </div>
                                            <div className="line-clamp-1 text-base font-semibold mt-2">{event.name}</div>
                                            <div className="line-clamp-1 text-sm text-muted-foreground">
                                                {formatEventDate(event.startDate, event.endDate)}
                                            </div>
                                        </Link>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground">No bookmarked events found.</p>
                            )}
                        </div>
                    </div>

                </div>
            )}

            <Footer className="mt-auto" />
        </div>
    )
}