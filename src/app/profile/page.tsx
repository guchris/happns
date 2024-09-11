"use client";

// React Imports
import { useRef, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext"

// Components Imports
import { TopBar } from "@/components/top-bar"

// Hooks Imports
import { toast } from "@/hooks/use-toast" 

// Shadcn Imports
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

import { ExclamationTriangleIcon } from "@radix-ui/react-icons"
  

export default function ProfilePage() {
    const inputRef = useRef<HTMLInputElement>(null);
    const { user } = useAuth();
    const [calendarLink, setCalendarLink] = useState<string>("");

    useEffect(() => {
        if (user?.uid) {
            // Generate the subscription link using the user's UID
            setCalendarLink(`webcal://ithappns.com/api/calendar-feed?userId=${user.uid}`);
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
        <div className="h-screen flex flex-col">
            <TopBar title={`happns/profile`} />
            <Separator />

            <div className="flex justify-center mt-4">
                <div className="w-full max-w-[800px] p-4 flex flex-col space-y-4">

                    {/* Generate dynamic link based on the user's ID */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold">Google Calendar Subscription Link</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-gray-600">
                                Subscribe to your bookmarked events by adding this link to your Google Calendar.
                            </p>
                            <div className="flex space-x-2">
                                <Input ref={inputRef} value={calendarLink} readOnly />
                                <Button variant="secondary" className="shrink-0" onClick={copyLink}>
                                    Copy Link
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                    
                    {/* Step-by-step guide */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-md font-semibold">How to Add This Calendar to Google Calendar</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <ol className="list-decimal list-inside text-gray-600 space-y-2">
                                <li>Copy the link above by clicking the "Copy Link" button.</li>
                                <li>
                                    Open <a href="https://calendar.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">Google Calendar</a> in your browser.
                                </li>
                                <li>On the left-hand sidebar, find the section labeled "Other calendars" and click the plus (<b>+</b>) icon next to it.</li>
                                <li>Select <b>"From URL"</b> from the menu.</li>
                                <li>Paste the link you copied earlier (starting with <b>webcal://</b>) into the field provided.</li>
                                <li>Click the <b>"Add calendar"</b> button.</li>
                                <li>Your bookmarked events will now appear in your Google Calendar. Google Calendar will automatically update with any changes you make to your bookmarks.</li>
                            </ol>
                            <Alert>
                                <ExclamationTriangleIcon className="h-4 w-4" />
                                <AlertTitle>Note</AlertTitle>
                                <AlertDescription>
                                    It may take some time for Google Calendar to refresh and sync new events. If you don't see changes immediately, give it a few minutes.
                                </AlertDescription>
                            </Alert>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}