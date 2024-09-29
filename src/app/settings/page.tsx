"use client"

// Next and React Imports
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useEffect, useState } from "react"

// App Imports
import { TopBar } from "@/components/top-bar"
import { Footer } from "@/components/footer"
import { useAuth } from "@/context/AuthContext"
import { toast } from "@/hooks/use-toast"

// Firebase Imports
import { db, storage } from "@/lib/firebase"
import { doc, deleteDoc } from "firebase/firestore"
import { ref, deleteObject } from "firebase/storage"
import { deleteUser } from "firebase/auth"

// Shadcn Imports
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"

// Other Imports
import { ExclamationTriangleIcon } from "@radix-ui/react-icons"

function DeleteAccountDialog() {
    const { user } = useAuth();
    const router = useRouter();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
  
    const handleDelete = async () => {
        if (user) {
            try {
                // 1. Delete user data from Firestore
                const userDocRef = doc(db, "users", user.uid);
                await deleteDoc(userDocRef);

                // 2. Delete user profile picture from Firebase Storage
                const profilePictureRef = ref(storage, `profile_pictures/${user.uid}`);
                await deleteObject(profilePictureRef).catch((error) => {
                    // If there's no profile picture, it's okay to ignore the error
                    if (error.code !== 'storage/object-not-found') {
                        throw error;
                    }
                });

                // 3. Delete Firebase Authentication user
                await deleteUser(user);

                // 4. Provide feedback to the user
                toast({
                    title: "Account Deleted",
                    description: "Your account has been successfully deleted.",
                });

                // 5. Close the dialog and redirect to the home page
                setIsDialogOpen(false);
                router.push("/");
            } catch (error) {
                console.error("Error deleting account: ", error);
                toast({
                    title: "Error",
                    description: "There was an error deleting your account. Please try again.",
                    variant: "destructive",
                });
                setIsDialogOpen(false);
            }
        }
    };

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button variant="destructive">Delete Account</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Are you sure?</DialogTitle>
                    <DialogDescription>
                        This action cannot be undone. This will permanently delete your account and remove your data from our servers.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="secondary" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                    <Button variant="destructive" onClick={handleDelete}>Delete</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function SettingsPage() {

    const { user, loading } = useAuth();

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
                <TopBar title={`happns/settings`} />
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
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col">
            <TopBar title={`happns/settings`} />
            <Separator />
            <div className="p-4 space-y-2">
                <h1 className="text-lg font-semibold">Settings</h1>
                <DeleteAccountDialog />
            </div>
            <Footer className="mt-auto" />
        </div>
    )
}