export interface Event {
    category: string;
    city: string;
    clicks: number;
    cost: number;
    date: string;
    description: string;
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
}