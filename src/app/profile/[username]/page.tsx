// Next and React Imports
import { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"

// App Imports
import { TopBar } from "@/components/top-bar"
import Footer from "@/components/footer"
import EmptyPage from "@/components/empty-page"
import EventGridBookmarkTabs from "@/components/event-grid-bookmark-tabs"
import EventGridAttendanceTabs from "@/components/event-grid-attendance-tabs"
import { User } from "@/components/types"
import { getInitials } from "@/lib/userUtils"

// Firebase Imports
import { db } from "@/lib/firebase"
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore"

// Shadcn Imports
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

// Generate page metadata
export async function generateMetadata({ params }: { params: { username: string } }): Promise<Metadata> {
    const username = params.username;
    let title = "happns | user profile";
    let description = "explore user profiles on happns";
    let imageUrl = "https://ithappns.com/logo.png";

    try {
        const usersRef = collection(db, "users");
        const userQuery = query(usersRef, where("username", "==", username));
        const userSnapshot = await getDocs(userQuery);

        if (!userSnapshot.empty) {
            const userDoc = userSnapshot.docs[0];
            const userInfo = userDoc.data() as User;
            title = `${userInfo.username}'s profile on happns`;
            description = `discover events and interests of ${userInfo.username}`;
            
            // Use the user's profile picture if available
            if (userInfo.profilePicture) {
                imageUrl = userInfo.profilePicture;
            }
        }
    } catch (error) {
        console.error("Error fetching user data for metadata:", error);
    }

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            images: [imageUrl],
            url: `https://ithappns.com/profile/${username}`,
            type: "profile",
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: [imageUrl],
        },
    };
}

export default async function PublicProfilePage({ params }: { params: { username: string } }) {
    const username = params.username;
    let userInfo: User | null = null;
    let bookmarkCount: number = 0;
    let attendedCount: number = 0;
    let bookmarkedEvents: any[] = [];

    let attendingEvents: any[] = [];
    let maybeEvents: any[] = [];
    let notAttendingEvents: any[] = [];

    try {
        const usersRef = collection(db, "users");
        const userQuery = query(usersRef, where("username", "==", username));
        const userSnapshot = await getDocs(userQuery);

        if (!userSnapshot.empty) {
            const userDoc = userSnapshot.docs[0];
            userInfo = userDoc.data() as User;

            // Fetch user bookmarks count
            const bookmarksRef = collection(userDoc.ref, "user-bookmarks");
            const bookmarksSnapshot = await getDocs(bookmarksRef);
            bookmarkCount = bookmarksSnapshot.size;

            // Fetch attended events count
            const attendanceRef = collection(userDoc.ref, "user-attendance");
            const attendanceSnapshot = await getDocs(attendanceRef);
            
            for (const attendanceDoc of attendanceSnapshot.docs) {
                const { status } = attendanceDoc.data();
                const eventId = attendanceDoc.id;
                const eventRef = doc(db, "events", eventId);
                const eventDoc = await getDoc(eventRef);
    
                if (eventDoc.exists()) {
                    const eventData = { id: eventId, ...eventDoc.data() };
                    if (status === "yes") attendingEvents.push(eventData);
                    if (status === "maybe") maybeEvents.push(eventData);
                    if (status === "not") notAttendingEvents.push(eventData);
                }
            }

            // Update the attended count
            attendedCount = attendingEvents.length;

            // Fetch the actual event details for each bookmark
            const eventPromises = bookmarksSnapshot.docs.map(async (bookmarkDoc) => {
                const eventId = bookmarkDoc.id;
                const eventRef = doc(db, "events", eventId);
                const eventDoc = await getDoc(eventRef);
                return eventDoc.exists() ? { id: eventId, ...eventDoc.data() } : null;
            });

            const eventDetails = await Promise.all(eventPromises);

            bookmarkedEvents = eventDetails.filter(Boolean);
        }
    } catch (error) {
        console.error("Error fetching user data:", error);
    }

    if (!userInfo) {
        return (
            <EmptyPage title="happns/error" description="user not found" />
        );
    }

    return (
        <div className="min-h-screen flex flex-col">
            <TopBar title={`happns/${userInfo.username}`} />
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
                        
                        {/* User Main Info */}
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
                                    <Link href={`/${userInfo.selectedCity.toLowerCase()}`} passHref>
                                        <Badge 
                                            variant="outline"
                                            className="inline-block"
                                        >
                                            {userInfo.selectedCity}
                                        </Badge>
                                    </Link>
                                </div>
                            )}

                            {/* Role */}
                            <div className="text-sm font-medium flex items-center space-x-2">
                                <span className="text-muted-foreground w-10">Role</span>
                                <Badge variant="outline" className="inline-block">
                                    {userInfo.role}
                                </Badge>
                            </div>

                            {/* Instagram Handle */}
                            {userInfo.instagram && (
                                <div className="text-sm font-medium flex items-center space-x-2">
                                    <span className="text-muted-foreground w-10">Insta</span>
                                    <Badge variant="outline" className="inline-block">
                                        <a 
                                            href={`https://www.instagram.com/${userInfo.instagram}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-inherit no-underline"
                                        >
                                            @{userInfo.instagram}
                                        </a>
                                    </Badge>
                                </div>
                            )}
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
                                {attendedCount} events attended
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* User Attendance Events */}
                    <EventGridAttendanceTabs
                        attendingEvents={attendingEvents}
                        maybeEvents={maybeEvents}
                        notAttendingEvents={notAttendingEvents}
                        isLoading={false}
                    />

                    <Separator />

                    {/* User Bookmarked Events */}
                    <EventGridBookmarkTabs
                        bookmarkedEvents={bookmarkedEvents}
                        isLoading={false}
                    />

                </div>
            )}

            <Footer className="mt-auto" />
        </div>
    )
}