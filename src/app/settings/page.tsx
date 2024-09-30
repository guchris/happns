// App Imports
import ProfileForm from "@/app/settings/profile-form"

export default function SettingsProfilePage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-lg font-semibold">profile</h1>
                <p className="text-sm text-muted-foreground">
                    configure your profile
                </p>
            </div>
            <ProfileForm />
        </div>
    )
}