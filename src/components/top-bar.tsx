"use client"

// Next Imports
import Link from "next/link"
import Image from "next/image"
import { useRouter, usePathname } from "next/navigation"

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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
  
interface TopBarProps {
    title: string;
}

export const TopBar: React.FC<TopBarProps> = ({ title }) => {
    const { user, userData } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const { toast } = useToast();

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
                            <Badge variant="outline" className="text-xs capitalize">
                                {userData.role}
                            </Badge>
                        </div>
                        <DropdownMenuSeparator />

                        {userData.role === "curator" && (
                            <DropdownMenuItem>
                                <Link href="/event-form" className="w-full">Add Event</Link>
                            </DropdownMenuItem>
                        )}

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
                <Link href={`/auth?redirect=${pathname}`} passHref>
                    <Button asChild>
                        <div>login</div>
                    </Button>
                </Link>
            )}
        </div>
    )
}