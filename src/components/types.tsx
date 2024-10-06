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
    time: string;
}

export interface User {
    uid: string;
    name: string;
    username: string;
    email: string;
    createdAt: Date;
    profilePicture?: string;
    role: "general" | "curator";
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
}

export interface City {
    name: string;
    slug: string;
    lat: number;
    lon: number;
    description: string;
    upcomingEventCount: number;
}

export interface CarouselEvent {
    uid: string;
    image: string;
}