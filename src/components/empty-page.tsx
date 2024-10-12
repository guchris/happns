import { Separator } from "@/components/ui/separator";
import { TopBar } from "@/components/top-bar";
import { Footer } from "@/components/footer";

interface EmptyPageProps {
    title: string;
    description: string;
}

export default function EmptyPage({ title, description }: EmptyPageProps) {
    return (
        <div className="min-h-screen flex flex-col">
            <TopBar title={title} />
            <Separator />
            <h1 className="text-lg font-semibold p-4">{description}</h1>
            <Footer className="mt-auto" />
        </div>
    )
}