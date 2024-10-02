// Next Imports
import { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"

// App Imports
import { TopBar } from "@/components/top-bar"
import { Footer } from "@/components/footer"
import { getTotalUpcomingEvents } from "@/lib/eventUtils"

// Firebase Imports
import { db } from "@/lib/firebase"
import { collection, getDocs } from "firebase/firestore"

// Shadcn Imports
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"

// Other Imports
import { CalendarIcon, MagnifyingGlassIcon } from "@radix-ui/react-icons"

const ad = { id: 1, imageUrl: "/ads/ad1.jpg", link: "https://seattle.boo-halloween.com/" }

export const dynamic = 'force-dynamic';

// Helper function to get metadata
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "happns | events in your city",
    description: "discover curated events happening in your city with happns",
    openGraph: {
      title: "happns | events in your city",
      description: "discover curated events happening in your city with happns",
      images: ["https://ithappns.com/logo.png"],
      url: "https://ithappns.com",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "happns | events in your city",
      description: "discover curated events happening in your city with happns",
      images: ["https://ithappns.com/logo.png"],
    },
  };
}

// Fetch cities and total upcoming events
async function fetchCities() {
  const citiesRef = collection(db, "cities");
  const citySnapshot = await getDocs(citiesRef);
  
  // Use Promise.all to fetch event counts for all cities in parallel
  const cities = await Promise.all(
    citySnapshot.docs.map(async (doc) => {
      const cityData = doc.data();
      const upcomingEventCount = await getTotalUpcomingEvents(cityData.slug);
      return {
        name: cityData.name,
        slug: cityData.slug,
        description: cityData.description,
        upcomingEventCount,
      };
    })
  );

  return cities;
}

export default async function Home() {

  const cities = await fetchCities();
  const defaultCity = "seattle";
  const selectedCity = defaultCity;

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar title="happns" />
      <Separator />

      <div className="flex-1 overflow-y-auto">
        {/* Hero Section */}
        <div className="py-16">
            <div className="flex flex-col max-w-[880px] mx-auto space-y-8 p-4 lg:flex-row lg:space-x-12 items-center">
                
                {/* Left Section: Slogan and CTA */}
                <div className="lg:w-1/2 space-y-4">
                    <h2 className="text-3xl font-bold">discover curated events happning in your city</h2>
                    
                    <div className="flex items-center space-x-2">

                      {/* City Selection */}
                      <Select defaultValue={defaultCity}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your city" />
                        </SelectTrigger>
                        <SelectContent>
                          {cities.map((city) => (
                            <SelectItem key={city.slug} value={city.slug}>
                              {city.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Explore Button */}
                      <Link href={`/${selectedCity}/explore`}>
                          <Button>explore</Button>
                      </Link>
                    </div>
                </div>

                {/* Right Section: Event Photo Carousel */}
                <div className="hidden lg:w-1/2 lg:block">
                  <Carousel
                    opts={{
                      align: "center",
                      loop: true,
                    }}
                    className="w-full max-w-lg"
                  >
                    <CarouselContent>
                      {Array.from({ length: 5 }).map((_, index) => (
                        <CarouselItem key={index} className="md:basis-1/4 lg:basis-1/3 pb-5">
                            <Image
                              src={`/carousel/photo${index + 1}.jpg`}
                              alt={`Event photo ${index + 1}`}
                              className="object-cover w-full h-full rounded-lg"
                              width={300}
                              height={300}
                            />
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                  </Carousel>
                </div>
            </div>
        </div>
        
        <Separator />

        {/* City Cards */}
        <div className="flex-1 mx-auto max-w-[880px]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 w-full">
            {cities.map((city) => {
              return (
                <Link href={`/${city.slug}`} key={city.name}>
                  <Card className="w-full">
                    <CardHeader className="space-y-2">
                      <CardTitle className="text-base w-full">{city.name}</CardTitle>
                      <CardDescription className="line-clamp-2 w-full">{city.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <CalendarIcon className="mr-1 h-3 w-3" />
                          {city.upcomingEventCount} upcoming events
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

      </div>

      {/* <div className="flex-grow w-full max-w-[880px] mx-auto p-4">
        <div className="w-full p-4">
          <Link href={ad.link}>
            <Image
                src={ad.imageUrl}
                alt={`Ad ${ad.id}`}
                width={880}
                height={495}
                className="w-full h-auto rounded-lg object-cover"
            />
          </Link>
          <p className="text-center text-xs text-gray-500 mt-1">sponsored</p>
        </div>
      </div> */}

      <Footer />
    </div>
  );
}
