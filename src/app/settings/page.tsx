// Shadcn Imports
import { Separator } from "@/components/ui/separator"

export default function SettingsProfilePage() {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Profile</h3>
                <p className="text-sm text-muted-foreground">
                    Configure your profile.
                </p>
            </div>
            <Separator />
        </div>
    )
}