import * as admin from "firebase-admin";
import {onSchedule} from "firebase-functions/v2/scheduler";

// Initialize Firebase admin
admin.initializeApp();
const db = admin.firestore();

/**
 * Scheduled function to send event reminders to all users for events marked
 * as "yes" or "maybe" happening within the next 24 hours.
 */
export const sendEventRemindersScheduled = onSchedule(
  "every 24 hours",
  async () => {
    const now = admin.firestore.Timestamp.now();
    const oneDayFromNow = admin.firestore.Timestamp.fromDate(
      new Date(now.toDate().getTime() + 24 * 60 * 60 * 1000)
    );

    try {
      // Fetch all users
      const usersSnapshot = await db.collection("users").get();

      // Process each user for reminders
      usersSnapshot.forEach(async (userDoc) => {
        const userId = userDoc.id;

        // Query events marked as "yes" or "maybe" for this user
        // happening within the next 24 hours
        const eventsRef = db
          .collection("users")
          .doc(userId)
          .collection("user-events");
        const eventsQuery = eventsRef
          .where("attendanceStatus", "in", ["yes", "maybe"])
          .where("eventDate", ">=", now)
          .where("eventDate", "<=", oneDayFromNow);

        const eventsSnapshot = await eventsQuery.get();

        // Prepare reminders for each event
        const reminders = eventsSnapshot.docs.map((eventDoc) => {
          const eventData = eventDoc.data();
          return {
            message: `Reminder: "${eventData.eventName}" is happening soon!`,
            date: now,
            link: `/events/${eventDoc.id}`,
            isRead: false,
          };
        });

        // Add each reminder as a notification for the user
        const notificationsRef = db
          .collection("users")
          .doc(userId)
          .collection("notifications");
        for (const reminder of reminders) {
          await notificationsRef.add(reminder);
        }
      });
      console.log("Event reminders sent successfully.");
    } catch (error) {
      console.error("Error sending event reminders:", error);
    }
  }
);
