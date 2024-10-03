// Next Imports
import Link from "next/link"
import Image from "next/image"

// Shadcn Imports
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"

interface CarouselEvent {
    uid: string;
    image: string;
}

interface EventCarouselProps {
    carouselEvents: CarouselEvent[];
}

export function EventCarousel({ carouselEvents }: EventCarouselProps) {
    return (
        <div className="hidden lg:w-1/2 lg:block">
            <Carousel
                opts={{
                    align: "center",
                    loop: true,
                }}
                className="w-full max-w-lg"
            >
                <CarouselContent>
                    {carouselEvents.map((event) => (
                        <CarouselItem key={event.uid} className="md:basis-1/4 lg:basis-1/3 pb-5">
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