// Components Imports
import { TopBar } from "@/components/top-bar";

// Shadcn Imports
import { Separator } from "@/components/ui/separator"
  

export default function AboutPage() {
    return (
        <div className="min-h-screen flex flex-col">
            <TopBar title={`happns/about`} />
            <Separator />
        </div>
    )
}