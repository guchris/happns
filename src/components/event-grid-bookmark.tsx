"use client"

// Next and React Imports
import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"

// App Imports
import { useAuth } from "@/context/AuthContext"
import { Event } from "@/components/types"
import { formatEventDate, getFutureEvents, sortEventsByDate } from "@/lib/eventUtils"


// Firebase Imports
import { db } from "@/lib/firebase"
import { doc, collection, getDocs, getDoc, query, limit } from "firebase/firestore"

// Shadcn Imports
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

const EventGridBookmark = () => {
    const { user } = useAuth();
    const [bookmarkedEvents, setBookmarkedEvents] = useState<Event[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchBookmarkedEvents = async () => {
            if (user) {
                try {
                    const bookmarksRef = collection(db, "users", user.uid, "user-bookmarks");
                    const bookmarkedEventsQuery = query(bookmarksRef, limit(8));
                    const querySnapshot = await getDocs(bookmarkedEventsQuery);
                    
                    const today = new Date();
                    const events: Event[] = [];
                    for (const bookmarkDoc of querySnapshot.docs) {
                        const eventId = bookmarkDoc.id;
                        const eventRef = doc(db, "events", eventId);
                        const eventDoc = await getDoc(eventRef);
                        if (eventDoc.exists()) {
                            events.push(eventDoc.data() as Event);
                        }
                    }

                    const futureEvents = getFutureEvents(events, today);
                    const sortedFutureEvents = sortEventsByDate(futureEvents);

                    setBookmarkedEvents(sortedFutureEvents);
                } catch (error) {
                    console.error("Error fetching bookmarked events:", error);
                } finally {
                    setIsLoading(false);
                }
            }
        };

        fetchBookmarkedEvents();
    }, [user]);

    if (!user) {
        return null;
    }

    return (
        <div className="flex-1 max-w-[880px] md:max-w-[700px] lg:max-w-[880px] mx-auto p-4 space-y-4">

            {/* Header */}
            <div className="flex items-center space-x-2 text-xl font-semibold">
                <span>your boomarked events</span>
            </div>

            {/* Events Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
            {isLoading ? (
                    <p className="text-sm text-muted-foreground">loading bookmarks...</p>
                ) : (
                    bookmarkedEvents.length > 0 ? (
                        bookmarkedEvents.map((event) => (
                            <Card key={event.id} className="w-full">
                                <Link href={`/events/${event.id}`} className="no-underline">
                                    <CardHeader className="p-2">
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
                                        <CardTitle className="line-clamp-1 text-base font-semibold mt-2">{event.name}</CardTitle>
                                        <CardDescription className="text-sm text-muted-foreground">{formatEventDate(event.startDate, event.endDate)}</CardDescription>
                                    </CardHeader>
                                </Link>
                            </Card>
                        ))
                    ) : (
                        <p className="text-sm text-muted-foreground">no bookmarked events</p>
                    )
                )}
            </div>
        </div>
    )
}

export default EventGridBookmark;