"use client"

// Next Imports
import Link from "next/link"

// App Imports
import { useAuth } from "@/context/AuthContext"
import { TopBar } from "@/components/top-bar"
import { Footer } from "@/components/footer"
import { SidebarNav } from "@/components/sidebar-nav"

// Shadcn Imports
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Other Imports
import { ExclamationTriangleIcon } from "@radix-ui/react-icons"

const sidebarNavItems = [
    {
        title: "Profile",
        href: "/settings"
    },
    {
        title: "Account",
        href: "/settings/account"
    },
    {
        title: "Notifications",
        href: "/settings/notifications"
    }
]

interface SettingsLayoutProps {
    children: React.ReactNode
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {

    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col">
                <TopBar title={`happns/settings`} />
                <Separator />
                <h1 className="text-lg font-semibold p-4">Loading...</h1>
                <Footer className="mt-auto" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen flex flex-col">
                <TopBar title={`happns/settings`} />
                <Separator />
                <div className="px-4">
                    <Alert className="max-w-3xl my-6 mx-auto p-4">
                        <ExclamationTriangleIcon className="h-4 w-4" />
                        <AlertTitle>Not Authorized</AlertTitle>
                        <AlertDescription>
                            You do not have permission to view this page. Please <Link href="/auth" className="text-blue-500">login</Link>.
                        </AlertDescription>
                    </Alert>
                </div>
                <Footer className="mt-auto" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col">
            <TopBar title={`happns/settings`} />
            <Separator />
            <div className="p-4 space-y-6">
                <div>
                    <h1 className="text-lg font-semibold">Settings</h1>
                    <p className="text-sm text-muted-foreground">
                        Manage your account settings and set e-mail preferences.
                    </p>
                </div>
                <Separator />
                <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0 p-4">
                    <aside className="-mx-4 lg:w-1/5">
                        <SidebarNav items={sidebarNavItems} />
                    </aside>
                    <div className="flex-1 lg:max-w-2xl">{children}</div>
                </div>
            </div>
            <Footer className="mt-auto" />
        </div>
    )
}