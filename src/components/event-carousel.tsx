// Next Imports
import Link from "next/link"
import Image from "next/image"

// App Imports
import { CarouselEvent } from "@/components/types"

interface EventCarouselProps {
    carouselEvents: CarouselEvent[];
}

export default function EventCarousel({ carouselEvents }: EventCarouselProps) {
    return (
        <div className="w-full">
            {/* Show 3 images on small and large screens */}
            <div className="flex justify-center items-center space-x-4 md:hidden lg:flex">
                {carouselEvents.slice(0, 3).map((event) => (
                    <div 
                        key={event.uid} 
                        className="w-1/3 pb-7"
                    >
                        <Link href={`/events/${event.uid}`}>
                            <Image
                                src={event.image}
                                alt={`Event photo ${event.uid}`}
                                className="object-cover w-full h-full rounded-lg"
                                width={300}
                                height={300}
                            />
                        </Link>
                    </div>
                ))}
            </div>

            {/* Show 5 images on medium screens only */}
            <div className="hidden md:flex justify-center items-center max-w-[700px] mx-auto space-x-4 lg:hidden">
                {carouselEvents.slice(0, 5).map((event) => (
                    <div 
                        key={event.uid} 
                        className="flex-grow pb-5" // Flex-grow makes items adjust to fit
                    >
                        <Link href={`/events/${event.uid}`}>
                            <Image
                                src={event.image}
                                alt={`Event photo ${event.uid}`}
                                className="object-cover w-full h-full rounded-lg"
                                width={300}
                                height={300}
                            />
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    )
}