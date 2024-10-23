// Next Imports
import Image from "next/image"

// App Imports
import { TopBar } from "@/components/top-bar"
import Footer from "@/components/footer"

// Shadcn Imports
import { Separator } from "@/components/ui/separator"
  

export default function AboutPage() {
    return (
        <div className="min-h-screen flex flex-col">
            <TopBar title={`happns/about`} />
            <Separator />
            <div className="flex-1 px-4 py-8 max-w-[880px] mx-auto space-y-4">
                <h1 className="text-xl font-semibold">about happns</h1>
                <p className="text-sm">
                    <b>happns</b> was created by Christopher Gu in Seattle out of a desire to solve a personal problem: he found it difficult to discover what was happening in his city. As someone who loves exploring local events and connecting with the community, Christopher was frustrated by the lack of a centralized platform that aggregated all the interesting happenings around town.
                </p>
                <p className="text-sm">
                    Inspiration struck one day while he was walking through the neighborhoods of Seattle, glancing at electricity poles plastered with flyers for events. These poles, covered in layers of paper and staples, were the closest thing he could find to a comprehensive event listing. But it wasn&apos;t practical. There had to be a better way to bring together all the city&apos;s events in one place.
                </p>

                {/* Row Grid of Images */}
                <div className="grid grid-cols-4 gap-4 my-6">
                    <Image 
                        src="/about/flyers1.jpg"
                        alt="Flyer 1" 
                        width={200}
                        height={300}
                        className="object-cover rounded-md"
                    />
                    <Image 
                        src="/about/flyers2.jpg"
                        alt="Flyer 2" 
                        width={200}
                        height={300}
                        className="object-cover rounded-md"
                    />
                    <Image 
                        src="/about/flyers3.jpg"
                        alt="Flyer 3"
                        width={200}
                        height={300}
                        className="object-cover rounded-md"
                    />
                    <Image 
                        src="/about/flyers4.jpg"
                        alt="Flyer 4"
                        width={200}
                        height={300}
                        className="object-cover rounded-md"
                    />
                </div>

                <p className="text-sm">
                    From this experience, happns was born. Chris envisioned a platform where curated events could be easily found, shared, and experienced. His goal was to create a digital space that captures the vibrant pulse of the city, showcasing everything from community meetups to music festivals and art shows. Whether you&apos;re looking for a fun night out, a new hobby, or a way to connect with like-minded people, happns is here to help you discover the best of your city.
                </p>
                <p className="text-sm">
                    Today, happns is filled with handpicked events, making it easier than ever for Seattleites to find out what&apos;s happening around them. Christopher hopes to expand happns to more cities, helping communities everywhere stay connected and engaged.
                </p>
            </div>
            <Footer className="mt-auto" />
        </div>
    )
}