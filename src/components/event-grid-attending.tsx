"use client"

// Next and React Imports
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/context/AuthContext"
import { Event } from "@/components/types"
import { formatEventDate } from "@/lib/eventUtils"

interface EventGridAttendingProps {
  events: Event[];
  isLoading: boolean;
}

const EventGridAttending = ({ events, isLoading }: EventGridAttendingProps) => {
    const { user } = useAuth();
    if (!user) {
        return null;
    }
    return (
        <div className="p-4">
            {/* Events Grid */}
            <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-6">
                {isLoading ? (
                    <p className="text-sm text-muted-foreground">loading...</p>
                ) : events.length > 0 ? (
                    events.map((event) => (
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