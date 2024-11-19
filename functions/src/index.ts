/*
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

// Initialize Firebase admin
admin.initializeApp();
const db = admin.firestore();
*/

/**
 * Scheduled function to send a test notification to all users every hour.
 */
/*
export const sendTestNotificationsScheduled = functions.pubsub
  .schedule("every hour")
  .onRun(async () => {
    const now = admin.firestore.Timestamp.now();

    try {
      const usersSnapshot = await db.collection("users").get();

      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const testNotification = {
          message: "This is a test notification.",
          date: now,
          link: "/notifications",
          isRead: false,
        };

        await db
          .collection("users")
          .doc(userId)
          .collection("notifications")
          .add(testNotification);
      }

      console.log("Test notifications sent successfully.");
    } catch (error) {
      console.error("Error sending test notifications:", error);
    }
  });
*/

/**
 * Scheduled function to send event reminders to all users for events marked
 * as "yes" or "maybe" happening within the next 24 hours.
 */
/*
export const sendEventRemindersScheduled = functions.pubsub
  .schedule("every 24 hours")
  .onRun(async () => {
    const now = admin.firestore.Timestamp.now();
    const oneDayFromNow = admin.firestore.Timestamp.fromDate(
      new Date(now.toDate().getTime() + 24 * 60 * 60 * 1000)
    );

    try {
      // Fetch all users
      const usersSnapshot = await db.collection("users").get();
      if (usersSnapshot.empty) {
        console.log("No users found.");
        return null;
      }

      // Iterate through each user
      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;

        // Query "yes" or "maybe" events within the next 24 hours
        const eventsRef = db
          .collection("users")
          .doc(userId)
          .collection("user-events");
        const eventsQuery = eventsRef
          .where("attendanceStatus", "in", ["yes", "maybe"])
          .where("eventDate", ">=", now)
          .where("eventDate", "<=", oneDayFromNow);

        const eventsSnapshot = await eventsQuery.get();
        if (eventsSnapshot.empty) {
          console.log(`No upcoming events for user: ${userId}`);
          continue;
        }

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

        // Add all reminders to the user's notifications collection
        const notificationsRef = db
          .collection("users")
          .doc(userId)
          .collection("notifications");

        for (const reminder of reminders) {
          await notificationsRef.add(reminder);
        }
      }

      console.log("Event reminders sent successfully.");
      return null;
    } catch (error) {
      console.error("Error sending event reminders:", error);
      return null;
    }
  });
*/
