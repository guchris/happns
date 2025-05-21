"use client"

// Next and React Imports
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// App Imports
import { useAuth } from "@/context/AuthContext";

export default function HomeClientRedirect() {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && user) {
      router.replace("/events");
    }
  }, [user, loading, router]);
  return null;
} 