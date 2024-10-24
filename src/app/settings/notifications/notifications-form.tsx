"use client"

// Next and React Imports
import { useEffect, useState } from "react"

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
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchNotificationSettings = async () => {
            if (user) {
                try {
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
                } catch (error) {
                    console.error("Error fetching notification settings:", error)
                    toast({
                        title: "Error",
                        description: "Could not load notification settings.",
                        variant: "destructive",
                    })
                } finally {
                    setLoading(false) // Set loading to false after fetching
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

    if (loading) {
        return null;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-lg font-semibold">notifications</h1>
                <p className="text-sm text-muted-foreground">
                    configure how you receive email notifications
                </p>
            </div>
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
                                        communication emails
                                    </FormLabel>
                                    <FormDescription className="text-sm">
                                        receive emails about your account activity
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
                                        marketing emails
                                    </FormLabel>
                                    <FormDescription>
                                        receive emails about new features, partnerships, and more
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
                                    <FormLabel className="text-sm">roundup emails</FormLabel>
                                    <FormDescription>
                                        receive weekly roundup emails of events in your city
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
        </div>
    )
}