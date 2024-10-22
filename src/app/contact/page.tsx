"use client"

// Next Imports
import Link from "next/link"

// App Imports
import { TopBar } from "@/components/top-bar"
import Footer from "@/components/footer"

// Shadcn Imports
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function ContactForm() {

    return (
        <div className="min-h-screen flex flex-col">
            <TopBar title={`happns/contact`} />
            <Separator />

            <div className="flex flex-col px-4 py-8 space-y-8 max-w-[880px] mx-auto">

                {/* Title and Description */}
                <div className="space-y-2">
                    <h1 className="text-lg font-medium">contact us</h1>
                    <p className="text-sm text-muted-foreground">
                        need to reach us? choose one of the options below to contact us or submit events for review
                    </p>
                </div>

                {/* General Contact Card */}
                <Card>
                    <Link href="https://airtable.com/appacfVqG5ilQChdJ/pag6VRqd6dJ0rdmNx/form">
                        <CardHeader>
                            <CardTitle className="text-lg">general contact</CardTitle>
                            <CardDescription>questions, suggestions, bugs, or feedback? reach out to us here</CardDescription>
                        </CardHeader>
                    </Link>
                </Card>

                {/* Submit Event Card */}
                <Card>
                    <Link href="https://airtable.com/appacfVqG5ilQChdJ/pagQuf4Qrapa1qjfa/form">
                        <CardHeader>
                            <CardTitle className="text-lg">submit an event</CardTitle>
                            <CardDescription>want to submit an event for review? click here to send us the details</CardDescription>
                        </CardHeader>
                    </Link>
                </Card>
            </div>
            <Footer className="mt-auto" />
        </div>
    )
}