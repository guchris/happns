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
import { doc, collection, getDocs, getDoc, query, where } from "firebase/firestore"

const EventGridAttending = () => {
    const { user } = useAuth();
    const [attendingEvents, setAttendingEvents] = useState<Event[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAttendingEvents = async () => {
            if (!user) return;

            try {
                const attendanceRef = collection(db, "users", user.uid, "user-attendance");
                const q = query(attendanceRef, where("status", "==", "yes"));
                const querySnapshot = await getDocs(q);

                const today = new Date();

                // Fetch event documents in parallel
                const eventPromises = querySnapshot.docs.map((attendanceDoc) => {
                    const eventId = attendanceDoc.data().eventId;
                    const eventRef = doc(db, "events", eventId);
                    return getDoc(eventRef);
                });

                const eventDocs = await Promise.all(eventPromises);

                const events = eventDocs
                    .filter((eventDoc) => eventDoc.exists())
                    .map((eventDoc) => ({
                        ...eventDoc.data(),
                        id: eventDoc.id,
                    }) as Event);

                const futureEvents = getFutureEvents(events, today);
                const sortedFutureEvents = sortEventsByDate(futureEvents);
                const closestUpcomingEvents = sortedFutureEvents.slice(0, 8);

                setAttendingEvents(closestUpcomingEvents);
            } catch (error) {
                console.error("Error fetching attending events:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAttendingEvents();
    }, [user]);

    if (!user) {
        return null;
    }

    return (
        <div className="flex-1 max-w-[880px] md:max-w-[700px] lg:max-w-[880px] mx-auto p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center space-x-2 text-xl font-semibold">
                <span>attending events</span>
            </div>

            {/* Events Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-6">
                {isLoading ? (
                    <p className="text-sm text-muted-foreground">loading attending events...</p>
                ) : attendingEvents.length > 0 ? (
                    attendingEvents.map((event) => (
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
                                <div className="line-clamp-1 text-base font-semibold mt-1">{event.name}</div>
                                <div className="line-clamp-1 text-sm text-muted-foreground">
                                    {formatEventDate(event.startDate, event.endDate)}
                                </div>
                            </Link>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-muted-foreground">no events marked as attending</p>
                )}
            </div>
        </div>
    );
}

export default EventGridAttending;