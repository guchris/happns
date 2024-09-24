import { db } from "@/lib/firebase"
import { collection, getCountFromServer, query, where } from "firebase/firestore"

export async function getTotalUpcomingEvents(citySlug: string): Promise<number> {
    const today = new Date().toISOString();

    const eventsQuery = query(
        collection(db, "events"),
        where("city", "==", citySlug),
        where("startDate", ">=", today)
    );

    const countSnapshot = await getCountFromServer(eventsQuery);
    return countSnapshot.data().count;
}