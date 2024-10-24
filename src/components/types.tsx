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
    format: string;
    gmaps: string;
    id: string;
    image: string;
    link: string;
    location: string;
    name: string;
    neighborhood: string;
    startDate: string;
    times: {
        startTime: string;
        endTime: string;
    }[];
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