// App Imports
import { TopBar } from "@/components/top-bar"
import Footer from "@/components/footer"
import NotificationForm from "@/components/form-notification"

// Shadcn Imports
import { Separator } from "@/components/ui/separator"

export default function AdminPage() {
    return (
        <div className="min-h-screen flex flex-col">
            <TopBar title={`happns/about`} />
            <Separator />
            <div className="flex-1 px-4 py-8 mx-auto space-y-4 max-w-[880px] w-full">
                <NotificationForm />
            </div>
            <Footer className="mt-auto" />
        </div>
    )
}