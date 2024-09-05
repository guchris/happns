"use client";

// React Imports
import { useEffect, useState } from "react";

// Next Imports
import Link from "next/link";
import { useParams } from "next/navigation";

// Firebase Imports
import { auth, db } from "@/app/firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth"
import { signOut } from "firebase/auth"

// Components Imports
import { Event } from "@/components/types";
import { Event as EventComponent } from "@/components/event"

// Shadcn Imports
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Icon Imports
import { PlusCircledIcon } from "@radix-ui/react-icons"

// Utility Function to get initials
function getInitials(name: string) {
    const [firstName, lastName] = name.split(" ");
    return firstName[0] + (lastName ? lastName[0] : "");
}

export default function CityPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [user] = useAuthState(auth);
    const [userData, setUserData] = useState<{ name: string; email: string } | null>(null);
    const { city } = useParams();

    // Fetch user details from Firestore
    useEffect(() => {
        const fetchUserData = async () => {
        if (user) {
            const userDocRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
            setUserData(userDoc.data() as { name: string; email: string });
            }
        }
        };

        fetchUserData();
    }, [user]);

    useEffect(() => {
        const fetchEvents = async () => {
            const eventsCol = collection(db, "events");
            const eventSnapshot = await getDocs(eventsCol);
            const eventList: Event[] = eventSnapshot.docs.map((doc) => ({
            category: doc.data().category,
            clicks: doc.data().clicks,
            cost: doc.data().cost,
            date: doc.data().date,
            description: doc.data().description,
            details: doc.data().details,
            format: doc.data().format,
            gmaps: doc.data().gmaps,
            id: doc.id,
            image: doc.data().image,
            link: doc.data().link,
            location: doc.data().location,
            name: doc.data().name,
            neighborhood: doc.data().neighborhood,
            time: doc.data().time,
            }));
            setEvents(eventList);
        };
    
        fetchEvents();
      }, []);

    const handleSignOut = async () => {
        await signOut(auth);
    };

    return (
        <div className="h-screen flex flex-col">
            <div className="w-full flex items-center justify-between py-4 px-4 h-14 sticky top-0 z-10 bg-white">
                <h2 className="text-lg font-semibold">
                    <Link href="/">happns</Link>
                    /{city}
                </h2>

                {user && userData ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                            <Avatar className="h-8 w-8">
                                <AvatarFallback>{getInitials(userData.name)}</AvatarFallback>
                            </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end" forceMount>
                            <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">{userData.name}</p>
                                <p className="text-xs leading-none text-muted-foreground">{userData.email}</p>
                            </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                                <Link href="/profile">Profile</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <Link href="/settings">Settings</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>Other</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleSignOut}>
                                Log out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    <Button>
                        <PlusCircledIcon className="mr-2 h-4 w-4" />
                        <Link href="/auth">Log In</Link>
                    </Button>
                )}
            </div>
            <Separator />
            <div className="flex-1 overflow-y-auto">
                <EventComponent
                    events={events}
                />
            </div>
        </div>
    );
}
