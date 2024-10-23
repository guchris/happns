"use client"

// Next Imports
import Link from "next/link"

// App Imports
import { useAuth } from "@/context/AuthContext"

// Shadcn Imports
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

export default function JoinCard() {
    const { user } = useAuth();
    if (user) return null;
    return (
        <div className="flex-1 max-w-[880px] md:max-w-[700px] lg:max-w-[880px] mx-auto p-4 space-y-4">
            <Card className="w-full bg-neutral-50 border-none">
                <CardHeader>
                    <CardTitle className="text-xl font-semibold">join happns</CardTitle>
                    <CardDescription className="mt-8 text-sm">
                        Join happns today to easily bookmark events, leave comments, sync events to your Google Calendar, and access exclusive event stats - unlock all these features and more!
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Link href="/auth?signup=true">
                        <Button>sign up</Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
    )
}