// App Imports
import { NotificationsForm } from "@/app/settings/notifications/notifications-form"

// Shadcn Imports
import { Separator } from "@/components/ui/separator"

export default function SettingsNotificationsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-lg font-semibold">notifications</h1>
                <p className="text-sm text-muted-foreground">
                    configure how you receive notifications
                </p>
            </div>
            <NotificationsForm />
        </div>
    )
}