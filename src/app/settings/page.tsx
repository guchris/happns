// Components Imports
import { TopBar } from "@/components/top-bar";

// Shadcn Imports
import { Separator } from "@/components/ui/separator"

export default function SettingsPage() {
    return (
        <div className="h-screen flex flex-col">
            <TopBar title={`happns/settings`} />
            <Separator />
        </div>
    )
}