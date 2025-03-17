"use client"

// Next and React Imports
import { Suspense } from "react"
import dynamic from "next/dynamic"

const EventForm = dynamic(() => import('@/components/event-form'), { ssr: false });

export default function EventFormPage() {

    return (
        <Suspense>
            <EventForm />
        </Suspense>
    );
}