// Next Imports
import Link from "next/link"

// Components Imports
import { TopBar } from "@/components/top-bar";

// Shadcn Imports
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
  

export default function CuratorsPage() {
    return (
        <div className="min-h-screen flex flex-col">
            <TopBar title={`happns/curators`} />
            <Separator />

            <div className="flex justify-center mt-4">
                <div className="w-full max-w-[800px] p-4 flex flex-col space-y-6">

                    {/* Curator Role Overview */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold">Become a Curator</CardTitle>
                            <CardDescription>
                                Help shape the discovery of events in your city and get rewarded!
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="text-sm space-y-4">
                            <p>
                                Curators are vital members of the happns community who play a key role in managing the &quot;Explore&quot; section for their city. As a curator, you have the privilege of adding events to the platform and ensuring that the best events get highlighted.
                            </p>
                            <p>
                                Curators are compensated for their efforts. You will earn $2 for every valid event you submit, with a maximum of $100 per day.
                            </p>
                            <Alert>
                                <AlertTitle>Note</AlertTitle>
                                <AlertDescription>
                                    Each event submitted must be relevant and accurate. Curators found submitting false information may be subject to removal from the program.
                                </AlertDescription>
                            </Alert>
                        </CardContent>
                    </Card>

                    {/* Benefits of Being a Curator */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-semibold">Why Become a Curator?</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-4">
                            <ul className="list-disc list-inside">
                                <li><strong>Direct Impact:</strong> Influence the events highlighted in your city.</li>
                                <li><strong>Get Paid:</strong> Earn $2 for each valid event you submit.</li>
                                <li><strong>Community Involvement:</strong> Help connect your community with the best events around.</li>
                            </ul>
                        </CardContent>
                    </Card>

                    {/* Application Call to Action */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-semibold">Ready to Apply?</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-4">
                            <p>
                                If you&rsquo;re passionate about events and want to contribute to the happns community, apply to become a curator today! Click the link below to get started.
                            </p>
                            <div className="flex justify-left">
                                <Link href="/" passHref>
                                    <Button>Apply to Become a Curator</Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}