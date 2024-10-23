// Next Imports
import { NextApiRequest, NextApiResponse } from 'next'

// Firebase Imports
import { getFirestore } from 'firebase-admin/firestore'
import { initializeApp, getApps, cert } from 'firebase-admin/app'

// Other Imports
import ical from 'ical-generator'
import { parseISO, parse, isValid } from 'date-fns';

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

        // Ensure the event is not null and has required fields
        if (!event || !event.startDate || !event.endDate || !event.times || !event.times[0]) {
            console.error("Missing startDate, endDate, or times for event:", event);
            return;  // Skip this event if any of the required fields are missing
        }

        // Parse startDate and endDate
        const eventStartDate = parseISO(event.startDate);
        const eventEndDate = parseISO(event.endDate);

        // Check if the parsed dates are valid
        if (!isValid(eventStartDate) || !isValid(eventEndDate)) {
            console.error("Invalid date format for event:", event);
            return;  // Skip this event if the date format is invalid
        }

        // Parse time
        const firstTimeEntry = event.times[0];
        const eventStart = parse(`${event.startDate} ${firstTimeEntry.startTime}`, "yyyy-MM-dd h:mm a", new Date());
        const eventEnd = parse(`${event.endDate} ${firstTimeEntry.endTime}`, "yyyy-MM-dd h:mm a", new Date());

        // Check if the parsed times are valid
        if (!isValid(eventStart) || !isValid(eventEnd)) {
            console.error("Invalid time format for event:", event);
            return; // Skip if the time format is invalid
        }

        // Create an iCal event
        calendar.createEvent({
            start: eventStart,
            end: eventEnd,
            summary: event.name || "No Title",
            description: `view this event on happns: https://ithappns.com/event/${event.id}\n\n${event.details || "no details"}`,
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