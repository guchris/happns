"use client"

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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"

function DeleteAccountDialog() {
    const { user } = useAuth();
  
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
            } catch (error) {
                console.error("Error deleting account: ", error);
                toast({
                    title: "Error",
                    description: "There was an error deleting your account. Please try again.",
                    variant: "destructive",
                });
            }
        }
    };

    return (
        <Dialog>
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
                    <Button variant="secondary">Cancel</Button>
                    <Button variant="destructive" onClick={handleDelete}>Delete</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function SettingsPage() {
    return (
        <div className="min-h-screen flex flex-col">
            <TopBar title={`happns/settings`} />
            <Separator />
            <div className="container mx-auto px-4 py-6">
                <h1 className="text-2xl font-bold mb-4">Settings</h1>

                {/* Delete Account Section */}
                <div className="mt-6">
                    <DeleteAccountDialog />
                </div>
            </div>
            <Footer className="mt-auto" />
        </div>
    )
}