"use client"

// Next and React Imports
import { Suspense } from "react"
import dynamic from "next/dynamic"
import { useSearchParams } from "next/navigation"

const EventForm = dynamic(() => import('@/components/event-form'), { ssr: false });

export default function EventFormPage() {
    const searchParams = useSearchParams();
    const eventId = searchParams?.get("id");
    const mode = eventId ? "edit" : "create";

    return (
        <Suspense>
            <EventForm mode={mode} />
        </Suspense>
    );
}