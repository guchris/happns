"use client"

// Next and React Imports
import Image from "next/image"
import Link from "next/link"
import { useRef, useEffect, useState } from "react"
import { useAuth } from "@/context/AuthContext"

// App Imports
import { TopBar } from "@/components/top-bar"
import { Footer } from "@/components/footer"
import { toast } from "@/hooks/use-toast" 

// Firebase Imports
import { db, storage } from "@/lib/firebase"
import { doc, getDoc, updateDoc, collection, getDocs } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"

// Shadcn Imports
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"

// Icon Imports
import { ExclamationTriangleIcon, CopyIcon } from "@radix-ui/react-icons"

// Utility Function to get initials
function getInitials(name: string) {
    const [firstName, lastName] = name.split(" ");
    return firstName[0] + (lastName ? lastName[0] : "");
}
  

export default function ProfilePage() {
    const inputRef = useRef<HTMLInputElement>(null);
    const { user, loading } = useAuth();
    const [calendarLink, setCalendarLink] = useState<string>("");
    const [userInfo, setUserInfo] = useState<any>(null);
    const [bookmarkCount, setBookmarkCount] = useState<number>(0);
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

    // States for form inputs
    const [editName, setEditName] = useState<string>("");
    const [editUsername, setEditUsername] = useState<string>("");
    const [editEmail, setEditEmail] = useState<string>("");
    const [editProfilePicture, setEditProfilePicture] = useState<string | null>(null);
    const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);

    useEffect(() => {
        if (user?.uid) {
            // Generate the subscription link using the user's UID
            setCalendarLink(`webcal://ithappns.com/api/calendar-feed?userId=${user.uid}`);

            // Fetch user information from Firestore
            const fetchUserInfo = async () => {
                try {
                    const userRef = doc(db, "users", user.uid);
                    const userDoc = await getDoc(userRef);

                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        setUserInfo(userData);

                        setEditName(userData.name || "");
                        setEditUsername(userData.username || "");
                        setEditEmail(userData.email || "");
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
    }, [user]);

    const copyLink = () => {
        const link = inputRef.current?.value;
        if (link) {
            navigator.clipboard.writeText(link)
                .then(() => {
                    // Show toast notification
                    toast({
                        title: "Link Copied",
                        description: "The subscription link has been copied to your clipboard.",
                    });
                })
                .catch((err) => {
                    // Handle error if copy fails
                    toast({
                        title: "Error",
                        description: "Failed to copy the link. Please try again.",
                        variant: "destructive",
                    });
                });
        }
    };

    // Handle profile picture upload and preview
    const handleProfilePictureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setProfilePictureFile(file);
            const reader = new FileReader();
            reader.onload = () => {
                setEditProfilePicture(reader.result as string); // Preview the image
            };
            reader.readAsDataURL(file);
        }
    };

    const handleProfileUpdate = async () => {
        if (user?.uid) {
            const userRef = doc(db, "users", user.uid);
            let updatedProfilePictureURL = userInfo?.profilePicture || null;

            // If there's a new profile picture to upload
            if (profilePictureFile) {
                const storageRef = ref(storage, `profile_pictures/${user.uid}`);
                try {
                    // Upload the new profile picture to Firebase Storage
                    await uploadBytes(storageRef, profilePictureFile);
                    // Get the new profile picture URL
                    updatedProfilePictureURL = await getDownloadURL(storageRef);
                } catch (error) {
                    console.error("Error uploading profile picture: ", error);
                    toast({
                        title: "Error",
                        description: "There was an error uploading your profile picture. Please try again.",
                        variant: "destructive",
                    });
                    return;
                }
            }

            try {
                // Update user information in Firestore
                await updateDoc(userRef, {
                    name: editName,
                    username: editUsername,
                    email: editEmail,
                    profilePicture: updatedProfilePictureURL,
                });
                toast({
                    title: "Profile Updated",
                    description: "Your profile information has been updated.",
                });
                setUserInfo({
                    ...userInfo,
                    name: editName,
                    username: editUsername,
                    email: editEmail,
                    profilePicture: updatedProfilePictureURL,
                });
                setIsDialogOpen(false); // Close the dialog after saving changes
            } catch (error) {
                console.error("Error updating profile: ", error);
                toast({
                    title: "Error",
                    description: "There was an error updating your profile. Please try again.",
                    variant: "destructive",
                });
            }
            setIsDialogOpen(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col">
                <TopBar title={`happns/settings`} />
                <Separator />
                <h1 className="text-lg font-semibold p-4">Loading...</h1>
                <Footer className="mt-auto" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen flex flex-col">
                <TopBar title={`happns/profile`} />
                <Separator />
                <div className="px-4">
                    <Alert className="max-w-3xl my-6 mx-auto p-4">
                        <ExclamationTriangleIcon className="h-4 w-4" />
                        <AlertTitle>Not Authorized</AlertTitle>
                        <AlertDescription>
                            You do not have permission to view this page. Please <Link href="/auth" className="text-blue-500">login</Link>.
                        </AlertDescription>
                    </Alert>
                </div>
                <Footer className="mt-auto" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col">
            <TopBar title={`happns/profile`} />
            <Separator />

            {userInfo && (
                <div className="flex flex-1 flex-col">
                    <div className="p-4">
                        <div className="flex items-center gap-4">
                            {/* User Avatar */}
                            <div className="flex justify-left mb-4">
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

                            {/* User Name and Username */}
                            <div className="grid gap-1">
                                <div className="text-lg font-semibold">{userInfo.name}</div>
                                <div className="text-base font-medium">@{userInfo.username}</div>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" onClick={() => setIsDialogOpen(true)}>
                                        Edit Profile
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px]">
                                    <DialogHeader>
                                        <DialogTitle>Edit profile</DialogTitle>
                                    <DialogDescription>
                                        Make changes to your profile here. Click save when you&apos;re done.
                                    </DialogDescription>
                                    </DialogHeader>
                                        <div className="grid gap-4 py-4">

                                            {/* Profile Picture Preview */}
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label htmlFor="profile-picture-preview" className="text-right">
                                                    Profile Picture
                                                </Label>
                                                <div className="col-span-3">
                                                    <Avatar className="h-24 w-24 mb-2">
                                                        {editProfilePicture ? (
                                                            <Image
                                                                src={editProfilePicture}
                                                                alt="Profile Picture Preview"
                                                                width={96} // Use appropriate size for your preview avatar
                                                                height={96}
                                                                className="h-full w-full object-cover rounded-full"
                                                            />
                                                        ) : userInfo?.profilePicture ? (
                                                            <Image
                                                                src={userInfo.profilePicture}
                                                                alt="Profile Picture"
                                                                width={96}
                                                                height={96}
                                                                className="h-full w-full object-cover rounded-full"
                                                            />
                                                        ) : (
                                                            <AvatarFallback>{getInitials(userInfo.name)}</AvatarFallback>
                                                        )}
                                                    </Avatar>
                                                    <Input
                                                        type="file"
                                                        id="profile-picture-upload"
                                                        accept="image/*"
                                                        onChange={handleProfilePictureUpload}
                                                    />
                                                </div>
                                            </div>

                                            {/* Name Field */}
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label htmlFor="name" className="text-right">
                                                    Name
                                                </Label>
                                                <Input
                                                    id="name"
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    className="col-span-3"
                                                />
                                            </div>

                                            {/* Username Field */}
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label htmlFor="username" className="text-right">
                                                    Username
                                                </Label>
                                                <Input
                                                    id="username"
                                                    value={editUsername}
                                                    onChange={(e) => setEditUsername(e.target.value)}
                                                    className="col-span-3"
                                                />
                                            </div>
                                            
                                            {/* Email Field */}
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label htmlFor="email" className="text-right">
                                                    Email
                                                </Label>
                                                <Input
                                                    id="email"
                                                    value={editEmail}
                                                    onChange={(e) => setEditEmail(e.target.value)}
                                                    className="col-span-3"
                                                />
                                            </div>
                                        </div>
                                    <DialogFooter>
                                        <Button type="submit" onClick={handleProfileUpdate}>
                                            Save changes
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>

                    <Separator />

                    {/* User Role */}
                    <div className="flex whitespace-pre-wrap p-4 grid gap-4">
                        <div className="grid gap-2">
                            <div className="text-sm font-medium flex items-center space-x-2">
                                <span className="text-muted-foreground w-10">Email</span>
                                <Badge variant="outline" className="inline-block">
                                    {userInfo.email}
                                </Badge>
                            </div>
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

                    {/* User Calendar Link */}
                    <div className="flex-col p-4 space-y-2">
                        <div className="text-sm font-medium text-muted-foreground">Google Calendar Subscription Link</div>
                        <div className="space-y-2">
                            <p className="text-sm">
                                Subscribe to your bookmarked events by adding this link to your Google Calendar.
                            </p>
                            <div className="flex space-x-2">
                                <Input ref={inputRef} value={calendarLink} readOnly />
                                <Button type="submit" className="px-4" onClick={copyLink}>
                                    <span className="sr-only">Copy</span>
                                    <CopyIcon className="h-4 w-4" />
                                </Button>
                            </div>
                            <Collapsible>
                                <CollapsibleTrigger asChild>
                                    <Button variant="outline">Instructions</Button>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="p-4 space-y-4">
                                    <div className="text-base font-medium text-muted-foreground">Instructions</div>
                                    <ol className="list-decimal list-inside text-sm space-y-2">
                                        <li>Copy the link above by clicking the &quot;Copy Link&quot; button.</li>
                                        <li>
                                            Open <a href="https://calendar.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">Google Calendar</a> in your browser.
                                        </li>
                                        <li>On the left-hand sidebar, find the section labeled &quot;Other calendars&quot; and click the plus (<b>+</b>) icon next to it.</li>
                                        <li>Select <b>&quot;From URL&quot;</b> from the menu.</li>
                                        <li>Paste the link you copied earlier (starting with <b>webcal://</b>) into the field provided.</li>
                                        <li>Click the <b>&quot;Add calendar&quot;</b> button.</li>
                                        <li>Your bookmarked events will now appear in your Google Calendar. Google Calendar will automatically update with any changes you make to your bookmarks.</li>
                                    </ol>
                                    <Alert>
                                        <ExclamationTriangleIcon className="h-4 w-4" />
                                        <AlertTitle>Note</AlertTitle>
                                        <AlertDescription>
                                            It may take some time for Google Calendar to refresh and sync new events. If you don&apos;t see changes immediately, give it a few minutes.
                                        </AlertDescription>
                                    </Alert>
                                </CollapsibleContent>
                            </Collapsible>
                        </div>
                    </div>
                </div>
            )}

            <Footer className="mt-auto" />
        </div>
    )
}