"use client"

// React Imports
import { useState, useEffect } from "react"

// App Imports
import { Event } from "@/components/types"
import { useAuth } from "@/context/AuthContext"
import { updateAttendance } from "@/lib/eventUtils"

// Firebase Imports
import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"

// Shadcn Imports
import { Button } from "@/components/ui/button"


interface EventAttendanceActionsProps {
    event: Event | null;
}

const EventAttendanceActions = ({ event }: EventAttendanceActionsProps) => {

    const { user } = useAuth();
    const [attendanceStatus, setAttendanceStatus] = useState<"yes" | "maybe" | "no" | null>(null);

    useEffect(() => {
        if (user && event) {
            const fetchAttendanceStatus = async () => {
                try {
                    const attendanceRef = doc(db, `events/${event.id}/attendances`, user.uid);
                    const attendanceSnap = await getDoc(attendanceRef);
                    if (attendanceSnap.exists()) {
                        setAttendanceStatus(attendanceSnap.data().status); // Set initial attendance status
                    }
                } catch (error) {
                    console.error("Error fetching attendance status: ", error);
                }
            };
            fetchAttendanceStatus();
        }
    }, [user, event]);

    const handleAttendanceChange = async (status: "yes" | "maybe" | "no") => {
        if (attendanceStatus === status) {
            // If the button is already selected, unselect it by setting to null
            setAttendanceStatus(null); // No attendance selected
            await updateAttendance(event!.id, user!.uid, null); // Pass null to remove attendance in Firestore
        } else {
            // Set the new status if it’s different and update in Firestore
            setAttendanceStatus(status);
            await updateAttendance(event!.id, user!.uid, status);
        }
    };

    return (
        <div className="flex items-center gap-2">
            {/* Attendance Buttons */}
            {user && event && (
                <div className="attendance-buttons flex gap-2 w-[300px]">
                    <Button 
                        variant={attendanceStatus === "yes" ? "default" : "outline"}
                        className="w-full"
                        onClick={() => handleAttendanceChange("yes")}
                    >
                        👍 going
                    </Button>
                    <Button 
                        variant={attendanceStatus === "maybe" ? "default" : "outline"}
                        className="w-full"
                        onClick={() => handleAttendanceChange("maybe")}
                    >
                        🤔 maybe
                    </Button>
                    <Button 
                        variant={attendanceStatus === "no" ? "default" : "outline"}
                        className="w-full"
                        onClick={() => handleAttendanceChange("no")}
                    >
                        👎 not
                    </Button>
                </div>
            )}
        </div>
    );
}

export default EventAttendanceActions;