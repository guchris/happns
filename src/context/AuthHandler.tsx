"use client";

// React Imports
import { useEffect } from "react";

// Next Imports
import { useRouter, useSearchParams } from "next/navigation";

// Context Imports
import { useAuth } from "@/context/AuthContext";

// This component handles the authentication redirection based on the search params
export default function AuthHandler() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isAuthenticated } = useAuth();

    // Capture the redirect URL or use a default value
    const redirectUrl = searchParams?.get("redirect") || "/";

    useEffect(() => {
        if (isAuthenticated) {
            // Redirect the user to the redirect URL if authenticated
            router.push(redirectUrl);
        }
    }, [isAuthenticated, redirectUrl, router]);

    return null;
}