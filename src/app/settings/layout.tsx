"use client"

// Next Imports
import Link from "next/link"

// App Imports
import { useAuth } from "@/context/AuthContext"
import { TopBar } from "@/components/top-bar"
import { Footer } from "@/components/footer"
import { SidebarNav } from "@/components/sidebar-nav"
import Loading from "@/components/loading"

// Shadcn Imports
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Other Imports
import { ExclamationTriangleIcon } from "@radix-ui/react-icons"

const sidebarNavItems = [
    {
        title: "profile",
        href: "/settings"
    },
    {
        title: "account",
        href: "/settings/account"
    },
    {
        title: "notifications",
        href: "/settings/notifications"
    }
]

interface SettingsLayoutProps {
    children: React.ReactNode
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {

    const { user, loading } = useAuth();

    if (loading) {
        return <Loading title="happns/settings" />;
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
            <div className="flex flex-col lg:flex-row lg:space-x-0 lg:space-y-0">
                <aside className="lg:w-1/5 lg:min-h-screen p-4">
                    <SidebarNav items={sidebarNavItems} />
                </aside>
                <Separator orientation="vertical" className="hidden lg:block lg:h-auto" />
                <Separator className="lg:hidden" />
                <div className="flex-1 lg:max-w-2xl p-4">{children}</div>
            </div>
            <Footer className="mt-auto" />
        </div>
    )
}