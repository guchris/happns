"use client";

// React Imports
import { useRef } from "react";

// Components Imports
import { TopBar } from "@/components/top-bar";

// Hooks Imports
import { toast } from "@/hooks/use-toast" 

// Shadcn Imports
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function ProfilePage() {
    const inputRef = useRef<HTMLInputElement>(null);

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
                    <div className="space-y-2">
                        <h2 className="text-lg font-semibold">Google Calendar Subscription Link</h2>
                        <p className="text-sm text-gray-600">
                            Subscribe to your bookmarked events by adding this link to your Google Calendar.
                        </p>
                    </div>
                    <div className="flex space-x-2">
                        <Input ref={inputRef} value="http://happns.com/google-calendar-subscription" readOnly />
                        <Button variant="secondary" className="shrink-0" onClick={copyLink}>
                            Copy Link
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}