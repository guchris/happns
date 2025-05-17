"use client"

// Next and React Imports
import Link from "next/link"
import { Suspense, useState } from "react"

// App Imports
import AuthHandler from "@/context/AuthHandler"
import SearchParamsHandler from "@/components/search-params-handler"
import { UserLoginForm } from "@/components/user-login-form"
import { UserSignupForm } from "@/components/user-signup-form"
import { cn } from "@/lib/utils"

// Shadcn Imports
import { buttonVariants } from "@/components/ui/button"

export default function AuthPage() {
    const [isSignUp, setIsSignUp] = useState<boolean>(false);

    return (
        <>
            {/* Main Auth Page */}
            <div className="container relative min-h-screen flex flex-col items-center justify-center">
                
                <Suspense fallback={<div>Loading...</div>}>
                    <SearchParamsHandler setIsSignUp={setIsSignUp} />
                </Suspense>
                
                <button
                    onClick={() => setIsSignUp(!isSignUp)}
                    className={cn(
                        buttonVariants({ variant: "outline" }),
                        "absolute right-4 top-4 md:right-8 md:top-8"
                    )}
                >
                    {isSignUp ? "login" : "sign up"}
                </button>

                <div className="flex flex-col items-center justify-center w-full lg:p-8 min-h-screen lg:min-h-0">
                    <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                        <div className="flex flex-col space-y-2 text-center">
                            <h1 className="text-2xl font-semibold tracking-tight">
                                {isSignUp ? "sign up for happns" : "login to happns"}
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                {isSignUp ? "Enter your details to sign up" : "Enter your details to login"}
                            </p>
                        </div>
                        {isSignUp ? (
                            <UserSignupForm />
                        ) : (
                            <Suspense fallback={<div>Loading...</div>}>
                                <UserLoginForm />
                            </Suspense>
                        )}
                        <Link href="/auth/password-reset" className="text-sm text-muted-foreground underline underline-offset-4 hover:text-primary text-center">
                            Forgot your password?
                        </Link>
                        <p className="px-8 text-center text-sm text-muted-foreground">
                            By continuing, you agree to our{" "}
                            <Link
                                href="/terms"
                                className="underline underline-offset-4 hover:text-primary"
                            >
                                terms of service
                            </Link>{" "}
                            and{" "}
                            <Link
                                href="/privacy"
                                className="underline underline-offset-4 hover:text-primary"
                            >
                                privacy policy
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