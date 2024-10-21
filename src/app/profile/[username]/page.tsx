// Next and React Imports
import { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"

// App Imports
import { TopBar } from "@/components/top-bar"
import Footer from "@/components/footer"
import EmptyPage from "@/components/empty-page"
import { User } from "@/components/types"
import { getInitials } from "@/lib/userUtils"
import { formatEventDate } from "@/lib/eventUtils"

// Firebase Imports
import { db } from "@/lib/firebase"
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore"

// Shadcn Imports
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

function sortByDateAndName(events: any[]): any[] {
    return events.sort((a, b) => {
        const dateA = new Date(a.startDate).getTime();
        const dateB = new Date(b.startDate).getTime();

        // First, compare by date
        if (dateA < dateB) return -1;
        if (dateA > dateB) return 1;

        // If the dates are the same, compare alphabetically by name
        return a.name.localeCompare(b.name);
    });
}

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
    let bookmarkedEvents: any[] = [];

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

            // Fetch the actual event details for each bookmark
            const eventPromises = bookmarksSnapshot.docs.map(async (bookmarkDoc) => {
                const eventId = bookmarkDoc.id;
                const eventRef = doc(db, "events", eventId);
                const eventDoc = await getDoc(eventRef);
                return eventDoc.exists() ? { id: eventId, ...eventDoc.data() } : null;
            });

            const eventDetails = await Promise.all(eventPromises);

            const validEvents = eventDetails.filter(Boolean);
            bookmarkedEvents = sortByDateAndName(validEvents);
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
                    {/* User Bookmarked Events */}
                    <div className="p-4 space-y-4">
                        <div className="text-lg font-semibold">bookmarked events</div>
                        <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-6">
                            {bookmarkedEvents.length > 0 ? (
                                bookmarkedEvents.map((event) => (
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
                                            <div className="line-clamp-1 text-base font-semibold mt-2">{event.name}</div>
                                            <div className="line-clamp-1 text-sm text-muted-foreground">
                                                {formatEventDate(event.startDate, event.endDate)}
                                            </div>
                                        </Link>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground">No bookmarked events found.</p>
                            )}
                        </div>
                    </div>

                </div>
            )}

            <Footer className="mt-auto" />
        </div>
    )
}