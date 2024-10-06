"use client"

// Next and React Imports
import Link from "next/link"
import { Suspense, useState, useEffect } from "react"

// App Imports
import AuthHandler from "@/context/AuthHandler"
import SearchParamsHandler from "@/components/search-params-handler"
import { UserLoginForm } from "@/components/user-login-form"
import { UserSignupForm } from "@/components/user-signup-form"
import { cn } from "@/lib/utils"

// Shadcn Imports
import { Button } from "@/components/ui/button"
import { buttonVariants } from "@/components/ui/button"
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

export default function AuthPage() {
    const [isSignUp, setIsSignUp] = useState<boolean>(false);

    return (
        <>
            {/* Main Auth Page */}
            <div className="container relative min-h-screen flex flex-col items-center justify-center lg:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
                
                <Suspense fallback={<div>Loading...</div>}>
                    <SearchParamsHandler setIsSignUp={setIsSignUp} />
                </Suspense>
                
                <button
                    onClick={() => setIsSignUp(!isSignUp)}
                    className={cn(
                        buttonVariants({ variant: "ghost" }),
                        "absolute right-4 top-4 md:right-8 md:top-8"
                    )}
                >
                    {isSignUp ? "login" : "sign up"}
                </button>

                {/* Mobile Button for Sheet */}
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="outline" className="block lg:hidden absolute left-4 top-4 md:left-8 md:top-8">Account Benefits</Button>
                    </SheetTrigger>
                    <SheetContent
                        side="left"
                        style={{ height: "100vh", width: "100vw", overflow: "auto" }}
                        className="bg-zinc-900 dark:border-r text-white"
                    >
                        {/* Header */}
                        <SheetHeader className="mb-4">
                            <SheetTitle className="text-left text-white text-lg font-semibold">happns</SheetTitle>
                            <SheetDescription className="text-left text-white text-base">
                                Account Benefits
                            </SheetDescription>
                        </SheetHeader>

                        {/* Benefits Section */}
                        <div className="flex-grow">
                            <ul className="list-disc pl-6 space-y-2 text-white text-base">
                                <li>Bookmark events for later</li>
                                <li>Get a Google Calendar sync link</li>
                                <li>Add comments on events</li>
                                <li>See event stats and insights</li>
                                <li>And much more!</li>
                            </ul>
                        </div>

                        {/* Footer with Quote */}
                        <div className="mt-6 border-t border-gray-700 pt-4">
                            <blockquote className="italic text-white text-base">
                                &ldquo;happns made it so easy to discover events in my city and plan with friends. 
                                Now, I never miss out on what’s happening around me!&rdquo;
                            </blockquote>
                            <footer className="text-right text-white text-base mt-2">- Jeremy Simpson</footer>
                        </div>
                    </SheetContent>
                </Sheet>

                {/* Left Section - Hidden on Mobile */}
                <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">

                    {/* Header */}
                    <div className="absolute inset-0 bg-zinc-900" />
                    <div className="relative z-20 flex items-center text-lg font-medium">
                        <Link href="/">
                            happns
                        </Link>
                    </div>

                    {/* Centered Benefits Section */}
                    <div className="relative z-20 flex-grow flex flex-col justify-center">
                        <h2 className="text-xl font-semibold mb-4">Account Benefits</h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Bookmark events for later</li>
                            <li>Get a Google Calendar sync link</li>
                            <li>Add comments on events</li>
                            <li>See event stats and insights</li>
                            <li>And much more!</li>
                        </ul>
                    </div>

                    {/* Footer Quote */}
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
                                {isSignUp ? "sign up for happns" : "login to happns"}
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                {isSignUp ? "Enter your details to sign up" : "Enter your email and password"}
                            </p>
                        </div>
                        {isSignUp ? (
                            <UserSignupForm />
                        ) : (
                            <Suspense fallback={<div>Loading...</div>}>
                                <UserLoginForm />
                            </Suspense>
                        )}
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
                            </Link>.
                        </p>
                    </div>
                    <Suspense fallback={<div>Loading...</div>}>
                        <AuthHandler />
                    </Suspense>
                </div>
            </div>
        </>
    )
}