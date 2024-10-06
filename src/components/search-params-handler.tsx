"use client"

// Next and React Imports
import { useSearchParams } from "next/navigation"
import { useEffect } from "react"

// Component that handles the search parameters and toggles signup
function SearchParamsHandler({ setIsSignUp }: { setIsSignUp: (value: boolean) => void }) {
    const searchParams = useSearchParams();

    useEffect(() => {
        const signupParam = searchParams?.get("signup");
        if (signupParam) {
            setIsSignUp(true);
        }
    }, [searchParams, setIsSignUp]);

    return null;
}

export default SearchParamsHandler;