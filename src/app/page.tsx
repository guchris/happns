// Next Imports
import { Metadata } from "next"
import Link from "next/link"

// App Imports
import { TopBar } from "@/components/top-bar"
import Footer from "@/components/footer"
import { CarouselEvent } from "@/components/types"
import { getTotalUpcomingEvents } from "@/lib/eventUtils"
import HomeClientRedirect from "@/components/home-client-redirect"

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
		<>
			<HomeClientRedirect />
			<div className="flex flex-col min-h-safe-screen">
				{/* Intro Animation */}
				<div className="intro-animation">
					<h1>
						happns<span className="slash">/</span>
					</h1>
				</div>

				{/* Main Content */}
				<div className="flex flex-col flex-1">
					<TopBar title="happns" />
					<Separator />
					<Link href="/seattle" className="w-full block">
						<div className="flex items-center justify-between h-14 px-4 text-lg font-semibold hover:bg-neutral-100 transition cursor-pointer">
							<span>happns/seattle</span>
							<span>--&gt;</span>
						</div>
					</Link>
					<Separator />
					<Link href="/portland" className="w-full block">
						<div className="flex items-center justify-between h-14 px-4 text-lg font-semibold hover:bg-neutral-100 transition cursor-pointer">
							<span>happns/portland</span>
							<span>--&gt;</span>
						</div>
					</Link>
					<Separator />
					<div className="flex items-center justify-between h-14 px-4 text-lg font-semibold text-neutral-200 cursor-not-allowed select-none">
						<span>happns/vancouver</span>
						<span>--&gt;</span>
					</div>
					<Separator />
					<div className="flex items-center justify-between h-14 px-4 text-lg font-semibold text-neutral-200 cursor-not-allowed select-none">
						<span>happns/san-francisco</span>
						<span>--&gt;</span>
					</div>
					<Separator />
					<div className="flex items-center justify-between h-14 px-4 text-lg font-semibold text-neutral-200 cursor-not-allowed select-none">
						<span>happns/los-angeles</span>
						<span>--&gt;</span>
					</div>
					<Separator />
					<div className="flex items-center justify-between h-14 px-4 text-lg font-semibold text-neutral-200 cursor-not-allowed select-none">
						<span>happns/san-diego</span>
						<span>--&gt;</span>
					</div>
					<Separator />
				</div>
				<Footer />
			</div>
		</>
	);
}