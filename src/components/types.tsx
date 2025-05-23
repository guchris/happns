import { Timestamp } from "firebase/firestore"

export interface Event {
    category: string[];
    city: string;
    clicks: number;
    cost: {
        type: "single" | "range" | "minimum";
        value: number | [number, number]
    };
    details: string;
    endDate: string;
    gmaps: string;
    id: string;
    image: string;
    link: string;
    location: string;
    name: string;
    startDate: string;
    times: {
        /** Military time, 24-hour format, e.g. "13:45" */
        startTime: string;
        /** Military time, 24-hour format, e.g. "21:30" */
        endTime: string;
    }[];
    attendanceSummary: {
        yesCount: number;
        maybeCount: number;
        noCount: number;
    };
    eventDurationType: "single" | "multi" | "extended";
    status?: "pending" | "approved" | "rejected";
}

export interface User {
    uid: string;
    name: string;
    username: string;
    email: string;
    createdAt: Date;
    profilePicture?: string;
    role: "general" | "curator";
    selectedCity?: string;
    instagram?: string;
    notifications: {
        communication_emails: boolean;
        roundup_emails: boolean;
        marketing_emails: boolean;
    };
}

export type Curator = {
    name: string;
    username: string;
    profilePicture: string;
}

export interface Comment {
    id: string;
    username: string;
    content: string;
    timestamp: any;
    profilePicture?: string;
}

export interface City {
    id: string;
    name: string;
    slug: string;
    lat: number;
    lon: number;
    slogan: string;
    description: string;
    upcomingEventCount?: number;
}

export interface CarouselEvent {
    uid: string;
    image: string;
}

export interface Attendance {
    userId: string;
    eventId: string;
    status: "yes" | "maybe" | "not";
    timestamp: Date;
}

export interface Notification {
    id: string;
    type: string;
    message: string;
    date: Timestamp | Date;
    link: string;
    isRead: boolean;
}