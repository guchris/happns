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
import { Notification } from "@/components/types"
import { NotificationList } from "@/components/notification-list"

// Firebase Imports
import { db, auth } from "@/lib/firebase"
import { signOut } from "firebase/auth"
import { doc, collection, onSnapshot, updateDoc, orderBy, query, writeBatch } from "firebase/firestore"

// Shadcn Imports
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
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
    const [notifications, setNotifications] = useState<Notification[]>([]);

    // Calculate unread count
    const unreadCount = notifications.filter(notification => !notification.isRead).length;

    // Determine if the viewport is mobile or desktop
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        handleResize(); // Run once to set initial value
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Fetch notifications from Firestore in real-time, ordered by date in descending order
    useEffect(() => {
        if (user) {
            const notificationsRef = collection(db, "users", user.uid, "notifications");
            const notificationsQuery = query(notificationsRef, orderBy("date", "desc")); // Order by date, newest first
            const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
                const fetchedNotifications = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as Notification[];
                setNotifications(fetchedNotifications);
            });
            return unsubscribe;
        }
    }, [user]);

     // Mark a notification as read in Firestore and update local state
    const markAsRead = async (id: string) => {
        if (user) {
            const notificationRef = doc(db, "users", user.uid, "notifications", id);
            await updateDoc(notificationRef, { isRead: true });
            
            setNotifications((prevNotifications) =>
                prevNotifications.map((notification) =>
                    notification.id === id ? { ...notification, isRead: true } : notification
                )
            );
        }
    };

    // Mark all notifications as read
    const markAllAsRead = async () => {
        if (user) {
            const batch = writeBatch(db); // Create a batch
            notifications.forEach((notification) => {
                if (!notification.isRead) {
                    const notificationRef = doc(db, "users", user.uid, "notifications", notification.id);
                    batch.update(notificationRef, { isRead: true });
                }
            });
            await batch.commit(); // Commit the batch operation
    
            // Update local state to mark all notifications as read
            setNotifications((prevNotifications) =>
                prevNotifications.map((notification) => ({
                    ...notification,
                    isRead: true,
                }))
            );
        }
    };

    const handleSignOut = async () => {
        await signOut(auth);
        router.push("/");
        toast({
            title: "logged out"
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
                                    className="relative h-8 w-8 rounded-full border border-gray-100"
                                >
                                    <Bell className="h-5 w-5 text-black" />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-[-4px] right-[-4px] bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                            {unreadCount}
                                        </span>
                                    )}
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="top" className="w-full h-full">
                                <SheetHeader>
                                    <div className="text-left space-y-4">
                                        <SheetTitle className="text-left">notifications</SheetTitle>
                                        {unreadCount > 0 && (
                                            <Button variant="outline" className="text-xs" onClick={markAllAsRead}>
                                                mark all as read
                                            </Button>
                                        )}
                                    </div>
                                </SheetHeader>
                                <div className="mt-4 space-y-4">
                                    <NotificationList notifications={notifications} onMarkAsRead={markAsRead} />
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
                                    className="relative h-8 w-8 rounded-full border border-gray-100"
                                >
                                    <Bell className="h-5 w-5 text-black" />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-[-4px] right-[-4px] bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                            {unreadCount}
                                        </span>
                                    )}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-96 max-h-96 bg-white shadow-lg rounded-lg p-4 mr-14">
                                <DropdownMenuLabel className="text-base flex justify-between items-center">
                                    notifications
                                    {unreadCount > 0 && (
                                        <Button variant="link" className="text-xs px-0" onClick={markAllAsRead}>
                                            mark all as read
                                        </Button>
                                    )}
                                </DropdownMenuLabel>
                                <div className="p-2 space-y-2 overflow-y-auto max-h-80">
                                    <NotificationList notifications={notifications} onMarkAsRead={markAsRead} />
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