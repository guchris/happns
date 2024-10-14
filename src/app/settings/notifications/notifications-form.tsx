"use client"

// Next and React Imports
import { useEffect } from "react"

// App Imports
import { useAuth } from "@/context/AuthContext"
import { toast } from "@/hooks/use-toast"

// Firebase Imports
import { db } from "@/lib/firebase"
import { doc, updateDoc, getDoc } from "firebase/firestore"

// Shadcn Imports
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form"

// Other Imports
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

const notificationsFormSchema = z.object({
    communication_emails: z.boolean().default(false).optional(),
    roundup_emails: z.boolean().default(false).optional(),
    marketing_emails: z.boolean().default(false).optional(),
})

type NotificationsFormValues = z.infer<typeof notificationsFormSchema>

const defaultValues: Partial<NotificationsFormValues> = {
    communication_emails: true,
    marketing_emails: true,
    roundup_emails: true,
}

export function NotificationsForm() {
    const { user } = useAuth()
    const form = useForm<NotificationsFormValues>({
        resolver: zodResolver(notificationsFormSchema),
        defaultValues,
    })

    useEffect(() => {
        const fetchNotificationSettings = async () => {
            if (user) {
                const userDocRef = doc(db, "users", user.uid)
                const userDoc = await getDoc(userDocRef)
                if (userDoc.exists()) {
                    const userData = userDoc.data()
                    form.reset({
                        communication_emails: userData.notifications?.communication_emails || false,
                        roundup_emails: userData.notifications?.roundup_emails || false,
                        marketing_emails: userData.notifications?.marketing_emails || false,
                    })
                }
            }
        }
        fetchNotificationSettings()
    }, [user, form])

    async function onSubmit(data: NotificationsFormValues) {
        if (user) {
            try {
                const userDocRef = doc(db, "users", user.uid)
                await updateDoc(userDocRef, {
                    notifications: data,
                })

                toast({
                    title: "Notifications updated successfully",
                    description: "Your preferences have been saved.",
                })
            } catch (error) {
                console.error("Error updating notifications:", error)
                toast({
                    title: "Error updating notifications",
                    description: "Please try again later.",
                    variant: "destructive",
                })
            }
        } else {
            toast({
                title: "User not signed in",
                description: "Please log in to update your notifications.",
            })
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="space-y-4">
                    <FormField
                        control={form.control}
                        name="communication_emails"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                <FormLabel className="text-sm">
                                    Communication emails
                                </FormLabel>
                                <FormDescription className="text-sm">
                                    Receive emails about your account activity
                                </FormDescription>
                                </div>
                                <FormControl>
                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="marketing_emails"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                <FormLabel className="text-sm">
                                    Marketing emails
                                </FormLabel>
                                <FormDescription>
                                    Receive emails about new features, partnerships, and more
                                </FormDescription>
                                </div>
                                <FormControl>
                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="roundup_emails"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                <FormLabel className="text-sm">Roundup emails</FormLabel>
                                <FormDescription>
                                    Receive weekly roundup emails of events in your city
                                </FormDescription>
                                </div>
                                <FormControl>
                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                </div>
                <Button type="submit">update notifications</Button>
            </form>
        </Form>
    )
}