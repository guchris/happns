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
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { Button } from "@/components/ui/button"

// Other Imports
import { z } from "zod"
import { useForm } from "react-hook-form"
import { useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

// Utility Function to get initials
function getInitials(name: string) {
    const [firstName, lastName] = name.split(" ");
    return firstName[0] + (lastName ? lastName[0] : "");
}

const profileFormSchema = z.object({
    name: z.string().min(1, "Name is required"),
    username: z.string().min(1, "Username is required"),
    email: z.string().email("Please enter a valid email address"),
    profilePicture: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const defaultValues: Partial<ProfileFormValues> = {
    name: "",
    username: "",
    email: "",
    profilePicture: undefined,
};

export default function ProfileForm() {
    const { user } = useAuth();

    const [userInfo, setUserInfo] = useState<any>(null);
    const [editProfilePicture, setEditProfilePicture] = useState<string | null>(null);
    const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileFormSchema),
        defaultValues,
    });

    const watchedValues = useWatch({
        control: form.control,
    });

    const [isModified, setIsModified] = useState(false);

    // Fetch user info when component mounts
    useEffect(() => {
        if (user?.uid) {
            const fetchUserInfo = async () => {
                const userRef = doc(db, "users", user.uid); // Use the authenticated user's ID
                const userDoc = await getDoc(userRef);
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setUserInfo(userData);
                    setEditProfilePicture(userData.profilePicture || undefined); // Set undefined if no picture

                    // Reset form fields with fetched data
                    form.reset({
                        name: userData.name || "",
                        username: userData.username || "",
                        email: userData.email || "",
                        profilePicture: userData.profilePicture || undefined,
                    });
                }
            };
            fetchUserInfo();
        }
    }, [user, form]);

    // Watch for form changes to enable or disable the button
    useEffect(() => {
        if (userInfo) {
            const hasChanges = 
                watchedValues.name !== userInfo.name ||
                watchedValues.username !== userInfo.username ||
                watchedValues.email !== userInfo.email ||
                editProfilePicture !== userInfo.profilePicture;

            setIsModified(hasChanges);
        }
    }, [watchedValues, userInfo, editProfilePicture]);

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

    const handleProfileUpdate = async (data: ProfileFormValues) => {
        if (user?.uid) {
            const userRef = doc(db, "users", user.uid); // Use the authenticated user's ID
            let updatedProfilePictureURL = userInfo?.profilePicture || undefined;

            if (profilePictureFile) {
                const storageRef = ref(storage, `profile_pictures/${user.uid}`); // Store picture in Firebase with user's ID
                await uploadBytes(storageRef, profilePictureFile);
                updatedProfilePictureURL = await getDownloadURL(storageRef);
            }

            try {
                await updateDoc(userRef, {
                    ...data,
                    profilePicture: updatedProfilePictureURL,
                });

                toast({
                    title: "Profile Updated",
                    description: "Your profile information has been updated.",
                });
            } catch (error) {
                console.error("Error updating profile:", error);
                toast({
                    title: "Error",
                    description: "There was an error updating your profile.",
                    variant: "destructive",
                });
            }
        }
    };

    if (!userInfo) {
        return <p>Loading...</p>;
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleProfileUpdate)}>
                <div className="space-y-4">
                    {/* Profile Picture Preview */}
                    <FormField
                        control={form.control}
                        name="profilePicture"
                        render={() => (
                            <FormItem>
                                <FormLabel>Profile Picture</FormLabel>
                                <Avatar className="h-24 w-24 mb-2">
                                    {editProfilePicture ? (
                                        <Image
                                            src={editProfilePicture}
                                            alt="Profile Picture Preview"
                                            width={96}
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
                                        <AvatarFallback>
                                            {getInitials(userInfo.name)}
                                        </AvatarFallback>
                                    )}
                                </Avatar>
                                <Input type="file" accept="image/*" onChange={handleProfilePictureUpload} />
                            </FormItem>
                        )}
                    />

                    {/* Name Field */}
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="Enter your name" />
                                </FormControl>
                            </FormItem>
                        )}
                    />

                    {/* Username Field */}
                    <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Username</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="Enter your username" />
                                </FormControl>
                            </FormItem>
                        )}
                    />

                    {/* Email Field */}
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="Enter your email" />
                                </FormControl>
                            </FormItem>
                        )}
                    />

                    <Button type="submit" disabled={!isModified}>Update Profile</Button>
                </div>
            </form>
        </Form>
    )
}
