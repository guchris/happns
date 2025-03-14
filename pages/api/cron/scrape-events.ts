import { NextApiRequest, NextApiResponse } from "next"
import * as cheerio from "cheerio"
import { Event } from "@/components/types"
import { format, parse } from "date-fns"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, addDoc } from "firebase/firestore"

// Reuse the same headers and helper functions from the original scraper
const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1'
}

// Helper function to check if an event already exists in either collection
async function eventExists(link: string): Promise<boolean> {
    // Check approved events collection
    const eventsRef = collection(db, "events")
    const eventsQuery = query(eventsRef, where("link", "==", link))
    const eventsSnapshot = await getDocs(eventsQuery)
    
    if (!eventsSnapshot.empty) {
        return true
    }

    // Check pending events collection
    const pendingEventsRef = collection(db, "pending-events")
    const pendingQuery = query(pendingEventsRef, where("link", "==", link))
    const pendingSnapshot = await getDocs(pendingQuery)
    
    return !pendingSnapshot.empty
}

async function scrapeEventDetails(url: string): Promise<{
    details: string;
    category: string[];
    fullName: string;
}> {
    try {
        const response = await fetch(url, { headers })
        const html = await response.text()
        const $ = cheerio.load(html)

        // Get event description
        const details = $(".event-description").text().trim()

        // Get the full event name from the event page
        const fullName = $("h1.event-title").text().trim()

        // Get categories from tags
        const categories = $(".event-tags .tag")
            .map((_, el) => $(el).text().trim())
            .get()
            .filter(tag => tag !== "")

        return {
            details,
            category: categories,
            fullName
        }
    } catch (error) {
        console.error(`Error scraping event details from ${url}:`, error)
        return {
            details: "",
            category: [],
            fullName: ""
        }
    }
}

async function parseDateAndTime(dateStr: string, timeStr: string): Promise<{
    startDate: string;
    endDate: string;
    times: { startTime: string; endTime: string; }[];
    eventDurationType: "single" | "multi" | "extended";
}> {
    try {
        // Parse the date string (e.g., "Monday Dec 25" or "Dec 25")
        const date = parse(dateStr, "EEEE MMM d", new Date())
        
        // Parse time string (e.g., "7:30 pm" or "7:30 pm - 9:30 pm")
        let startTime = ""
        let endTime = ""
        
        if (timeStr) {
            const timeParts = timeStr.split("-").map(t => t.trim())
            startTime = timeParts[0]
            endTime = timeParts[1] || ""
        }

        return {
            startDate: date.toISOString(),
            endDate: date.toISOString(), // Assuming single-day event for now
            times: [{
                startTime,
                endTime
            }],
            eventDurationType: "single"
        }
    } catch (error) {
        console.error("Error parsing date and time:", error)
        return {
            startDate: new Date().toISOString(),
            endDate: new Date().toISOString(),
            times: [{ startTime: "", endTime: "" }],
            eventDurationType: "single"
        }
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

async function scrapeEvents(): Promise<Event[]> {
    try {
        // Fetch the webpage with headers
        const response = await fetch("https://everout.com/seattle/top-events/", { headers })
        const html = await response.text()
        
        // Load the HTML into cheerio
        const $ = cheerio.load(html)
        
        // Find the "Recommended Events by Day" section
        const newEvents: Event[] = []
        
        // Each day's events are in a section with class "day-section"
        for (const daySection of $(".day-section").toArray()) {
            const $daySection = $(daySection)
            
            // Get the date from the section header
            const dateStr = $daySection.find(".date").text().trim()
            
            // Get all events for this day
            for (const eventItem of $daySection.find(".event-item").toArray()) {
                const $event = $(eventItem)
                const link = $event.find("a").attr("href") || ""

                // Skip if we've already scraped this event
                if (await eventExists(link)) {
                    console.log(`Skipping existing event: ${link}`)
                    continue
                }

                const previewName = $event.find(".event-title").text().trim()
                const location = $event.find(".venue-name").text().trim()
                const timeStr = $event.find(".time").text().trim()
                const image = $event.find("img").attr("src") || ""
                const priceStr = $event.find(".price").text().trim()

                // Get additional details from event page
                const { details, category, fullName } = await scrapeEventDetails(link)
                
                // Parse date and time
                const dateTime = await parseDateAndTime(dateStr, timeStr)
                
                // Parse price
                const cost = await parsePriceString(priceStr)

                // Create event object with required fields and default values
                const event: Event = {
                    id: "", // This will be assigned when saved to the database
                    name: fullName || previewName,
                    location,
                    link,
                    image,
                    startDate: dateTime.startDate,
                    endDate: dateTime.endDate,
                    times: dateTime.times,
                    category,
                    city: "seattle",
                    clicks: 0,
                    cost,
                    details,
                    format: "in-person",
                    gmaps: "",
                    neighborhood: "",
                    attendanceSummary: {
                        yesCount: 0,
                        maybeCount: 0,
                        noCount: 0
                    },
                    eventDurationType: dateTime.eventDurationType,
                    status: "pending"
                }
                
                // Add the event to the pending-events collection
                const pendingEventsRef = collection(db, "pending-events")
                const docRef = await addDoc(pendingEventsRef, event)
                event.id = docRef.id
                
                newEvents.push(event)
            }
        }
        
        return newEvents
    } catch (error) {
        console.error("Error scraping events:", error)
        throw error
    }
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    // Verify the request is from Vercel Cron
    const authHeader = req.headers.authorization
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ success: false, message: "Unauthorized" })
    }

    try {
        const newEvents = await scrapeEvents()
        return res.status(200).json({ 
            success: true, 
            message: `Successfully scraped ${newEvents.length} new events`,
            events: newEvents 
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