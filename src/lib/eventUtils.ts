// App Imports
import { Event } from "@/components/types"

// Firebase Imports
import { db } from "@/lib/firebase"
import { DocumentData, QueryDocumentSnapshot, collection, getCountFromServer, query, where, getDocs } from "firebase/firestore"

// Other Imports
import { format, parse, isAfter, isSameDay, isSameMonth, addDays, parseISO } from "date-fns"

/**
 * Maps Firestore document data to an Event type.
 * @param doc - The Firestore document snapshot.
 * @returns {Event} - The mapped event object.
 */
export function mapFirestoreEvent(doc: QueryDocumentSnapshot<DocumentData>): Event {
    return {
        id: doc.id,
        category: doc.data().category,
        city: doc.data().city,
        clicks: doc.data().clicks,
        cost: doc.data().cost,
        details: doc.data().details,
        endDate: doc.data().endDate,
        format: doc.data().format,
        gmaps: doc.data().gmaps,
        image: doc.data().image,
        link: doc.data().link,
        location: doc.data().location,
        name: doc.data().name,
        neighborhood: doc.data().neighborhood,
        startDate: doc.data().startDate,
        times: doc.data().times,
    };
}


/**
 * Fetches all events for a specific city from Firestore.
 * Filters events based on the city's slug and maps them into the Event type.
 * @param citySlug - The slug of the city to fetch events for.
 * @returns {Promise<Event[]>} - Array of Event objects for the specified city.
 */
export async function getEventsByCity(citySlug: string): Promise<Event[]> {

    const eventsCol = collection(db, "events");
    const cityQuery = query(eventsCol, where("city", "==", citySlug));
    const eventSnapshot = await getDocs(cityQuery);

    const events: Event[] = eventSnapshot.docs.map(mapFirestoreEvent);
    return events;
}


/**
 * Filters events happening today or later, and within the current month.
 * @param events - Array of Event objects.
 * @param today - Today's date object.
 * @returns {Event[]} - Array of filtered events.
 */
export function getUpcomingEvents(events: Event[], today: Date): Event[] {
    return events.filter((event) => {
        const startDate = parseISO(event.startDate);
        const endDate = parseISO(event.endDate);
        return isAfter(endDate, today) && isSameMonth(startDate, today);
    });
}


/**
 * Filters events happening today.
 * @param events - Array of Event objects.
 * @param today - Today's date object.
 * @returns {Event[]} - Array of events happening today.
 */
export function getEventsHappeningToday(events: Event[], today: Date): Event[] {
    return events.filter((event) => {
        const startDate = parseISO(event.startDate);
        return isSameDay(startDate, today);
    });
}


/**
 * Filters events happening tomorrow.
 * @param events - Array of Event objects.
 * @param today - Today's date object.
 * @returns {Event[]} - Array of events happening tomorrow.
 */
export function getEventsHappeningTomorrow(events: Event[], today: Date): Event[] {
    return events.filter((event) => {
        const startDate = parseISO(event.startDate);
        return isSameDay(startDate, addDays(today, 1));
    });
}


/**
 * Sorts events by clicks in descending order.
 * @param events - Array of Event objects.
 * @param limit - Number of top events to return.
 * @returns {Event[]} - Array of sorted top events.
 */
export function sortEventsByClicks(events: Event[], limit: number = 8): Event[] {
    return events.sort((a, b) => (b.clicks || 0) - (a.clicks || 0)).slice(0, limit);
}


/**
 * Fetches the total number of upcoming events for a specific city.
 * @param citySlug - The slug of the city.
 * @returns {Promise<number>} - Total number of upcoming events.
 */
export async function getTotalUpcomingEvents(citySlug: string): Promise<number> {
    const today = new Date().toISOString().split('T')[0];

    const eventsQuery = query(
        collection(db, "events"),
        where("city", "==", citySlug),
        where("startDate", ">=", today)
    );

    const countSnapshot = await getCountFromServer(eventsQuery);
    return countSnapshot.data().count;
}


/**
 * Formats event start and end dates into a readable string.
 * @param startDateString - The ISO string representing the start date.
 * @param endDateString - The ISO string representing the end date.
 * @returns {string} - The formatted date range or single date.
 */
export function formatEventDate(startDateString: string, endDateString: string) {
    const startDate = parseISO(startDateString);
    const endDate = parseISO(endDateString);

    // Check if the event is a single day event
    if (startDateString === endDateString) {
        return format(startDate, "EEE, MMM d"); // "Sat, Sep 14"
    } else {
        // Format both dates
        const formattedStartDate = format(startDate, "EEE, MMM d"); // "Sat, Sep 14"
        const formattedEndDate = format(endDate, "EEE, MMM d");     // "Sun, Sep 15"
        return `${formattedStartDate} - ${formattedEndDate}`;
    }
}


/**
 * Formats event time.
 * @param timeString - The time string to format.
 * @returns {string} - The formatted time.
 */
export function formatEventTime(timeString: string) {
    if (timeString.includes(" - ")) {
        // Handle time ranges like "09:00 AM - 05:00 PM"
        const [startTime, endTime] = timeString.split(" - ");
        const parsedStartTime = parse(startTime.trim(), "hh:mm a", new Date());
        const parsedEndTime = parse(endTime.trim(), "hh:mm a", new Date());

        // Format the times to remove unnecessary zeros
        const formattedStartTime = format(parsedStartTime, "h:mm a"); // "9:00 AM"
        const formattedEndTime = format(parsedEndTime, "h:mm a");     // "5:00 PM"
        
        return `${formattedStartTime} - ${formattedEndTime}`;
    } else {
        // Handle single time like "09:00 AM"
        const parsedTime = parse(timeString.trim(), "hh:mm a", new Date());
        return format(parsedTime, "h:mm a"); // "9:00 AM"
    }
}


/**
 * Formats event cost.
 * @param cost - The cost object containing type and value.
 * @returns {string} - The formatted cost string.
 */
export function formatEventCost(cost: { type: "single" | "range" | "minimum"; value: number | [number, number] }) {
    switch (cost.type) {
        case "single":
            return `$${cost.value}`;
        case "range":
            if (Array.isArray(cost.value)) {
                return `$${cost.value[0]} - $${cost.value[1]}`;
            }
            return "";
        case "minimum":
            return `$${cost.value}+`;
        default:
            return "N/A";
    }
}