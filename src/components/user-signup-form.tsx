"use client"

// React Imports
import { useState, useEffect } from "react"

// App Imports
import { User } from "@/components/types"
import { Icons } from "@/components/icons"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/context/AuthContext"
import { cn } from "@/lib/utils"

// Firebase Imports
import { db, auth } from "@/lib/firebase"
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth"
import { doc, setDoc, getDoc } from "firebase/firestore"

// Shadcn Imports
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface UserSignupFormProps extends React.HTMLAttributes<HTMLDivElement> {
    onSuccess?: () => void;
}

export function UserSignupForm({ className, onSuccess, ...props }: UserSignupFormProps) {
    const { setIsAuthenticated } = useAuth()
    const { toast } = useToast()

    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [name, setName] = useState<string>("")
    const [username, setUsername] = useState<string>("")
    const [email, setEmail] = useState<string>("")
    const [password, setPassword] = useState<string>("")
    const [error, setError] = useState<string | null>(null)

    const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null)
    const [isCheckingUsername, setIsCheckingUsername] = useState<boolean>(false)

    async function checkUsernameAvailability(username: string) {
        setIsCheckingUsername(true)
        setIsUsernameAvailable(null)
    
        try {
            const usernameRef = doc(db, "usernames", username)
            const usernameSnap = await getDoc(usernameRef)
    
            if (usernameSnap.exists()) {
                setIsUsernameAvailable(false)
            } else {
                setIsUsernameAvailable(true)
            }
        } catch (error) {
            console.error("Error checking username")
            setIsUsernameAvailable(false)
        } finally {
            setIsCheckingUsername(false)
        }
    }

    useEffect(() => {
        if (username.trim().length > 0) {
            const delayDebounceFn = setTimeout(() => {
                checkUsernameAvailability(username)
            }, 500) // 500ms debounce
    
            return () => clearTimeout(delayDebounceFn)
        } else {
            setIsUsernameAvailable(null)
        }
    }, [username])

    async function handleGoogleSignIn() {
        setIsLoading(true)
        setError(null)
    
        const provider = new GoogleAuthProvider()
    
        try {
            const result = await signInWithPopup(auth, provider)
            const user = result.user

            const username = user.email?.split("@")[0] || "user"
            const usernameRef = doc(db, "usernames", username)
            const usernameSnap = await getDoc(usernameRef)

            if (usernameSnap.exists()) {
                setError("Username is already taken. Please choose another one.")
                setIsLoading(false)
                return
            }
    
            // Check if user already exists in Firestore
            const userRef = doc(db, "users", user.uid)
            const userSnap = await getDoc(userRef)
    
            if (!userSnap.exists()) {
                // If user does not exist, create a new record
                const newUser: User = {
                    uid: user.uid,
                    name: user.displayName || "Anonymous",
                    username: username,
                    email: user.email || "",
                    createdAt: new Date(),
                    role: "general"
                }
                await setDoc(userRef, newUser)
                await setDoc(doc(db, "usernames", username), { uid: user.uid })
            }
            
            toast({
                title: "Account Created",
                description: `Welcome to happns.`
            })

            setIsAuthenticated(true);
            if (onSuccess) {
                onSuccess();
            }
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
            // Check if the username is already taken
            const usernameRef = doc(db, "usernames", username)
            const usernameSnap = await getDoc(usernameRef)

            if (usernameSnap.exists()) {
                setError("Username is already taken. Please choose another one.")
                setIsLoading(false)
                return
            }

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
            await setDoc(doc(db, "usernames", username), { uid: user.uid })

            setIsAuthenticated(true);
            if (onSuccess) {
                onSuccess();
            }
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
                            className="text-base sm:text-sm"
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
                            onChange={(e) => setUsername(e.target.value.toLowerCase())}
                            disabled={isLoading}
                            className="text-base sm:text-sm"
                        />
                        {isCheckingUsername && <p className="text-sm text-gray-500">Checking username...</p>}
                        {isUsernameAvailable === true && <p className="text-sm text-green-500">Username is available</p>}
                        {isUsernameAvailable === false && <p className="text-sm text-red-500">Username is taken</p>}
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
                            className="text-base sm:text-sm"
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
                            className="text-base sm:text-sm"
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