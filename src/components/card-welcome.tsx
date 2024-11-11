// Next Imports
import Image from "next/image"
import Link from "next/link"

// Shadcn Imports
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

export default function WelcomeCard() {
    return (
        <div className="flex-1 max-w-[880px] md:max-w-[700px] lg:max-w-[880px] mx-auto p-4 space-y-4">
            <Card className="w-full bg-neutral-50 border-none">
                <CardHeader>
                    <CardTitle className="text-xl font-semibold">welcome to happns</CardTitle>
                    <CardDescription className="mt-8 text-sm">
                        thank you for joining me during this beta - happns is a personal project I built to make discovering events easier, and I&apos;m excited to see where this goes!
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center space-x-2">
                        <div className="shrink-0">
                            <Image
                                src="/founder.png"
                                alt="founder image"
                                width={40}
                                height={40}
                                className="object-cover rounded-lg"
                            />
                        </div>
                        <Link href="/about">
                            <Button variant="outline">about</Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}