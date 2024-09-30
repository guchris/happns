"use client"

// Next and React Imports
import { useRouter } from "next/navigation"
import { useState } from "react"

// App Imports
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"

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

export default function SettingsAccountPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-lg font-semibold">account</h1>
                <p className="text-sm text-muted-foreground">
                    update your account settings, set your preferred language and timezone
                </p>
            </div>
            <DeleteAccountDialog />
        </div>
    )
}