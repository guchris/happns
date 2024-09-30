"use client"

// Next and React Imports
import { useState, useEffect } from "react"
import Image from "next/image"

// App Imports
import { useAuth } from "@/context/AuthContext"
import { toast } from "@/hooks/use-toast"

// Firebase Imports
import { db, storage } from "@/lib/firebase"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"

// Shadcn Imports
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"

// Utility Function to get initials
function getInitials(name: string) {
    const [firstName, lastName] = name.split(" ");
    return firstName[0] + (lastName ? lastName[0] : "");
}

export default function ProfileForm() {
    const { user } = useAuth();

    // States for form inputs
    const [userInfo, setUserInfo] = useState<any>(null);
    const [editName, setEditName] = useState<string>("");
    const [editUsername, setEditUsername] = useState<string>("");
    const [editEmail, setEditEmail] = useState<string>("");
    const [editProfilePicture, setEditProfilePicture] = useState<string | null>(null);
    const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

    // Fetch user info when component mounts
    useEffect(() => {
        if (user?.uid) {
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
                    }
                } catch (error) {
                    console.error("Error fetching user data: ", error);
                }
            };
            fetchUserInfo();
        }
    }, [user]);

    if (!userInfo) {
        return <p>Loading...</p>;
    }

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
                setUserInfo({
                    ...userInfo,
                    name: editName,
                    username: editUsername,
                    email: editEmail,
                    profilePicture: updatedProfilePictureURL,
                });
                toast({
                    title: "Profile Updated",
                    description: "Your profile information has been updated.",
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

    return (
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
    )
}
