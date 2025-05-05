// Next Imports
import { Metadata } from "next"

// App Imports
import { TopBar } from "@/components/top-bar"
import CitySelector from "@/components/city-selector"
import EventCarousel from "@/components/event-carousel"
import CityGrid from "@/components/city-grid"
import EventGridDynamic from "@/components/event-grid-dynamic"
import EventGridAttendanceTabsClient from "@/components/event-grid-attendance-tabs-client"
import EventGridBookmark from "@/components/event-grid-bookmark"
import WelcomeCard from "@/components/card-welcome"
import JoinCard from "@/components/card-join"
import Footer from "@/components/footer"
import { CarouselEvent } from "@/components/types"
import { getTotalUpcomingEvents } from "@/lib/eventUtils"

// Firebase Imports
import { db } from "@/lib/firebase"
import { collection, doc, getDoc, getDocs } from "firebase/firestore"

// Shadcn Imports
import { Separator } from "@/components/ui/separator"


export const dynamic = 'force-dynamic';

// Generate page metadata
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

	// Fetch event counts for all cities in parallel
	const cities = await Promise.all(
		citySnapshot.docs.map(async (doc) => {
			const cityData = doc.data();
			const upcomingEventCount = await getTotalUpcomingEvents(cityData.slug);
			return {
				id: doc.id,
				name: cityData.name,
				slug: cityData.slug,
				lat: cityData.lat,
				lon: cityData.lon,
				slogan: cityData.slogan,
				description: cityData.description,
				upcomingEventCount,
			};
		})
	);

	return cities;
}

// Fetch carousel event data
async function fetchCarouselEvents() {
	const carouselRef = collection(db, "carousel");
	const carouselSnapshot = await getDocs(carouselRef);

	//Fetch event details for all carousel items in parallel
	const carouselEvents = await Promise.all(
		carouselSnapshot.docs.map(async (carouselDoc) => {
			const eventId = carouselDoc.id;

			const eventDocRef = doc(db, "events", eventId);
			const eventDoc = await getDoc(eventDocRef);

			if (eventDoc.exists()) {
				const eventData = eventDoc.data();
				return {
					uid: eventId,
					image: eventData.image,
				};
			} else {
				return null;
			}
		})
	);

	// Filter out any null values (in case an event was not found)
	return carouselEvents.filter((event): event is CarouselEvent => event !== null);
}

export default async function Home() {
	const cities = await fetchCities();
	const carouselEvents = await fetchCarouselEvents();

	return (
		<div>
			{/* Intro Animation */}
			<div className="intro-animation">
				<h1>
					happns<span className="slash">/</span>
				</h1>
			</div>

			{/* Main Content */}
			<div className="flex flex-col min-h-screen">
				<TopBar title="happns" />
				<Separator />

				<div className="flex-1 flex flex-col justify-center overflow-y-auto">

					{/* Hero Section */}
					<div className="flex flex-col max-w-[880px] md:max-w-[700px] lg:max-w-[880px] mx-auto p-4 space-y-8 items-center lg:flex-row lg:space-x-12">
						
						{/* Left Section: Slogan, City Selector */}
						<div className="lg:w-1/2 space-y-4">
							<h2 className="text-3xl font-bold">discover curated events happning in your city</h2>
							<CitySelector cities={cities} />
						</div>

						{/* Right Section: Event Photo Carousel */}
						<EventCarousel carouselEvents={carouselEvents} />

					</div>
					
					{/* <Separator /> */}

					{/* <div className="py-12 space-y-8"> */}

						{/* Welcome Card */}
						{/* <WelcomeCard /> */}

						{/* Attending Events Grid */}
						{/* <EventGridAttendanceTabsClient /> */}

						{/* Bookmarked Events Grid */}
						{/* <EventGridBookmark /> */}

						{/* Events Grid */}
						{/* <EventGridDynamic cities={cities} /> */}

						{/* Join Card */}
						{/* <JoinCard /> */}

						{/* City Grid */}
						{/* <CityGrid cities={cities} /> */}

					{/* </div> */}
				</div>

				<Footer />

			</div>
		</div>
	);
}