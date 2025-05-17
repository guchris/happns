"use client"

// Next and React Imports
import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"

// App Imports
import { User } from "@/components/types"
import { Icons } from "@/components/icons"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/context/AuthContext"
import { cn } from "@/lib/utils"

// Firebase Imports
import { db, auth } from "@/lib/firebase"
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth"
import { doc, setDoc, getDoc } from "firebase/firestore"

// Shadcn Imports
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"


interface UserLoginFormProps extends React.HTMLAttributes<HTMLDivElement> {
    onSuccess?: () => void;
}

export function UserLoginForm({ className, onSuccess, ...props }: UserLoginFormProps) {
    const { setIsAuthenticated } = useAuth()
    const { toast } = useToast()

    const router = useRouter()
    const searchParams = useSearchParams()

    // Get the redirect path from the query parameter, defaulting to "/"
    const redirectPath = searchParams?.get("redirect") || "/"

    const [isLoading, setIsLoading] = React.useState<boolean>(false)
    const [email, setEmail] = React.useState<string>("")
    const [password, setPassword] = React.useState<string>("")
    const [error, setError] = React.useState<string | null>(null)

    async function handleGoogleSignIn() {
        setIsLoading(true)
        setError(null)
    
        const provider = new GoogleAuthProvider()
    
        try {
            const result = await signInWithPopup(auth, provider)
            const user = result.user
    
            // Check if user already exists in Firestore
            const userRef = doc(db, "users", user.uid)
            const userSnap = await getDoc(userRef)
    
            if (!userSnap.exists()) {

                // If user does not exist, create a new record
                const newUser: User = {
                    uid: user.uid,
                    name: user.displayName || "Anonymous",
                    username: user.email?.split("@")[0] || "user",
                    email: user.email || "",
                    createdAt: new Date(),
                    role: "general",
                    notifications: {
                        communication_emails: true,
                        roundup_emails: true,
                        marketing_emails: true
                    }
                }

                await setDoc(userRef, newUser)
                await setDoc(doc(db, "usernames", newUser.username), { uid: user.uid })

                toast({
                    title: "Account Created",
                    description: "Welcome to the happns community!"
                })
            } else {

                // If user exists, show signed-in message
                toast({
                    title: "Signed In",
                    description: `Welcome back`
                })
            }

            setIsAuthenticated(true);
            if (onSuccess) {
                onSuccess();
            }

            router.push(redirectPath)

        } catch (error: any) {
            console.error("Error signing in with Google:", error.message)
            setError(error.message)
        } finally {
            setIsLoading(false)
        }
    }

    async function onSubmit(event: React.SyntheticEvent) {
        event.preventDefault()
        setIsLoading(true)
        setError(null)

        try {
            // Firebase Authentication
            const userCredential = await signInWithEmailAndPassword(auth, email, password)
            const user = userCredential.user

            toast({
                title: "Signed In",
                description: `Welcome Back`
            })

            setIsAuthenticated(true);
            if (onSuccess) {
                onSuccess();
            }

            router.push(redirectPath)
        } catch (error: any) {
            console.error("Error signing in:", error.message)
            setError("Invalid credentials. Have you signed up yet?");
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className={cn("grid gap-6", className)} {...props}>
            <form onSubmit={onSubmit}>
                <div className="grid gap-2">
                    <div className="grid gap-1">
                        <Label className="sr-only" htmlFor="email">
                            email
                        </Label>
                        <Input
                            id="email"
                            placeholder="name@example.com"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoCapitalize="none"
                            autoComplete="email"
                            autoCorrect="off"
                            disabled={isLoading}
                            className="text-base sm:text-sm"
                        />
                    </div>
                    <div className="grid gap-1">
                        <Label className="sr-only" htmlFor="password">
                            password
                        </Label>
                        <Input
                            id="password"
                            placeholder="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoCapitalize="none"
                            autoComplete="current-password"
                            autoCorrect="off"
                            disabled={isLoading}
                            className="text-base sm:text-sm"
                        />
                    </div>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <Button disabled={isLoading}>
                        {isLoading && (
                            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        login
                    </Button>
                </div>
            </form>
            <Separator />
            <Button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                variant="outline"
            >
                {isLoading ? (
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Icons.google className="mr-2 h-4 w-4" />
                )}
                Sign in with Google
            </Button>
        </div>
    )
}