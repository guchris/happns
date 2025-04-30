import { NextApiRequest, NextApiResponse } from "next"
import * as cheerio from "cheerio"
import { Event } from "@/components/types"
import { format, parse } from "date-fns"

// Firebase Admin imports
import { getFirestore } from "firebase-admin/firestore"
import { initializeApp, getApps, cert } from "firebase-admin/app"

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
    initializeApp({
        credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY!)),
        databaseURL: "https://happns-default-rtdb.firebaseio.com"
    });
}

const db = getFirestore()

// Reuse the same headers and helper functions from the original scraper
const headers = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1"
}

// Helper function to check if an event already exists in either collection
async function eventExists(link: string): Promise<boolean> {
    try {
        // Check approved events collection
        const eventsSnapshot = await db.collection("events").where("link", "==", link).get()
        
        if (!eventsSnapshot.empty) {
            return true
        }

        // Check pending events collection
        const pendingSnapshot = await db.collection("pending-events").where("link", "==", link).get()
        
        return !pendingSnapshot.empty
    } catch (error) {
        console.error("Error checking if event exists:", error)
        return false
    }
}

async function scrapeEventDetails(url: string): Promise<{
    name: string;
    startDate: string;
    endDate: string;
    times: { startTime: string; endTime: string; }[];
    location: string;
    details: string;
    image: string;
}> {
    try {
        console.log(`Fetching event details from: ${url}`)
        const response = await fetch(url, { headers })
        const html = await response.text()
        console.log(`Received HTML content length for ${url}:`, html.length)
        
        const $ = cheerio.load(html)

        // Get event name from the detail page and clean it
        let name = $("h1").text().trim()
        // Remove newsletter subscription text and "Done!" if present
        name = name.replace(/Subscribe to our Newsletter.*?Done!/g, "").replace(/Done!/g, "").trim()
        console.log("Found event name:", name)

        // Get location from the detail page - try different selectors
        let location = ""
        const locationSelectors = [
            ".venue-name",
            ".location-name",
            ".venue",
            ".location"
        ]
        
        for (const selector of locationSelectors) {
            const text = $(selector).text().trim()
            if (text) {
                // Remove "(Seattle)" and any extra whitespace
                location = text.replace(/\s*\(Seattle\)\s*/, "").trim()
                console.log("Found location:", location)
                break
            }
        }

        // Get description from the detail page - try different selectors
        let details = ""
        const detailsSelectors = [
            ".event-description",
            ".description",
            ".event-details",
            ".details"
        ]
        
        for (const selector of detailsSelectors) {
            const text = $(selector).text().trim()
            if (text) {
                details = text
                console.log("Found details length:", details.length)
                break
            }
        }

        // Get image from the detail page - try different selectors
        let image = ""
        const imageSelectors = [
            ".event-image img",
            ".event-header img",
            ".event-header-image img",
            "article img",
            ".image img",
            ".event img",
            "img.event-image",
            "img.main-image"
        ]
        
        // Debug: log all img tags found
        console.log("All img tags found:", $("img").length)
        $("img").each((i, el) => {
            console.log(`Image ${i} src:`, $(el).attr("src"))
        })
        
        for (const selector of imageSelectors) {
            const $img = $(selector)
            console.log(`Trying selector ${selector}, found:`, $img.length)
            image = $img.attr("src") || ""
            if (image) {
                console.log("Found image URL:", image)
                break
            }
        }

        return {
            name,
            startDate: "",
            endDate: "",
            times: [{ startTime: "", endTime: "" }],
            location,
            details,
            image
        }
    } catch (error) {
        console.error(`Error scraping event details from ${url}:`, error)
        throw error
    }
}

async function scrapeTopEvents(): Promise<Event[]> {
    try {
        console.log("Fetching top events page...")
        const response = await fetch("https://everout.com/seattle/top-events/", {
            headers: {
                ...headers,
                "Cache-Control": "no-cache",
                "Pragma": "no-cache",
                "Sec-Fetch-Dest": "document",
                "Sec-Fetch-Mode": "navigate",
                "Sec-Fetch-Site": "none",
                "Sec-Fetch-User": "?1"
            }
        })
        const html = await response.text()
        console.log("Received HTML content length:", html.length)
        
        const $ = cheerio.load(html)
        
        // Find event cards with the correct class combination
        const eventCards = $(".item-card").toArray()
        console.log("Found event cards:", eventCards.length)

        if (eventCards.length === 0) {
            console.log("No event cards found. HTML preview:", html.substring(0, 500))
            return []
        }

        const events: Event[] = []
        // Process first 20 events
        const cardsToProcess = eventCards.slice(0, 20)
        console.log(`Processing first 20 events (${cardsToProcess.length} found)`)

        for (const card of cardsToProcess) {
            try {
                const $card = $(card)
                
                // Get the event link from the card
                const link = $card.find("a").attr("href") || ""
                if (!link) {
                    console.log("Skipping card - no link found")
                    continue
                }
                console.log("Found event link:", link)

                // Get the image URL from the card
                const cardImage = $card.find("img").attr("src") || ""
                console.log("Found card image URL:", cardImage)

                console.log("Processing event from link:", link)
                const eventDetails = await scrapeEventDetails(link)
                
                const event: Event = {
                    id: "",
                    name: eventDetails.name,
                    link,
                    startDate: eventDetails.startDate,
                    endDate: eventDetails.endDate,
                    times: eventDetails.times,
                    location: eventDetails.location || "Location TBD",
                    details: eventDetails.details,
                    category: [],
                    city: "seattle",
                    clicks: 0,
                    cost: { type: "single", value: 0 },
                    format: "in-person",
                    gmaps: "",
                    image: cardImage || eventDetails.image,
                    neighborhood: "",
                    eventDurationType: "single",
                    status: "pending",
                    attendanceSummary: {
                        yesCount: 0,
                        maybeCount: 0,
                        noCount: 0
                    }
                }

                events.push(event)
                console.log("Successfully processed event:", event.name)
            } catch (error) {
                console.error("Error processing event card:", error)
                continue
            }
        }

        return events
    } catch (error) {
        console.error("Error scraping events:", error)
        throw error
    }
}

async function parsePriceString(priceStr: string): Promise<{
    type: "single" | "range" | "minimum";
    value: number | [number, number];
}> {
    try {
        priceStr = priceStr.toLowerCase().trim()
        
        if (priceStr === "free" || priceStr === "") {
            return { type: "single", value: 0 }
        }

        // Remove dollar signs and spaces
        priceStr = priceStr.replace(/\$/g, "").trim()

        if (priceStr.includes("-")) {
            // Handle range (e.g., "15-25")
            const [min, max] = priceStr.split("-").map(Number)
            return { type: "range", value: [min, max] }
        } else if (priceStr.includes("+")) {
            // Handle minimum (e.g., "25+")
            const value = parseInt(priceStr.replace("+", ""))
            return { type: "minimum", value }
        } else {
            // Handle single value
            const value = parseInt(priceStr)
            return { type: "single", value }
        }
    } catch (error) {
        console.error("Error parsing price:", error)
        return { type: "single", value: 0 }
    }
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    // Verify the request is from Vercel Cron (skip in development)
    if (process.env.NODE_ENV === "production") {
        const authHeader = req.headers.authorization
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return res.status(401).json({ success: false, message: "Unauthorized" })
        }
    }

    try {
        const newEvents = await scrapeTopEvents()
        const eventsToAdd = []
        
        console.log("\n=== Scraper Summary ===")
        console.log(`Total events found: ${newEvents.length}`)
        
        // Check each event and only add if it doesn't exist
        for (const event of newEvents) {
            const exists = await eventExists(event.link)
            if (!exists) {
                eventsToAdd.push(event)
            }
        }

        console.log(`New events to be added: ${eventsToAdd.length}`)
        console.log(`Events already in database: ${newEvents.length - eventsToAdd.length}`)
        
        if (eventsToAdd.length > 0) {
            console.log("\nNew events:")
            eventsToAdd.forEach((event, index) => {
                console.log(`${index + 1}. ${event.name} @ ${event.location}`)
            })
            // Add new events to pending-events collection
            const batch = db.batch()
            for (const event of eventsToAdd) {
                const docRef = db.collection("pending-events").doc()
                event.id = docRef.id // Assign the Firestore document ID
                batch.set(docRef, event)
            }
            await batch.commit()
        }

        return res.status(200).json({ 
            success: true, 
            message: `Found ${newEvents.length} events, added ${eventsToAdd.length} new events`,
            events: eventsToAdd 
        })
    } catch (error) {
        console.error("Error in handler:", error)
        return res.status(500).json({ 
            success: false, 
            message: "Failed to scrape events",
            error: error instanceof Error ? error.message : "Unknown error"
        })
    }
} 