"use client"

// Next and React Imports
import { useParams } from "next/navigation"
import Image from "next/image"
import { useEffect, useState } from "react"

// App Imports
import { useAuth } from "@/context/AuthContext"
import { TopBar } from "@/components/top-bar"
import { Footer } from "@/components/footer"
import Loading from "@/components/loading"
import { User } from "@/components/types"
import { getInitials } from "@/lib/userUtils"

// Firebase Imports
import { db } from "@/lib/firebase"
import { doc, getDoc, collection, getDocs } from "firebase/firestore"

// Shadcn Imports
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

export default function PublicProfilePage() {
    const { id } = useParams() as { id: string };
    const { user, loading } = useAuth();
    const [userInfo, setUserInfo] = useState<User | null>(null);
    const [bookmarkCount, setBookmarkCount] = useState(0);

    useEffect(() => {
        if (id && typeof id === "string") {
            // Fetch user information from Firestore
            const fetchUserInfo = async () => {
                try {
                    const userRef = doc(db, "users", id);
                    const userDoc = await getDoc(userRef);

                    if (userDoc.exists()) {
                        setUserInfo(userDoc.data() as User);
                    } else {
                        console.error("No such user document!");
                    }

                    // Fetch user bookmarks count
                    const bookmarksRef = collection(userRef, "user-bookmarks");
                    const bookmarksSnapshot = await getDocs(bookmarksRef);
                    setBookmarkCount(bookmarksSnapshot.size);
                } catch (error) {
                    console.error("Error fetching user data: ", error);
                }
            };

            fetchUserInfo();
        }
    }, [id]);

    if (loading) {
        return <Loading title="happns/profile" />;
    }

    return (
        <div className="min-h-screen flex flex-col">
            <TopBar title={`happns/${userInfo ? userInfo.username : 'profile'}`} />
            <Separator />

            {userInfo && (
                <div className="flex flex-1 flex-col">
                    {/* User Info Display */}
                    <div className="p-4 flex gap-4">
                        {/* User Avatar */}
                        <div className="flex justify-left">
                            <Avatar className="h-24 w-24">
                                {userInfo.profilePicture ? (
                                    <Image
                                        src={userInfo.profilePicture}
                                        alt="Profile Picture"
                                        width={96} // Use appropriate size for your avatar
                                        height={96}
                                        className="h-full w-full object-cover rounded-full"
                                    />
                                ) : (
                                    <AvatarFallback>{getInitials(userInfo.name)}</AvatarFallback>
                                )}
                            </Avatar>
                        </div>

                        <div className="flex flex-col">
                            <div className="text-lg font-semibold">{userInfo.name}</div>
                            <div className="text-base font-medium">@{userInfo.username}</div>
                        </div>
                    </div>

                    <Separator />

                    {/* User Badges */}
                    <div className="flex whitespace-pre-wrap p-4 grid gap-4">
                        <div className="grid gap-2">

                            {/* City */}
                            {userInfo.selectedCity && (
                                <div className="text-sm font-medium flex items-center space-x-2">
                                    <span className="text-muted-foreground w-10">City</span>
                                    <Badge variant="outline" className="inline-block">
                                        {userInfo.selectedCity}
                                    </Badge>
                                </div>
                            )}

                            {/* Role */}
                            <div className="text-sm font-medium flex items-center space-x-2">
                                <span className="text-muted-foreground w-10">Role</span>
                                <Badge variant="outline" className="inline-block">
                                    {userInfo.role}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* User Stats */}
                    <div className="flex items-center gap-4">
                        <div className="flex-1 p-4">
                            <div className="text-sm font-medium text-muted-foreground">Bookmarked</div>
                            <div className="text-sm font-medium">
                                {bookmarkCount} events bookmarked
                            </div>
                        </div>
                        <Separator orientation="vertical" className="h-auto self-stretch" />
                        <div className="flex-1 p-4">
                            <div className="text-sm font-medium text-muted-foreground">Attended</div>
                            <div className="text-sm font-medium">
                                0 events attended
                            </div>
                        </div>
                    </div>

                    <Separator />
                </div>
            )}

            <Footer className="mt-auto" />
        </div>
    )
}