import { Separator } from "@/components/ui/separator";
import { TopBar } from "@/components/top-bar";
import { Footer } from "@/components/footer";

interface LoadingProps {
    title: string;
}

export default function Loading({ title }: LoadingProps) {
    return (
        <div className="min-h-screen flex flex-col">
            <TopBar title={title} />
            <Separator />
            <h1 className="text-lg font-semibold p-4">Loading...</h1>
            <Footer className="mt-auto" />
        </div>
    )
}