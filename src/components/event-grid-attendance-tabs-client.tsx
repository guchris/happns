"use client"

// Next and React Imports
import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"

// App Imports
import { Event } from "@/components/types"
import { formatEventDate } from "@/lib/eventUtils"
import { useAuth } from "@/context/AuthContext"
import { getFutureEvents, sortEventsByDateAndName } from "@/lib/eventUtils"

// Firebase Imports
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore"

// Shadcn Imports
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const EventGridAttendanceTabsClient = () => {
    const { user } = useAuth();
    const [attendingEvents, setAttendingEvents] = useState<Event[]>([]);
    const [maybeEvents, setMaybeEvents] = useState<Event[]>([]);
    // const [notAttendingEvents, setNotAttendingEvents] = useState<Event[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        if (user?.uid) {
            const fetchAttendanceData = async () => {
                setIsLoading(true);
                const userRef = doc(db, "users", user.uid);
                const attendanceRef = collection(userRef, "user-attendance");
                const attendanceSnapshot = await getDocs(attendanceRef);

                const attending: Event[] = [];
                const maybe: Event[] = [];
                // const notAttending: Event[] = [];

                for (const attendanceDoc of attendanceSnapshot.docs) {
                    const { status } = attendanceDoc.data();
                    const eventId = attendanceDoc.id;

                    const eventRef = doc(db, "events", eventId);
                    const eventDoc = await getDoc(eventRef);

                    if (eventDoc.exists()) {
                        const eventData = { id: eventId, ...eventDoc.data() } as Event;
                        if (status === "yes") attending.push(eventData);
                        if (status === "maybe") maybe.push(eventData);
                        // if (status === "not") notAttending.push(eventData);
                    }
                }

                const today = new Date();
                setAttendingEvents(sortEventsByDateAndName(getFutureEvents(attending, today)));
                setMaybeEvents(sortEventsByDateAndName(getFutureEvents(maybe, today)));
                // setNotAttendingEvents(sortEventsByDateAndName(getFutureEvents(notAttending, today)));

                setIsLoading(false);
            };

            fetchAttendanceData();
        } else {
            // If no user is logged in, set loading to false
            setIsLoading(false);
        }
    }, [user]);
    
    return (
        <div className="flex-1 max-w-[880px] md:max-w-[700px] lg:max-w-[880px] mx-auto p-4 space-y-4">

            {/* Header */}
            <div className="flex items-center space-x-2 text-xl font-semibold">
                <span>attending events</span>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="yes">
                <TabsList>
                    <TabsTrigger value="yes">yes</TabsTrigger>
                    <TabsTrigger value="maybe">maybe</TabsTrigger>
                    {/* <TabsTrigger value="not">not</TabsTrigger> */}
                </TabsList>

                <TabsContent value="yes">
                    {isLoading ? (
                        <div className="text-sm text-muted-foreground">loading attending events</div>
                    ) : (
                        <EventList events={attendingEvents} />
                    )}
                </TabsContent>

                <TabsContent value="maybe">
                    {isLoading ? (
                        <div className="text-sm text-muted-foreground">loading maybe events</div>
                    ) : (
                        <EventList events={maybeEvents} />
                    )}
                </TabsContent>

                {/* <TabsContent value="not">
                    <EventList events={notAttendingEvents} />
                </TabsContent> */}
            </Tabs>
        </div>
    )
}

const EventList = ({ events }: { events: Event[] }) => {
    return events.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-6">
            {events.map((event) => (
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
            ))}
        </div>
    ) : (
        <p className="text-sm text-muted-foreground">no attending events</p>
    );
}

export default EventGridAttendanceTabsClient;