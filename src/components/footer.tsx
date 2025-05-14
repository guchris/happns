import Link from "next/link"
import { Separator } from "@/components/ui/separator"

interface FooterProps {
    className?: string;
}

export default function Footer({ className }: FooterProps) {
    return (
        <div className={`${className}`}>
            <Separator />
            <footer className="w-full py-4 px-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-2 md:space-y-0 md:space-x-4">
                    {/* Left-aligned copyright text */}
                    <span className="text-sm font-medium text-left">
                        © 2025 happns
                    </span>

                    {/* Right-aligned links */}
                    <div className="flex justify-start md:justify-end space-x-2 md:space-x-4">
                        <Link href="/about" className="text-sm font-medium">about</Link>
                        <Link href="/contact" className="text-sm font-medium">contact</Link>
                        <Link href="https://discord.gg/uQdvmgmQYY" className="text-sm font-medium">discord</Link>
                        <Link href="https://instagram.com/happnsapp" target="_blank" className="text-sm font-medium">insta</Link>
                    </div>
                </div>
            </footer>
        </div>
  );
}