"use client"

// React Imports
import { useEffect, useState } from "react"

// Next Imports
import Link from "next/link"

// Firebase Imports
import { auth, db } from "@/app/firebase"
import { doc, getDoc } from "firebase/firestore"
import { useAuthState } from "react-firebase-hooks/auth"
import { signOut } from "firebase/auth"

// Shadcn Imports
import { Button } from "@/components/ui/button"
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
  
interface TopBarProps {
    title: string;
}

export const TopBar: React.FC<TopBarProps> = ({ title }) => {
    const [user] = useAuthState(auth);
    const [userData, setUserData] = useState<{ name: string; email: string } | null>(null);

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

    const handleSignOut = async () => {
        await signOut(auth);
    };

    return (
        <div className="w-full flex items-center justify-between py-4 px-4 h-14">
            <Link href="/">
                <h2 className="text-lg font-semibold cursor-pointer">
                    {title}
                </h2>
            </Link>
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
                            <Link href="/event-form">Add Event</Link>
                        </DropdownMenuItem>
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
                    <Link href="/auth">Log In</Link>
                </Button>
            )}
        </div>
    )
}