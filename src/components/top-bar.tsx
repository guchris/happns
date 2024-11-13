"use client"

// Next and React Imports
import Link from "next/link"
import Image from "next/image"
import { useRouter, usePathname } from "next/navigation"
import { useState, useEffect } from "react"

// App Imports
import { useAuth } from "@/context/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { getInitials } from "@/lib/userUtils"

// Firebase Imports
import { auth } from "@/lib/firebase"
import { signOut } from "firebase/auth"

// Shadcn Imports
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Bell } from "lucide-react"
  
interface TopBarProps {
    title: string;
}

export const TopBar: React.FC<TopBarProps> = ({ title }) => {
    const { user, userData } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const { toast } = useToast();

    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        // Determine if the viewport is mobile or desktop
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        handleResize(); // Run once to set initial value
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const handleSignOut = async () => {
        await signOut(auth);
        router.push("/");
        toast({
            title: "Logged Out"
        });
    };

    const titleParts = title.split("/");

    return (
        <div className="w-full flex items-center justify-between space-x-4 py-4 px-4 h-14">
            <div className="flex-grow truncate text-lg font-semibold">

                <Link href="/" className="cursor-pointer">
                    {titleParts[0]}/
                </Link>

                {titleParts[1] && (
                    <>
                        {titleParts.length > 2 ? (
                            <Link href={`/${titleParts[1]}`} className="cursor-pointer">
                                {titleParts[1]}
                            </Link>
                        ) : (
                            <span>{titleParts[1]}</span>
                        )}
                        {titleParts.length > 2 && (
                            <>
                                /<span>{titleParts[2]}</span>
                            </>
                        )}
                    </>
                )}
            </div>
            {user && userData ? (
                <div className="flex items-center space-x-4">
                    {/* Notifications */}
                    {isMobile ? (
                        // Mobile: Full-Screen Notification Sheet
                        <Sheet open={isNotificationOpen} onOpenChange={setIsNotificationOpen}>
                            <SheetTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="relative h-8 w-8 rounded-full"
                                >
                                    <Bell className="h-5 w-5 text-black" />
                                    <div className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full" /> {/* Badge for unread */}
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="top" className="w-full h-full">
                                <SheetHeader>
                                    <SheetTitle className="text-left">notifications</SheetTitle>
                                </SheetHeader>
                                <div className="mt-4 space-y-4">
                                    <p className="text-sm">lorem ipsum</p>
                                    {/* Add more notification items here */}
                                </div>
                            </SheetContent>
                        </Sheet>
                    ) : (
                        // Desktop: Dropdown Notification Panel
                        <DropdownMenu open={isNotificationOpen} onOpenChange={setIsNotificationOpen}>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="relative h-8 w-8 rounded-full"
                                >
                                    <Bell className="h-5 w-5 text-black" />
                                    <div className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full" /> {/* Badge for unread */}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-96 max-h-96 bg-white shadow-lg rounded-lg p-4 mr-14">
                                <DropdownMenuLabel className="text-base">notifications</DropdownMenuLabel>
                                <div className="p-2 space-y-2">
                                    <p className="text-sm">lorem ipsum</p>
                                    {/* Add more notifications here */}
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                    
                    {/* User Avatar */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                <Avatar className="h-8 w-8">
                                    {userData.profilePicture ? (
                                        <Image
                                            src={userData.profilePicture}
                                            alt="Profile Picture"
                                            width={32}
                                            height={32}
                                            className="h-full w-full object-cover rounded-full"
                                        />
                                    ) : (
                                        <AvatarFallback>{getInitials(userData.name)}</AvatarFallback>
                                    )}
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end" forceMount>
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-bold leading-none">{userData.name}</p>
                                    <p className="text-sm leading-none text-muted-foreground">{userData.username}</p>
                                </div>
                            </DropdownMenuLabel>
                            <div className="px-2 py-2 flex justify-left">
                                <Badge variant="outline" className="text-xs">
                                    {userData.role}
                                </Badge>
                            </div>
                            <DropdownMenuSeparator />

                            {userData.role === "curator" && (
                                <DropdownMenuItem>
                                    <Link href="/event-form" className="w-full">add event</Link>
                                </DropdownMenuItem>
                            )}

                            <DropdownMenuItem>
                                <Link href="/profile" className="w-full">profile</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <Link href="/settings" className="w-full">settings</Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleSignOut}>
                                <Link href="/" className="w-full">logout</Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                
            ) : (
                <Link href={`/auth?redirect=${pathname}`} passHref>
                    <Button asChild>
                        <div>login</div>
                    </Button>
                </Link>
            )}
        </div>
    )
}