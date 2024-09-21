import Link from "next/link"
import { Separator } from "@/components/ui/separator"

export function Footer() {
  return (
    <>
        <Separator />
        <footer className="w-full py-4 px-4">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                {/* Left-aligned copyright text */}
                <span className="text-sm font-medium text-center md:text-left">
                    © 2024 happns
                </span>

                {/* Right-aligned links */}
                <div className="flex justify-center md:justify-end space-x-4">
                    <Link href="/about" className="text-sm font-medium">about</Link>
                    <Link href="/curators" className="text-sm font-medium">curators</Link>
                    <Link href="mailto:cleegu+happns@gmail.com" className="text-sm font-medium">email</Link>
                    <Link href="https://instagram.com/happnsapp" target="_blank" className="text-sm font-medium">insta</Link>
                </div>
            </div>
        </footer>
    </>
  );
}