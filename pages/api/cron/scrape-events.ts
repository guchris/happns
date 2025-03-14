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
}> {
    try {
        const response = await fetch(url, { headers })
        const html = await response.text()
        const $ = cheerio.load(html)

        // Get event name from the detail page
        const name = $("h1.event-title").text().trim()

        // Get location from the detail page - try different selectors
        let location = ""
        const locationSelectors = [
            "div.location-name a",
            "div.venue-name a",
            "div.location a",
            "div.venue a"
        ]
        
        for (const selector of locationSelectors) {
            const text = $(selector).text().trim()
            if (text) {
                location = text
                break
            }
        }

        // Get description from the detail page - try different selectors
        let details = ""
        const detailsSelectors = [
            "div.event-description",
            "div.description",
            "div.event-details",
            "div.details"
        ]
        
        for (const selector of detailsSelectors) {
            const text = $(selector).text().trim()
            if (text) {
                details = text
                break
            }
        }

        return {
            name,
            startDate: "",
            endDate: "",
            times: [],
            location,
            details
        }
    } catch (error) {
        console.error(`Error scraping event details from ${url}:`, error)
        throw error
    }
}

async function scrapeEvents(): Promise<Event[]> {
    try {
        const response = await fetch("https://everout.com/seattle/events/", {
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
        const $ = cheerio.load(html)
        
        // Find all event cards - they are divs with class "event list-item"
        const eventCards = $("div.event.list-item").toArray()

        if (eventCards.length === 0) {
            return []
        }

        try {
            const $card = $(eventCards[0])
            
            // Get link and title from the event-title section
            const $titleLink = $card.find("h2.event-title a")
            const link = $titleLink.attr("href") || ""
            const previewName = $titleLink.text().trim()
            
            // Get category
            const category = [$card.find("a.fw-bold.text-uppercase").text().trim()]
            
            // Get location details
            const locationName = $card.find("div.location-name a").text().trim()
            
            // Get price
            const priceStr = $card.find("ul.event-tags li").first().text().trim()
            
            // Get image
            const image = $card.find("img.img-responsive").attr("src") || ""

            if (!link) {
                return []
            }

            // Get details from the event page
            const eventDetails = await scrapeEventDetails(link)
            
            // Parse the price
            const cost = await parsePriceString(priceStr)

            const event: Event = {
                id: "", // Will be assigned by Firestore
                name: eventDetails.name || previewName,
                link,
                startDate: eventDetails.startDate,
                endDate: eventDetails.endDate,
                times: eventDetails.times,
                location: eventDetails.location || locationName || "Location TBD",
                details: eventDetails.details,
                category,
                city: "seattle",
                clicks: 0,
                cost,
                format: "in-person",
                gmaps: "",
                image,
                neighborhood: "",
                eventDurationType: "single",
                status: "pending",
                attendanceSummary: {
                    yesCount: 0,
                    maybeCount: 0,
                    noCount: 0
                }
            }

            console.log("Event details:", JSON.stringify(event, null, 2))
            return [event]
        } catch (error) {
            console.error("Error processing event:", error)
            return []
        }
    } catch (error) {
        console.error("Error scraping events:", error)
        throw error
    }
}

async function parseDateAndTime(dateStr: string, timeStr: string): Promise<{
    startDate: string;
    endDate: string;
    times: { startTime: string; endTime: string; }[];
    eventDurationType: string;
}> {
    try {
        console.log("Parsing date and time...")
        console.log(`Date string: "${dateStr}"`)
        console.log(`Time string: "${timeStr}"`)

        // Initialize return values
        let startDate = ""
        let endDate = ""
        let times: { startTime: string; endTime: string; }[] = []
        let eventDurationType = "single"

        if (!dateStr) {
            console.log("No date string provided")
            return { startDate, endDate, times, eventDurationType }
        }

        // Handle date parsing
        const dateMatch = dateStr.match(/(\w+ \d{1,2}(?:, \d{4})?)/g)
        if (dateMatch) {
            // Convert date to YYYY-MM-DD format
            const parsedDate = new Date(dateMatch[0])
            if (!isNaN(parsedDate.getTime())) {
                const year = parsedDate.getFullYear()
                const month = String(parsedDate.getMonth() + 1).padStart(2, '0')
                const day = String(parsedDate.getDate()).padStart(2, '0')
                startDate = `${year}-${month}-${day}`
                endDate = startDate
            }
        }

        // Handle time parsing
        if (timeStr) {
            // Extract time using regex
            const timeMatch = timeStr.match(/(\d{1,2}(?::\d{2})?\s*(?:AM|PM))\s*(?:-\s*(\d{1,2}(?::\d{2})?\s*(?:AM|PM)))?/i)
            if (timeMatch) {
                const startTimeStr = timeMatch[1]
                const endTimeStr = timeMatch[2]

                // Parse start time
                const startTimeParts = startTimeStr.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i)
                if (startTimeParts) {
                    let hours = parseInt(startTimeParts[1])
                    const minutes = startTimeParts[2] ? startTimeParts[2] : "00"
                    const period = startTimeParts[3].toUpperCase()

                    // Convert to 12-hour format
                    if (period === "PM" && hours < 12) hours += 12
                    if (period === "AM" && hours === 12) hours = 0

                    const formattedStartTime = `${String(hours).padStart(2, '0')}:${minutes} ${period}`

                    // Parse end time if it exists
                    let formattedEndTime = ""
                    if (endTimeStr) {
                        const endTimeParts = endTimeStr.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i)
                        if (endTimeParts) {
                            let endHours = parseInt(endTimeParts[1])
                            const endMinutes = endTimeParts[2] ? endTimeParts[2] : "00"
                            const endPeriod = endTimeParts[3].toUpperCase()

                            if (endPeriod === "PM" && endHours < 12) endHours += 12
                            if (endPeriod === "AM" && endHours === 12) endHours = 0

                            formattedEndTime = `${String(endHours).padStart(2, '0')}:${endMinutes} ${endPeriod}`
                        }
                    }

                    times.push({
                        startTime: formattedStartTime,
                        endTime: formattedEndTime || formattedStartTime
                    })
                }
            }
        }

        console.log("Parsed date and time:")
        console.log(`Start date: ${startDate}`)
        console.log(`End date: ${endDate}`)
        console.log("Times:", times)

        return {
            startDate,
            endDate,
            times,
            eventDurationType
        }
    } catch (error) {
        console.error("Error parsing date and time:", error)
        return {
            startDate: "",
            endDate: "",
            times: [],
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
        const newEvents = await scrapeEvents()
        const eventsToAdd = []
        
        // Check each event and only add if it doesn't exist
        for (const event of newEvents) {
            const exists = await eventExists(event.link)
            if (!exists) {
                eventsToAdd.push(event)
            }
        }

        if (eventsToAdd.length > 0) {
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