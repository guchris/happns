// App Imports
import { Event } from "@/components/types"

// Firebase Imports
import { db } from "@/lib/firebase"
import { doc, setDoc, runTransaction, increment, DocumentData, QueryDocumentSnapshot, collection, getCountFromServer, query, where, getDocs } from "firebase/firestore"
import { DocumentSnapshot } from "firebase-admin/firestore"


// Other Imports
import { format, parse, isAfter, isEqual, isSameDay, isSameMonth, addDays, parseISO } from "date-fns"

/**
 * Maps Firestore document data to an Event type.
 * @param doc - The Firestore document snapshot.
 * @returns {Event} - The mapped event object.
 */
export function mapFirestoreEvents(doc: QueryDocumentSnapshot<DocumentData>): Event {
    return {
        id: doc.id,
        category: doc.data().category,
        city: doc.data().city,
        clicks: doc.data().clicks,
        cost: doc.data().cost,
        details: doc.data().details,
        endDate: doc.data().endDate,
        gmaps: doc.data().gmaps,
        image: doc.data().image,
        link: doc.data().link,
        location: doc.data().location,
        name: doc.data().name,
        startDate: doc.data().startDate,
        times: doc.data().times,
        eventDurationType: doc.data().eventDurationType,
        attendanceSummary: {
            yesCount: doc.data().attendanceSummary?.yesCount || 0,
            maybeCount: doc.data().attendanceSummary?.maybeCount || 0,
            noCount: doc.data().attendanceSummary?.noCount || 0,
        }
    };
}
export function mapFirestoreEvent(doc: DocumentSnapshot): Event {
    return {
        id: doc.id,
        category: doc.data()?.category,
        city: doc.data()?.city,
        clicks: doc.data()?.clicks,
        cost: doc.data()?.cost,
        details: doc.data()?.details,
        endDate: doc.data()?.endDate,
        gmaps: doc.data()?.gmaps,
        image: doc.data()?.image,
        link: doc.data()?.link,
        location: doc.data()?.location,
        name: doc.data()?.name,
        startDate: doc.data()?.startDate,
        times: doc.data()?.times,
        eventDurationType: doc.data()?.eventDurationType,
        attendanceSummary: {
            yesCount: doc.data()?.attendanceSummary?.yesCount || 0,
            maybeCount: doc.data()?.attendanceSummary?.maybeCount || 0,
            noCount: doc.data()?.attendanceSummary?.noCount || 0,
        }
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

    const events: Event[] = eventSnapshot.docs.map(mapFirestoreEvents);
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
 * Filters events to include only those that haven't passed yet or are happening today.
 * @param events - Array of Event objects.
 * @param today - The current date.
 * @returns {Event[]} - Array of future events.
 */
export function getFutureEvents(events: Event[], today: Date): Event[] {
    const todayStr = today.toISOString().split('T')[0]; // Only the date portion

    return events.filter((event) => {
        const startDateStr = parseISO(event.startDate).toISOString().split('T')[0];
        const endDateStr = parseISO(event.endDate).toISOString().split('T')[0];

        // Include events that start on or after today, or events that span over today
        return endDateStr >= todayStr && (startDateStr <= todayStr || startDateStr >= todayStr);
    });
}


/**
 * Sorts events from earliest to latest based on startDate.
 * @param events - Array of Event objects.
 * @returns {Event[]} - Array of sorted events.
 */
export function sortEventsByDate(events: Event[]): Event[] {
    return events.sort((a, b) => {
        return parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime();
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
        where("endDate", ">=", today)
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
 * Converts a 24-hour (military) time string (e.g., '06:20', '14:05') to 'h:mm AM/PM' format (e.g., '6:20 AM', '2:05 PM').
 * Removes any prefixed zero from the hour.
 * @param time24 - The 24-hour time string.
 * @returns {string} - The formatted time string.
 */
export function formatEventTime(time24: string): string {
    if (!/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(time24)) return time24;
    const [hourStr, minute] = time24.split(":");
    let hour = parseInt(hourStr, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12;
    if (hour === 0) hour = 12;
    return `${hour}:${minute} ${ampm}`;
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


/**
 * Retrieves today's and tomorrow's date in yyyy-mm-dd format.
 * @returns {object} - An object with today's and tomorrow's date as strings in yyyy-mm-dd format.
 */
export const getTodayAndTomorrow = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // Use toLocaleDateString to avoid timezone issues
    const todayStr = today.toLocaleDateString('en-CA');
    const tomorrowStr = tomorrow.toLocaleDateString('en-CA');

    return { todayStr, tomorrowStr };
};


/**
 * Calculates the upcoming weekend days based on the current day.
 * Determines which days (Friday, Saturday, Sunday) are the upcoming weekend days
 * and returns them as strings in yyyy-mm-dd format.
 * @returns {string[]} - An array of strings representing the weekend days in yyyy-mm-dd format.
 */
export const getWeekendDays = () => {
    const today = new Date();
    const weekendDays: string[] = [];
    const dayOfWeek = today.getDay(); // 0 (Sunday) to 6 (Saturday)

    let friday, saturday, sunday;

    if (dayOfWeek <= 4) { // Monday to Thursday
        friday = new Date(today);
        friday.setDate(today.getDate() + (5 - dayOfWeek)); // Get upcoming Friday
        saturday = new Date(friday);
        saturday.setDate(friday.getDate() + 1); // Saturday
        sunday = new Date(friday);
        sunday.setDate(friday.getDate() + 2); // Sunday
    } else if (dayOfWeek === 5) { // Friday
        friday = today;
        saturday = new Date(today);
        saturday.setDate(today.getDate() + 1); // Saturday
        sunday = new Date(today);
        sunday.setDate(today.getDate() + 2); // Sunday
    } else if (dayOfWeek === 6) { // Saturday
        saturday = today;
        sunday = new Date(today);
        sunday.setDate(today.getDate() + 1); // Sunday
    } else if (dayOfWeek === 0) { // Sunday
        sunday = today;
    }

    if (friday) weekendDays.push(friday.toLocaleDateString('en-CA')); // Push Friday
    if (saturday) weekendDays.push(saturday.toLocaleDateString('en-CA')); // Push Saturday
    if (sunday) weekendDays.push(sunday.toLocaleDateString('en-CA')); // Push Sunday

    return weekendDays;
};



/**
 * Determines which tabs an event should appear in based on its start and end dates.
 * Checks if an event falls under "Today," "Tomorrow," or "This Weekend" based on 
 * its start and end dates compared with specified dates.
 * 
 * @param {Event} event - The event to be checked.
 * @param {string} todayStr - Today's date in yyyy-mm-dd format.
 * @param {string} tomorrowStr - Tomorrow's date in yyyy-mm-dd format.
 * @param {string[]} weekendDays - Array of weekend dates (Friday, Saturday, Sunday) in yyyy-mm-dd format.
 * @returns {object} - An object indicating which tabs the event appears in: { isToday, isTomorrow, isThisWeekend }.
 */
export const getEventTabs = ( event: Event, todayStr: string, tomorrowStr: string, weekendDays: string[] ) => {
    const eventStart = event.startDate;
    const eventEnd = event.endDate;

    // Today: Event includes today
    const isToday = eventStart <= todayStr && eventEnd >= todayStr;

    // Tomorrow: Event includes tomorrow
    const isTomorrow = eventStart <= tomorrowStr && eventEnd >= tomorrowStr;

    // This Weekend: Event includes any day of the weekend
    const isThisWeekend = weekendDays.some((weekendDay) => 
        eventStart <= weekendDay && eventEnd >= weekendDay
    );

    return { isToday, isTomorrow, isThisWeekend };
};



/**
 * Sorts events first by start date and then alphabetically by name for events with the same date.
 * @param events - Array of Event objects.
 * @returns {Event[]} - Array of sorted events.
 */
export function sortEventsByDateAndName(events: Event[]): Event[] {
    return events.sort((a, b) => {
        const dateA = new Date(a.startDate);
        const dateB = new Date(b.startDate);

        // First, sort by startDate
        if (dateA < dateB) return -1;
        if (dateA > dateB) return 1;

        // If startDate is the same, sort by name alphabetically
        return a.name.localeCompare(b.name);
    });
}



/**
 * Sorts events first by eventDurationType, then by start date, and finally alphabetically by name for events with the same date.
 * @param events - Array of Event objects.
 * @returns {Event[]} - Array of sorted events.
 */
export function sortEventsByTypeAndDateAndName(events: Event[]): Event[] {
    return events.sort((a, b) => {
        const durationOrder = ["single", "multi", "extended"];
        const durationA = durationOrder.indexOf(a.eventDurationType);
        const durationB = durationOrder.indexOf(b.eventDurationType);

        // First, sort by eventDurationType
        if (durationA !== durationB) {
            return durationA - durationB;
        }

        const dateA = new Date(a.startDate);
        const dateB = new Date(b.startDate);

        // Then, sort by startDate
        if (dateA < dateB) return -1;
        if (dateA > dateB) return 1;

        // Finally, sort by name alphabetically if startDate is the same
        return a.name.localeCompare(b.name);
    });
}



/**
 * Updates the attendance status for a user on a specific event.
 * Adjusts the attendance summary counts in the event document accordingly,
 * and records the attendance in the user's "user-attendance" sub-collection.
 * 
 * @param eventId - The ID of the event.
 * @param userId - The ID of the user.
 * @param status - The attendance status ("yes", "maybe", "no") or null if unselecting.
 */
export async function updateAttendance(eventId: string, userId: string, status: "yes" | "maybe" | "no" | null) {
    const eventRef = doc(db, "events", eventId);
    const attendanceDocRef = doc(db, "events", eventId, "attendances", userId);
    const userAttendanceDocRef = doc(db, "users", userId, "user-attendance", eventId);

    try {
        await runTransaction(db, async (transaction) => {
            const attendanceDoc = await transaction.get(attendanceDocRef);
            const currentStatus = attendanceDoc.exists() ? attendanceDoc.data().status : null;

            // Handle deselecting the current option (status is null)
            if (status === null) {
                // Remove attendance record from the event's attendances sub-collection
                transaction.delete(attendanceDocRef);

                // Decrement the count for the previously selected status
                if (currentStatus) {
                    transaction.update(eventRef, {
                        [`attendanceSummary.${currentStatus}Count`]: increment(-1),
                    });
                }

                // Remove attendance record from the user's user-attendance sub-collection
                transaction.delete(userAttendanceDocRef);
            } else {
                // Update the attendance document in the event's attendances sub-collection
                transaction.set(attendanceDocRef, { status, userId, timestamp: new Date() });

                // Update the summary counts in the event document if the status has changed
                if (currentStatus !== status) {
                    if (currentStatus) {
                        transaction.update(eventRef, {
                            [`attendanceSummary.${currentStatus}Count`]: increment(-1),
                        });
                    }
                    transaction.update(eventRef, {
                        [`attendanceSummary.${status}Count`]: increment(1),
                    });
                }

                // Record the user's attendance in their user-attendance sub-collection
                transaction.set(userAttendanceDocRef, {
                    eventId,
                    status,
                    timestamp: new Date(),
                });
            }
        });

        console.log("Attendance updated successfully.");
    } catch (error) {
        console.error("Error updating attendance: ", error);
    }
}