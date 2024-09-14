"use client"

// Next Imports
import Link from "next/link"
import { useRouter } from "next/navigation"

// Context Imports
import { useAuth } from "@/context/AuthContext"

// Firebase Imports
import { auth } from "@/app/firebase"
import { signOut } from "firebase/auth"

// Shadcn Imports
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Utility Function to get initials
function getInitials(name: string) {
    const [firstName, lastName] = name.split(" ");
    return firstName[0] + (lastName ? lastName[0] : "");
}
  
interface TopBarProps {
    title: string;
}

export const TopBar: React.FC<TopBarProps> = ({ title }) => {
    const { user, loading, userData } = useAuth();
    const router = useRouter();

    const handleSignOut = async () => {
        await signOut(auth);
        router.push("/");
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
                                <p className="text-xs leading-none text-muted-foreground">{userData.username}</p>
                                <p className="text-xs leading-none text-muted-foreground">{userData.email}</p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                            <Link href="/event-form" className="w-full">Add Event</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <Link href="/profile" className="w-full">Profile</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <Link href="/settings" className="w-full">Settings</Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleSignOut}>
                            <Link href="/" className="w-full">Log Out</Link>
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