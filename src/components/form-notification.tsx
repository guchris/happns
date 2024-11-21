"use client"

// React Imports
import { useState } from "react"

// App Imports
import { useAuth } from "@/context/AuthContext"

// Firebase Imports
import { db } from "@/lib/firebase"
import { collection, addDoc, Timestamp, getDocs } from "firebase/firestore"

// Form Imports
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

// Shadcn Imports
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"

const notificationSchema = z.object({
    type: z.string().min(1, "Type is required"),
    message: z.string().min(1, "Message is required"),
    link: z.string().url("Invalid URL").optional().or(z.literal("")),
});

type NotificationFormValues = z.infer<typeof notificationSchema>;

export default function NotificationForm() {
    const { user, userData } = useAuth();
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const form = useForm<NotificationFormValues>({
        resolver: zodResolver(notificationSchema),
        defaultValues: {
            type: "",
            message: "",
            link: "",
        },
    });

    const handleSubmit = async (data: NotificationFormValues) => {
        setError(null);
        setSuccess(null);

        if (!user || userData?.role !== "curator") {
            setError("You do not have permission to add notifications.");
            return;
        }

        try {
            // Fetch all users from Firestore
            const usersSnapshot = await getDocs(collection(db, "users"));

            // Iterate through users and add notification to each user's sub-collection
            const notification = {
                type: data.type,
                message: data.message,
                date: Timestamp.now(),
                link: data.link || "",
                isRead: false,
            };

            const addNotifications = usersSnapshot.docs.map((doc) => {
                const userId = doc.id;
                return addDoc(collection(db, `users/${userId}/notifications`), notification);
            });

            await Promise.all(addNotifications);

            setSuccess("Notification added successfully to all users!");
            form.reset();
        } catch (err) {
            console.error("Error adding notification:", err);
            setError("Failed to add notifications. Please try again.");
        }
    };

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-bold">send notification</h2>
            {error && <p className="text-red-500">{error.toLowerCase()}</p>}
            {success && <p className="text-green-500">{success.toLowerCase()}</p>}
            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">

                    {/* Type Field */}
                    <FormField
                        name="type"
                        control={form.control}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>type</FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Message Field */}
                    <FormField
                        name="message"
                        control={form.control}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>message</FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Link Field */}
                    <FormField
                        name="link"
                        control={form.control}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>link (optional)</FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <Button type="submit">send notification</Button>
                </form>
            </Form>
        </div>
    )
}