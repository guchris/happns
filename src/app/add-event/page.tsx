import Link from "next/link";

import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button";

export default function CityPage() {

    return (
        <>
            <div className="flex h-full flex-col">
                <div className="w-full flex items-center justify-between py-4 px-4 h-14">
                    <h2 className="text-lg font-semibold">
                        <Link href="/">happns</Link>
                        /add-event
                    </h2>
                    <Button variant="secondary">
                        <Link href="" target="_blank">
                            Submit
                        </Link>
                    </Button>
                </div>
                <Separator />
            </div>
        </>
    );
}
