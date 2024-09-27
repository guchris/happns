"use client";

// React Imports
import { useRef, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext"

// App Imports
import { TopBar } from "@/components/top-bar"
import { Footer } from "@/components/footer"
import { toast } from "@/hooks/use-toast" 

// Firebase Imports
import { db } from "@/lib/firebase"
import { doc, getDoc, collection, getDocs } from "firebase/firestore"

// Shadcn Imports
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog"
  

// Icon Imports
import { ExclamationTriangleIcon, CopyIcon } from "@radix-ui/react-icons"

// Utility Function to get initials
function getInitials(name: string) {
    const [firstName, lastName] = name.split(" ");
    return firstName[0] + (lastName ? lastName[0] : "");
}
  

export default function ProfilePage() {
    const inputRef = useRef<HTMLInputElement>(null);
    const { user } = useAuth();
    const [calendarLink, setCalendarLink] = useState<string>("");
    const [userInfo, setUserInfo] = useState<any>(null);
    const [bookmarkCount, setBookmarkCount] = useState<number>(0);

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
                        setUserInfo(userDoc.data());
                    } else {
                        console.error("No such user document!");
                    }

                    // Fetch user bookmarks count
                    const bookmarksRef = collection(userRef, "user-bookmarks");
                    const bookmarksSnapshot = await getDocs(bookmarksRef);
                    setBookmarkCount(bookmarksSnapshot.size);
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

    return (
        <div className="min-h-screen flex flex-col">
            <TopBar title={`happns/profile`} />
            <Separator />

            {userInfo && (
                <div className="flex flex-1 flex-col">
                    <div className="p-4">
                        <div className="flex items-center gap-4">
                            {/* User Avatar */}
                            <div className="flex justify-left mb-4">
                                <Avatar className="h-24 w-24">
                                    <AvatarFallback>{getInitials(userInfo.name)}</AvatarFallback>
                                </Avatar>
                            </div>

                            {/* User Name and Username */}
                            <div className="grid gap-1">
                                <div className="text-lg font-semibold">{userInfo.name}</div>
                                <div className="text-base font-medium">@{userInfo.username}</div>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* User Role */}
                    <div className="flex whitespace-pre-wrap p-4 grid gap-4">
                        <div className="grid gap-2">
                            <div className="text-sm font-medium flex items-center space-x-2">
                                <span className="text-muted-foreground w-10">Email</span>
                                <Badge variant="outline" className="inline-block">
                                    {userInfo.email}
                                </Badge>
                            </div>
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
                                    <div className="text-base font-medium text-muted-foreground">Instructions</div>
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
                                            It may take some time for Google Calendar to refresh and sync new events. If you don&apos;t see changes immediately, give it a few minutes.
                                        </AlertDescription>
                                    </Alert>
                                </CollapsibleContent>
                            </Collapsible>
                        </div>
                    </div>
                </div>
            )}

            <Footer className="mt-auto" />
        </div>
    )
}