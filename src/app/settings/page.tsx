// App Imports
import { TopBar } from "@/components/top-bar"
import { Footer } from "@/components/footer"

// Shadcn Imports
import { Separator } from "@/components/ui/separator"

export default function SettingsPage() {
    return (
        <div className="min-h-screen flex flex-col">
            <TopBar title={`happns/settings`} />
            <Separator />
            <Footer className="mt-auto" />
        </div>
    )
}