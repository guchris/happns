// Next Imports
import Link from "next/link"
import Image from "next/image"

// Shadcn Imports
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel"

interface CarouselEvent {
    uid: string;
    image: string;
}

interface EventCarouselProps {
    carouselEvents: CarouselEvent[];
}

export function EventCarousel({ carouselEvents }: EventCarouselProps) {
    return (
        <div className="flex flex-col lg:flex-row justify-center items-center w-full">
            <Carousel
                opts={{
                    align: "center",
                    loop: true,
                }}
                className="w-full max-w-lg"
            >
                <CarouselContent>
                    {carouselEvents.map((event) => (
                        <CarouselItem
                            key={event.uid}
                            className="basis-1/3 sm:basis-1/4 md:basis-1/5 lg:basis-1/3 pb-5"
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
                        </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>
        </div>
    )
}