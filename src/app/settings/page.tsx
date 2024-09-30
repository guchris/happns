// Shadcn Imports
import { Separator } from "@/components/ui/separator"

export default function SettingsProfilePage() {
    return (
        <div className="space-y-6">
            <div className="p-4">
                <h1 className="text-lg font-semibold">profile</h1>
                <p className="text-sm text-muted-foreground">
                    configure your profile
                </p>
            </div>
            <Separator />
        </div>
    )
}