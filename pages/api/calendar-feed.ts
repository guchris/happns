// Next Imports
import { NextApiRequest, NextApiResponse } from 'next'

// Firebase Imports
import { getFirestore } from 'firebase-admin/firestore'
import { initializeApp, getApps, cert } from 'firebase-admin/app'

// Other Imports
import ical from 'ical-generator'
import { parse, isValid } from 'date-fns';

// Service account credentials (You need to add these credentials)
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY!);

if (!getApps().length) {
    initializeApp({
        credential: cert(serviceAccount),
        databaseURL: "https://happns-default-rtdb.firebaseio.com"
    });
}

const db = getFirestore()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const userId = req.query.userId as string;

    if (!userId) {
        return res.status(400).json({ error: 'Missing user ID' });
    }

    // Fetch user's bookmarked events from Firestore
    const bookmarksRef = db.collection('users').doc(userId).collection('user-bookmarks');
    const snapshot = await bookmarksRef.get();

    if (snapshot.empty) {
        return res.status(404).json({ error: 'No events found for user' });
    }

    console.log(`Found ${snapshot.size} events for user: ${userId}`);

    // Collect event IDs from bookmarks
    const eventIds: string[] = [];
    snapshot.forEach(doc => {
        eventIds.push(doc.id);
    });

    // Fetch the actual event data from the "events" collection
    const eventsRef = db.collection('events');
    const eventsData = await Promise.all(eventIds.map(async (eventId) => {
        const eventDoc = await eventsRef.doc(eventId).get();
        return eventDoc.exists ? eventDoc.data() : null;
    }));

    // Filter out any null (non-existent) events
    const validEvents = eventsData.filter(event => event !== null);
    
    if (validEvents.length === 0) {
        return res.status(404).json({ error: 'No valid events found for user' });
    }

    // Create an iCal feed
    const calendar = ical({ name: "happns" });

    // Loop over valid events
    validEvents.forEach(event => {
        // TypeScript safeguard: Ensure the event is not null
        if (!event) {
            return;  // Skip if event is null or undefined
        }

        console.log("Event Data:", event);

        let eventStart, eventEnd;

        // Ensure date exists and split it
        if (!event.date) {
            console.error("Missing date for event:", event);
            return;  // Skip this event if the date is missing
        }

        // Safely split the date field
        const dateParts = event.date ? event.date.split(" - ") : [];

        if (dateParts.length === 2) {
            // It's a date range (e.g., "MM/dd/yyyy - MM/dd/yyyy")
            eventStart = parse(dateParts[0], "MM/dd/yyyy", new Date());
            eventEnd = parse(dateParts[1], "MM/dd/yyyy", new Date());
        } else if (dateParts.length === 1) {
            // It's a single date (e.g., "MM/dd/yyyy")
            eventStart = parse(event.date, "MM/dd/yyyy", new Date());
            eventEnd = new Date(eventStart.getTime() + 60 * 60 * 1000);  // Default to 1 hour after start
        } else {
            console.error("Invalid date format for event:", event);
            return;  // Skip this event if the date format is invalid
        }

        // Parse event time (since time field always exists)
        const timeParts = event.time.split(" - ");
        if (timeParts.length === 2) {
            const [startTime, endTime] = timeParts;
            const startTimeDate = parse(startTime, "hh:mm a", eventStart);
            const endTimeDate = parse(endTime, "hh:mm a", eventEnd);
            
            // Overwrite eventStart and eventEnd if valid times are provided
            if (isValid(startTimeDate)) eventStart = startTimeDate;
            if (isValid(endTimeDate)) eventEnd = endTimeDate;
        }

        // Create an iCal event
        calendar.createEvent({
            start: eventStart,
            end: eventEnd,
            summary: event.name || "No Title",
            description: `${event.description || "No Description"}`,
            location: event.location || "Location not specified",
            url: event.link,
            timezone: 'America/Los_Angeles'
        });
    });

    // Set headers for iCal file download
    res.setHeader('Content-Type', 'text/calendar');
    res.setHeader('Content-Disposition', 'attachment; filename="events.ics"');

    // Send the iCal content
    res.send(calendar.toString());
}