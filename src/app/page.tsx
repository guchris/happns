// Next Imports
import { Metadata } from "next"
import { cookies } from "next/headers"

// App Imports
import { TopBar } from "@/components/top-bar"
import { Footer } from "@/components/footer"
import { EventCarousel } from "@/components/event-carousel"
import { CityGrid } from "@/components/city-grid"
import JoinCard from "@/components/join-card"
import CitySelector from "@/components/city-selector"
import EventGridDynamic from "@/components/event-grid-dynamic"
import { City, CarouselEvent } from "@/components/types"
import { getTotalUpcomingEvents } from "@/lib/eventUtils"

// Firebase Imports
import { auth, db } from "@/lib/firebaseAdmin"

// Shadcn Imports
import { Separator } from "@/components/ui/separator"
import { Card, CardTitle } from "@/components/ui/card"
import { Music, PartyPopper, Theater, Globe, Dumbbell, Users, Gamepad, Film } from "lucide-react"

export const dynamic = 'force-dynamic'

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
	const citiesRef = db.collection("cities");
  	const citySnapshot = await citiesRef.get();

	// For each city, fetch event counts in parallel
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
	const carouselRef = db.collection("carousel");
  	const carouselSnapshot = await carouselRef.get();

	// For each carousel item, fetch the corresponding event details from the "events" collection in parallel
	const carouselEvents = await Promise.all(
		carouselSnapshot.docs.map(async (carouselDoc) => {
			const eventId = carouselDoc.id;
			const eventDocRef = db.collection("events").doc(eventId);
			const eventDoc = await eventDocRef.get();

			if (eventDoc.exists) {
				const eventData = eventDoc.data();
				return {
					uid: eventId,
					image: eventData!.image,
				};
			} else {
				return null;
			}
		})
	);

	// Filter out any null values (in case an event was not found)
	return carouselEvents.filter((event): event is CarouselEvent => event !== null);
}

// Function to get the user's default city from Firestore
async function getUserCity(userId: string): Promise<string | null> {
	const userDocRef = db.collection("users").doc(userId);
	const userDoc = await userDocRef.get();

	if (userDoc.exists) {
		const userData = userDoc.data();
		return userData?.selectedCity || null;
	}
	return null;
}

export default async function Home() {
	const token = cookies().get('auth_token')?.value;
  	let userCity = null;

	if (token) {
		try {
			const decodedToken = await auth.verifyIdToken(token);
			const userId = decodedToken.uid;
			userCity = await getUserCity(userId);
		} catch (error) {
			console.error("Error verifying token or retrieving user city:", error);
		}
	}

	// Determine the city to use
	const cities = await fetchCities();
	const carouselEvents = await fetchCarouselEvents();
	const initialCity = userCity || "seattle";

	return (
		<div>
			{/* Intro Animation */}
			<div className="intro-animation">
				<h1>happns/</h1>
			</div>
			<div className="flex flex-col min-h-screen">
			<TopBar title="happns" />
			<Separator />

			<div className="flex-1 overflow-y-auto">

				{/* Hero Section */}
				<div className="flex flex-col max-w-[880px] md:max-w-[700px] lg:max-w-[880px] mx-auto py-16 p-4 space-y-8 items-center lg:flex-row lg:space-x-12">
					
					{/* Left Section: Slogan, City Selector */}
					<div className="lg:w-1/2 space-y-4">
						<h2 className="text-3xl font-bold">discover curated events happning in your city</h2>
						<CitySelector cities={cities} initialCity={initialCity} />
					</div>

					{/* Right Section: Event Photo Carousel */}
					<EventCarousel carouselEvents={carouselEvents} />

				</div>
				
				<Separator />

				<div className="py-12 space-y-8">

				{/* Events Grid */}
				<EventGridDynamic cities={cities} initialCity={initialCity} />

				{/* City Grid */}
				<CityGrid cities={cities} />

				{/* Join Card */}
				<JoinCard />

				{/* Categories Section */}
				<div className="flex-1 max-w-[880px] md:max-w-[700px] lg:max-w-[880px] mx-auto p-4 space-y-4">
					<h3 className="text-xl font-semibold">explore top categories</h3>
					<div className="grid grid-cols-4 lg:grid-cols-6 gap-4">
						{[
							{ name: "music", icon: <Music /> },
							{ name: "nightlife", icon: <PartyPopper /> },
							{ name: "arts", icon: <Theater /> },
							{ name: "culture", icon: <Globe /> },
							{ name: "fitness", icon: <Dumbbell /> },
							{ name: "family", icon: <Users /> },
							{ name: "gaming", icon: <Gamepad /> },
							{ name: "film", icon: <Film /> }
						].map((category) => (
							<div key={category.name} className="pointer-events-none opacity-50">
								<Card className="flex flex-col items-center justify-center p-4 h-24 space-y-1">
									<div className="flex items-center justify-center w-10 h-10 text-muted-foreground">{category.icon}</div>
									<CardTitle className="line-clamp-1 text-center text-base font-medium">{category.name}</CardTitle>
								</Card>
							</div>
						))}
					</div>
				</div>

				</div>
			</div>

			<Footer />

			</div>
		</div>
	);
}