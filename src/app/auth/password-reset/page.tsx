"use client"

// Next and React Imports
import { useState } from "react"
import { useRouter } from "next/navigation"

// App Imports
import { TopBar } from "@/components/top-bar"

// Firebase Imports
import { auth } from "@/lib/firebase"
import { sendPasswordResetEmail } from "firebase/auth"

// Shadcn Imports
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useToast } from "@/hooks/use-toast"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"



// Define validation schema using Zod
const passwordResetSchema = z.object({
    email: z.string().email({ message: "Please enter a valid email address." }),
})

// Define form values
type PasswordResetFormValues = z.infer<typeof passwordResetSchema>

export default function PasswordResetPage() {
    const router = useRouter()
    const { toast } = useToast()
    const [isLoading, setIsLoading] = useState<boolean>(false)

    // Initialize the form using react-hook-form and Zod for validation
    const form = useForm<PasswordResetFormValues>({
        resolver: zodResolver(passwordResetSchema),
            defaultValues: {
            email: "",
        },
    })

    // Handle password reset submission
    const handlePasswordReset = async (values: PasswordResetFormValues) => {
        setIsLoading(true)

        try {
            await sendPasswordResetEmail(auth, values.email)
            toast({
                title: "Password Reset Email Sent",
                description: "Please check your inbox to reset your password.",
            })
            router.push("/auth")
        } catch (error: any) {
            console.error("Error sending password reset email:", error.message)
            toast({
                title: "Error",
                description: "Failed to send password reset email. Please try again.",
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen flex-col items-center">
            <TopBar title={`happns/password-reset`} />
            <Separator />
            <div className="w-full max-w-md p-4 space-y-6">
                <h2 className="text-xl font-semibold">reset your password</h2>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handlePasswordReset)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="name@example.com"
                                            type="email"
                                            {...field}
                                            disabled={isLoading}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "sending..." : "send password reset email"}
                        </Button>
                    </form>
                </Form>
            </div>
        </div>
    )
}