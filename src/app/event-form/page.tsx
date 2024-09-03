"use client"

import Link from "next/link";
import { v4 as uuidv4 } from "uuid";

import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { addDoc, collection } from "firebase/firestore";
import { db } from "@/app/firebase";

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form";
import { z } from "zod"

import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

import { CalendarIcon } from "@radix-ui/react-icons"

const eventFormSchema = z.object({
    category: z.string(),
    cost: z
        .number({
            required_error: "Cost is required.",
            invalid_type_error: "Cost must be a number.",
        })
        .nonnegative({
            message: "Cost must be a non-negative number.",
        }),
    description: z
        .string()
        .min(4, {
            message: "Description must be at least 4 characters.",
        })
        .max(320, {
            message: "Description must not be longer than 320 characters.",
        }),
    details: z
        .string()
        .min(4, {
            message: "Details must be at least 4 characters.",
        })
        .max(10000, {
            message: "Details must not be longer than 10,000 characters.",
        }),
    endDate: z.date({
        required_error: "An end date is required.",
    }),
    endTime: z
        .string()
        .regex(/^(0[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i, {
            message: "End time must be in HH:mm AM/PM format.",
        }),
    format: z.enum(["in-person", "online", "hybrid"], {
        required_error: "Please select a format.",
    }),
    gmaps: z
        .string()
        .url({
            message: "Please enter a valid Google Maps URL.",
        }),
    image: z.any({
        required_error: "An image is required.",
    }),
    link: z
        .string()
        .url({
            message: "Please enter a valid URL.",
        }),
    location: z
        .string()
        .min(2, {
            message: "Location must be at least 2 characters.",
        })
        .max(100, {
            message: "Location must not be longer than 100 characters.",
        }),
    name: z
        .string()
        .min(2, {
            message: "Name must be at least 2 characters.",
        })
        .max(50, {
            message: "Name must not be longer than 50 characters.",
        }),
    neighborhood: z.enum([
        "ballard",
        "beacon-hill",
        "capitol-hill",
        "fremont",
        "queen-anne",
        "seattle",
        "tukwila",
        "wallingford",
        "west-seattle",
    ], {
        required_error: "Please select a neighborhood.",
    }),
    startDate: z.date({
        required_error: "A start date is required.",
    }),
    startTime: z
        .string()
        .regex(/^(0[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i, {
            message: "Start time must be in HH:mm AM/PM format.",
        })
});

type EventFormValues = z.infer<typeof eventFormSchema>

export default function EventForm() {
    const form = useForm<EventFormValues>({
        resolver: zodResolver(eventFormSchema),
        mode: "onChange",
    })

    function onSubmit(data: EventFormValues) {
        console.log("Form submitted with data:", data);

        const storage = getStorage();
        const eventsCollectionRef = collection(db, "events");

        const startDate = data.startDate;
        const endDate = data.endDate;
        const startTime = data.startTime;
        const endTime = data.endTime;

        // Format the dates as MM/dd/yyyy
        const formattedStartDate = format(startDate, "MM/dd/yyyy");
        const formattedEndDate = format(endDate, "MM/dd/yyyy");

        // Construct the date field
        const date = formattedStartDate === formattedEndDate
            ? formattedStartDate
            : `${formattedStartDate} - ${formattedEndDate}`;

        const time = startTime === endTime
            ? startTime
            : `${startTime} - ${endTime}`;

        const uploadImage = async () => {
            if (data.image) {
                const uuid = uuidv4();
                const storageRef = ref(storage, `event_images/${uuid}`);
                const uploadTask = uploadBytesResumable(storageRef, data.image);
    
                return new Promise<string>((resolve, reject) => {
                    uploadTask.on(
                        "state_changed",
                        () => {}, // You can track progress here if needed
                        (error) => {
                            console.error("Upload failed:", error);
                            reject(error);
                        },
                        async () => {
                            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                            resolve(downloadURL);
                        }
                    );
                });
            } else {
                return null;
            }
        };

        uploadImage().then((imageUrl) => {
            const eventData = {
                category: data.category,
                cost: data.cost,
                description: data.description,
                details: data.details,
                date,
                time,
                format: data.format,
                gmaps: data.gmaps,
                image: imageUrl,
                link: data.link,
                location: data.location,
                name: data.name,
                neighborhood: data.neighborhood,
            };
    
            addDoc(eventsCollectionRef, eventData)
                .then(() => {
                    console.log("Event added to Firestore:", eventData);
                })
                .catch((error) => {
                    console.error("Error adding event to Firestore:", error);
                });
            }).catch((error) => {
                console.error("Error uploading image:", error);
            });
        }
    
    return (
        <>
            <div className="flex h-full flex-col">
                <div className="w-full flex items-center justify-between py-4 px-4 h-14">
                    <h2 className="text-lg font-semibold">
                        <Link href="/">happns</Link>
                        /add-event
                    </h2>
                </div>
                <Separator />
            </div>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col px-4 py-2 space-y-8">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <FormDescription>
                                    This is the name of the event.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="Enter a description" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="details"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Details</FormLabel>
                                <FormControl>
                                    <Textarea {...field} placeholder="Enter the details" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Category</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a category" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="arts">Arts</SelectItem>
                                        <SelectItem value="music">Music</SelectItem>
                                        <SelectItem value="food-drink">Food & Drink</SelectItem>
                                        <SelectItem value="sports-fitness">Sports & Fitness</SelectItem>
                                        <SelectItem value="family">Family</SelectItem>
                                        <SelectItem value="professional">Professional</SelectItem>
                                        <SelectItem value="technology">Technology</SelectItem>
                                        <SelectItem value="education">Education</SelectItem>
                                        <SelectItem value="wellness">Wellness</SelectItem>
                                        <SelectItem value="charity">Charity</SelectItem>
                                        <SelectItem value="culture">Culture</SelectItem>
                                        <SelectItem value="holiday-seasonal">Holiday & Seasonal</SelectItem>
                                        <SelectItem value="nightlife">Nightlife</SelectItem>
                                        <SelectItem value="fashion-beauty">Fashion & Beauty</SelectItem>
                                        <SelectItem value="environment">Environment</SelectItem>
                                        <SelectItem value="religion">Religion</SelectItem>
                                        <SelectItem value="politics">Politics</SelectItem>
                                        <SelectItem value="travel">Travel</SelectItem>
                                        <SelectItem value="gaming">Gaming</SelectItem>
                                        <SelectItem value="crafts">Crafts</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="format"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Event Format</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a format" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="in-person">In-Person</SelectItem>
                                        <SelectItem value="online">Online</SelectItem>
                                        <SelectItem value="hybrid">Hybrid</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="grid grid-cols-2 gap-4 w-full">
                        <FormField
                            control={form.control}
                            name="startDate"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Start Date</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "pl-3 text-left font-normal",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                >
                                                    {field.value ? (
                                                        format(field.value, "PPP")
                                                    ) : (
                                                        <span>Pick a start date</span>
                                                    )}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="endDate"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>End Date</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "pl-3 text-left font-normal",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                >
                                                    {field.value ? (
                                                        format(field.value, "PPP")
                                                    ) : (
                                                        <span>Pick an end date</span>
                                                    )}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4 w-full">
                        <FormField
                            control={form.control}
                            name="startTime"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Start Time</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="text"
                                            {...field}
                                            placeholder="Enter start time"
                                            pattern="(0[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)"
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        HH:mm AM/PM
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="endTime"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>End Time</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="text"
                                            {...field}
                                            placeholder="Enter end time (HH:mm AM/PM)"
                                            pattern="(0[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)"
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        HH:mm AM/PM
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <FormField
                        control={form.control}
                        name="cost"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Cost</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        {...field}
                                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                        placeholder="Enter the cost"
                                    />
                                </FormControl>
                                <FormDescription>
                                    This is the cost of attending the event (in USD).
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Location</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="Enter the location name" />
                                </FormControl>
                                <FormDescription>
                                    This is the name of the location where the event will take place.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="gmaps"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Google Maps Link</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="https://maps.app.goo.gl/abc" />
                                </FormControl>
                                <FormDescription>
                                    This is the Google Maps link to the event location.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="neighborhood"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Neighborhood</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a neighborhood" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="capitol-hill">Capitol Hill</SelectItem>
                                        <SelectItem value="ballard">Ballard</SelectItem>
                                        <SelectItem value="beacon-hill">Beacon Hill</SelectItem>
                                        <SelectItem value="fremont">Fremont</SelectItem>
                                        <SelectItem value="queen-anne">Queen Anne</SelectItem>
                                        <SelectItem value="seattle">Seattle</SelectItem>
                                        <SelectItem value="tukwila">Tukwila</SelectItem>
                                        <SelectItem value="wallingford">Wallingford</SelectItem>
                                        <SelectItem value="west-seattle">West Seattle</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="link"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Event Link</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="https://example.com" />
                                </FormControl>
                                <FormDescription>
                                    This is the URL link to the event.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="image"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Event Image / Flyer</FormLabel>
                                <FormControl>
                                    <Input type="file" accept="image/*" onChange={(e) => field.onChange(e.target.files?.[0])} />
                                </FormControl>
                                <FormDescription>
                                    Upload an image for the event (JPG, PNG, etc.).
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit">Submit</Button>
                </form>
            </Form>
        </>
    );
}
