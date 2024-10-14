"use client"

// Next and React Imports
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

// App Imports
import { useAuth } from "@/context/AuthContext"
import { toast } from "@/hooks/use-toast"
import { City } from "@/components/types"

// Firebase Imports
import { db, storage } from "@/lib/firebase"
import { doc, updateDoc, getDoc, deleteDoc, collection, getDocs } from "firebase/firestore"
import { ref, deleteObject } from "firebase/storage"
import { deleteUser } from "firebase/auth"

// Shadcn Imports
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger,SelectValue } from "@/components/ui/select"
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
                const userDoc = await getDoc(userDocRef);

                if (userDoc.exists()) {
                    const { username } = userDoc.data();
                    const usernameDocRef = doc(db, "usernames", username);
                    await deleteDoc(usernameDocRef);
                }

                // 2. Delete user data from Firestore
                await deleteDoc(userDocRef);

                // 3. Delete user profile picture from Firebase Storage
                const profilePictureRef = ref(storage, `profile_pictures/${user.uid}`);
                await deleteObject(profilePictureRef).catch((error) => {
                    // If there's no profile picture, it's okay to ignore the error
                    if (error.code !== 'storage/object-not-found') {
                        throw error;
                    }
                });

                // 4. Delete Firebase Authentication user
                await deleteUser(user);

                // 5. Provide feedback to the user
                toast({
                    title: "Account Deleted",
                    description: "Your account has been successfully deleted.",
                });

                // 6. Close the dialog and redirect to the home page
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
    const { user } = useAuth();
    const [selectedCity, setSelectedCity] = useState("");
    const [cities, setCities] = useState<City[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchCities = async () => {
            try {
                const citiesCollectionRef = collection(db, "cities");
                const citySnapshot = await getDocs(citiesCollectionRef);
                
                const cityList: City[] = citySnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: data.id,
                        name: data.name,
                        slug: data.slug,
                        lat: data.lat,
                        lon: data.lon,
                        slogan: data.slogan,
                        description: data.description,
                    };
                });
                
                setCities(cityList);
            } catch (error) {
                console.error("Error fetching cities: ", error);
                toast({ title: "Error", description: "Could not load cities.", variant: "destructive" });
            }
        };

        const fetchUserCity = async () => {
            if (user) {
                const userDocRef = doc(db, "users", user.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    setSelectedCity(userDoc.data().selectedCity || "");
                }
            }
        };

        fetchCities();
        fetchUserCity();
    }, [user]);

    const handleCityChange = async (newCity: string) => {
        const cityToStore = newCity === "none" ? "" : newCity;
        setSelectedCity(cityToStore);

        if (user) {
            const userDocRef = doc(db, "users", user.uid);
            setLoading(true);
            try {
                await updateDoc(userDocRef, { selectedCity: cityToStore });
                toast({ title: "City Updated", description: "Your default city has been updated successfully." });
            } catch (error) {
                console.error("Error updating city: ", error);
                toast({ title: "Error", description: "Could not update your default city. Please try again.", variant: "destructive" });
            }
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-lg font-semibold">account</h1>
                <p className="text-sm text-muted-foreground">
                    update your account settings, set your preferred language and timezone
                </p>
            </div>
            <div className="space-y-2">
                <h2 className="text-base font-medium">default city</h2>
                <Select onValueChange={handleCityChange} value={selectedCity} disabled={loading}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a city" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {cities.map((city) => (
                            <SelectItem key={city.slug} value={city.slug}>{city.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <DeleteAccountDialog />
        </div>
    )
}