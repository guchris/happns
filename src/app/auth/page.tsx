"use client"

// React Imports
import { useState } from "react"

// Next Imports
import Link from "next/link"

// Lib Imports
import { cn } from "@/lib/utils"

// Component Imports
import { UserLoginForm } from "@/components/user-login-form"
import { UserSignupForm } from "@/components/user-signup-form"

// Shadcn Imports
import { buttonVariants } from "@/components/ui/button"

export default function AuthPage() {
    const [isSignUp, setIsSignUp] = useState<boolean>(false)

    return (
        <>
            {/* Main Auth Page */}
            <div className="container relative min-h-screen flex flex-col items-center justify-center lg:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
                <button
                    onClick={() => setIsSignUp(!isSignUp)}
                    className={cn(
                        buttonVariants({ variant: "ghost" }),
                        "absolute right-4 top-4 md:right-8 md:top-8"
                    )}
                >
                    {isSignUp ? "Log In" : "Sign Up"}
                </button>

                {/* Left Section - Hidden on Mobile */}
                <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
                    <div className="absolute inset-0 bg-zinc-900" />
                    <div className="relative z-20 flex items-center text-lg font-medium">
                        happns
                    </div>
                    <div className="relative z-20 mt-auto">
                        <blockquote className="space-y-2">
                            <p className="text-lg">
                                &ldquo;happns made it so easy to discover events in my city and plan with friends. Now, I never miss out on what’s happening around me!&rdquo;
                            </p>
                            <footer className="text-sm">Jeremy Simpson</footer>
                        </blockquote>
                    </div>
                </div>

                {/* Right Section (Form) - Displayed on Both Mobile and Desktop */}
                <div className="flex flex-col items-center justify-center w-full lg:p-8 min-h-screen lg:min-h-0">
                    <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                        <div className="flex flex-col space-y-2 text-center">
                            <h1 className="text-2xl font-semibold tracking-tight">
                                {isSignUp ? "Sign up for happns" : "Log in to happns"}
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                {isSignUp ? "Enter your details to sign up" : "Enter your email and password"}
                            </p>
                        </div>
                        {isSignUp ? <UserSignupForm /> : <UserLoginForm />}
                        <p className="px-8 text-center text-sm text-muted-foreground">
                            By continuing, you agree to our{" "}
                            <Link
                                href="/terms"
                                className="underline underline-offset-4 hover:text-primary"
                            >
                                Terms of Service
                            </Link>{" "}
                            and{" "}
                            <Link
                                href="/privacy"
                                className="underline underline-offset-4 hover:text-primary"
                            >
                                Privacy Policy
                            </Link>
                            .
                        </p>
                    </div>
                </div>
            </div>
        </>
    )
}