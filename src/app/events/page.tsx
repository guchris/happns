"use client"

// Next and React Imports
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link"

// App Imports
import { useAuth } from "@/context/AuthContext";
import EventGridAttending from "@/components/event-grid-attending";
import { Event } from "@/components/types";

// Firebase Imports
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Shadcn Imports
import { TopBar } from "@/components/top-bar";
import { Separator } from "@/components/ui/separator";
import Footer from "@/components/footer";
import { getFutureEvents, sortEventsByDate, mapFirestoreEvent } from "@/lib/eventUtils";

function EventsAuthRedirect() {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/");
    }
  }, [user, loading, router]);
  return null;
}

export default function EventsPage() {
  const { user, loading, userData } = useAuth();
  const [attendingEvents, setAttendingEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAttendingEvents = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const attendanceRef = collection(db, "users", user.uid, "user-attendance");
        const q = query(attendanceRef, where("status", "==", "yes"));
        const querySnapshot = await getDocs(q);
        const today = new Date();
        const eventPromises = querySnapshot.docs.map((attendanceDoc) => {
          const eventId = attendanceDoc.data().eventId;
          const eventRef = doc(db, "events", eventId);
          return getDoc(eventRef);
        });
        const eventDocs = await Promise.all(eventPromises);
        const events = eventDocs
          .filter((eventDoc) => eventDoc.exists() && eventDoc.data())
          .map((eventDoc) => ({
            ...(eventDoc.data() as Event),
            id: eventDoc.id,
          }));
        const futureEvents = getFutureEvents(events, today);
        const sortedFutureEvents = sortEventsByDate(futureEvents);
        setAttendingEvents(sortedFutureEvents);
      } catch (error) {
        console.error("Error fetching attending events:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAttendingEvents();
  }, [user]);

  if (loading || !user) {
    return null;
  }

  return (
    <>
        <div className="flex flex-col min-h-safe-screen">

            {/* Main Content */}
            <div className="flex flex-col flex-1">
                <TopBar title="happns" />
                <Separator />
                <Link href="/seattle" className="w-full block">
                    <div className="flex items-center justify-between h-14 px-4 text-lg font-semibold hover:bg-neutral-100 transition cursor-pointer">
                        <span>happns/seattle</span>
                        <span>--&gt;</span>
                    </div>
                </Link>
                <Separator />
                <div className="p-4 flex-col gap-4">
                    <h1 className="font-bold">Welcome back, {userData?.username}!</h1>
                    <p className="">You have <span className="font-semibold">{attendingEvents.length}</span> upcoming events.</p>
                </div>
                <EventGridAttending events={attendingEvents} isLoading={isLoading} />
            </div>
            <Footer />
        </div>
    </>
  );
}
