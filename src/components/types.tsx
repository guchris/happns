export interface Event {
    category: string[];
    city: string;
    clicks: number;
    cost: {
        type: "single" | "range" | "minimum";
        value: number | [number, number]
    };
    date: string;
    details: string;
    format: string;
    gmaps: string;
    id: string;
    image: string;
    link: string;
    location: string;
    name: string;
    neighborhood: string;
    time: string;
}

export interface User {
    uid: string;
    name: string;
    username: string;
    email: string;
    createdAt: Date;
    role: "general" | "curator";
}

export interface Comment {
    id: string;
    username: string;
    content: string;
    timestamp: any;
}