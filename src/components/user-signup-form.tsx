"use client"

// React Imports
import * as React from "react"
import { useRouter } from "next/navigation"

// Firebase Imports
import { db, auth } from "@/app/firebase"
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth"
import { doc, setDoc, getDoc } from "firebase/firestore"

// Lib Imports
import { cn } from "@/lib/utils"

// Shadcn Imports
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Component Imports
import { User } from "@/components/types"
import { Icons } from "@/components/icons"
import { useToast } from "@/hooks/use-toast"

interface UserSignupFormProps extends React.HTMLAttributes<HTMLDivElement> {}

export function UserSignupForm({ className, ...props }: UserSignupFormProps) {
    const router = useRouter()
    const { toast } = useToast()

    const [isLoading, setIsLoading] = React.useState<boolean>(false)
    const [name, setName] = React.useState<string>("")
    const [username, setUsername] = React.useState<string>("")
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
                    role: "general"
                }
                await setDoc(userRef, newUser)
            }
            
            toast({
                title: "Account Created",
                description: `Welcome to happns.`
            })

            router.push("/")
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
            const userCredential = await createUserWithEmailAndPassword(auth, email, password)
            const user = userCredential.user
            const newUser: User = {
                uid: user.uid,
                name: name,
                username: username,
                email: email,
                createdAt: new Date(),
                role: "general"
            }

            await setDoc(doc(db, "users", newUser.uid), newUser)

            router.push("/")
        } catch (error: any) {
            console.error("Error signing up:", error.message)
            setError(error.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className={cn("grid gap-6", className)} {...props}>
            <form onSubmit={onSubmit}>
                <div className="grid gap-2">
                    <div className="grid gap-1">
                        <Label className="sr-only" htmlFor="name">
                            Name
                        </Label>
                        <Input
                            id="name"
                            placeholder="Your name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                    <div className="grid gap-1">
                        <Label className="sr-only" htmlFor="username">
                            Username
                        </Label>
                        <Input
                            id="username"
                            placeholder="Your username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                    <div className="grid gap-1">
                        <Label className="sr-only" htmlFor="email">
                            Email
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
                        />
                    </div>
                    <div className="grid gap-1">
                        <Label className="sr-only" htmlFor="password">
                            Password
                        </Label>
                        <Input
                            id="password"
                            placeholder="Your password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoCapitalize="none"
                            autoComplete="current-password"
                            autoCorrect="off"
                            disabled={isLoading}
                        />
                    </div>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <Button disabled={isLoading}>
                        {isLoading && (
                            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Sign Up
                    </Button>
                </div>
            </form>
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                        Or continue with
                    </span>
                </div>
            </div>
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
                Sign up with Google
            </Button>
        </div>
    )
}