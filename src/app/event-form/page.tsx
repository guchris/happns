"use client"

// Next and React Imports
import { Suspense, useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

// App Imports
import { useAuth } from "@/context/AuthContext"
import { TopBar } from "@/components/top-bar"
import MultiSelect, { Option } from "@/components/multi-select"
import { cn } from "@/lib/utils"
import { cityOptions, categoryOptions, formatOptions, neighborhoodOptions } from "@/lib/selectOptions"
import { useToast } from "@/hooks/use-toast"

// Firebase Imports
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage"
import { doc, setDoc, getDoc, updateDoc, collection } from "firebase/firestore"
import { db } from "@/lib/firebase"

// Zod Imports
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form";
import { z } from "zod"

// Shadcn Imports
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

// Other Imports
import { CalendarIcon, ExclamationTriangleIcon } from "@radix-ui/react-icons"
import { v4 as uuidv4 } from "uuid";

const eventFormSchema = z.object({
    category: z.array(z.string()).min(1, { message: "At least 1 category is required." }).max(3, { message: "You can select up to 3 categories." }),
    city: z.string({
        required_error: "A city is required.",
    }),
    cost: z.object({
        type: z.enum(["single", "range", "minimum"]),
        value: z.union([
            z.number().nonnegative(), // for single value or minimum
            z.tuple([z.number().nonnegative(), z.number().nonnegative()]), // for range
        ]),
    }).default({ type: "single", value: 0 }),
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
    neighborhood: z.string({
        required_error: "A neighborhood is required.",
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
    const router = useRouter();
    const { toast } = useToast();
    const form = useForm<EventFormValues>({
        resolver: zodResolver(eventFormSchema),
        mode: "onChange",
        defaultValues: {
            cost: {
                type: "single",
                value: 0,
            },
            format: "in-person",
        },
    })

    const { user, loading, userData } = useAuth();
    const searchParams = useSearchParams();
    const [eventId, setEventId] = useState<string | null>(null);

    const [selectedCity, setSelectedCity] = useState<string | null>(null);
    const [neighborhoodsForCity, setNeighborhoodsForCity] = useState<Option[]>([]);
    const [clicks, setClicks] = useState(0);

    const hasPermission = !loading && user && userData?.role === "curator";

    useEffect(() => {
        if (searchParams) {
            const id = searchParams.get("id");
            setEventId(id); // Set eventId from searchParams
        }
    }, [searchParams]);

    useEffect(() => {
        if (selectedCity) {
            // Update neighborhoods based on the selected city
            setNeighborhoodsForCity(neighborhoodOptions[selectedCity] || []);
        }
    }, [selectedCity]);

    useEffect(() => {
        if (eventId) {
            // If there's an event ID, load the event data for editing
            const fetchEvent = async () => {
                const eventDoc = await getDoc(doc(db, "events", eventId));
                if (eventDoc.exists()) {
                    const eventData = eventDoc.data();

                    setSelectedCity(eventData.city);
                    setClicks(eventData.clicks || 0);

                    setTimeout(() => {
                        const transformedData = {
                            ...eventData,
                            startDate: new Date(eventData.startDate),
                            endDate: new Date(eventData.endDate),
                            category: eventData.category,
                            image: eventData.image,
                            startTime: eventData.time.split(" - ")[0],
                            endTime: eventData.time.split(" - ")[1],
                        };
                        form.reset(transformedData);
                    }, 50);
                } else {
                    toast({
                        title: "Error",
                        description: "Event not found.",
                        variant: "destructive",
                    });
                    router.push("/");
                }
            };
            fetchEvent();
        }
    }, [eventId]);

    const onSubmit = async (data: EventFormValues) => {
        const storage = getStorage();
        const eventsCollectionRef = doc(db, "events", eventId || uuidv4());
        
        const startDate = data.startDate.toISOString().split('T')[0];
        const endDate = data.endDate.toISOString().split('T')[0];
        const startTime = data.startTime;
        const endTime = data.endTime;
        const time = startTime === endTime
            ? startTime
            : `${startTime} - ${endTime}`;

        const uploadImage = async () => {
            if (data.image && typeof data.image !== "string") {
                const uuid = uuidv4();
                const storageRef = ref(storage, `event_images/${uuid}`);
                const uploadTask = uploadBytesResumable(storageRef, data.image);
    
                return new Promise<string>((resolve, reject) => {
                    uploadTask.on(
                        "state_changed",
                        () => {},
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
            } else if (typeof data.image === "string") {
                return data.image; // Use existing URL if already a string
            } else {
                return null; // If no image provided, return null
            }
        };

        const imageUrl = await uploadImage();

        const eventData = {
            category: data.category,
            city: data.city,
            clicks: clicks,
            cost: data.cost,
            details: data.details,
            startDate,
            endDate,
            time,
            format: data.format,
            gmaps: data.gmaps,
            image: imageUrl,
            link: data.link,
            location: data.location,
            name: data.name,
            neighborhood: data.neighborhood,
        };

        try {
            if (eventId) {
                // If eventId exists, update the existing event
                await updateDoc(eventsCollectionRef, eventData);
                toast({
                    title: "Event Updated",
                    description: data.name,
                });
            } else {
                // If no eventId, create a new event
                await setDoc(eventsCollectionRef, eventData);
                toast({
                    title: "Event Created",
                    description: data.name,
                });
            }
            router.push("/"); // Navigate to the previous or home page after saving
        } catch (error) {
            console.error("Error saving event:", error);
            toast({
                title: "Error",
                description: "Failed to save the event.",
                variant: "destructive",
            });
        }
    }

    // If still checking for login state, show a loading state
    if (loading) {
        return (
            <div className="min-h-screen flex flex-col">
                <TopBar title={`happns/`} />
                <Separator />
                <div className="flex-1 overflow-y-auto p-4">
                    Loading event...
                </div>
            </div>
        )
    }

    // If user is not logged in or does not have "curator" role, show an unauthorized message
    if (!hasPermission) {
        return (
            <div className="min-h-screen flex flex-col">
                <TopBar title={`happns/add-event`} />
                <Separator />
                <div className="px-4">
                    <Alert className="max-w-3xl my-6 mx-auto p-4">
                        <ExclamationTriangleIcon className="h-4 w-4" />
                        <AlertTitle>Not Authorized</AlertTitle>
                        <AlertDescription>
                            You do not have permission to submit an event. Please <Link href="/" className="text-blue-500">return to the homepage</Link>.
                        </AlertDescription>
                    </Alert>
                </div>
            </div>
        );
    }
    
    return (
        <>
            <div className="flex h-full flex-col">
                <TopBar title={`happns/add-event`} />
                <Separator />
            </div>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col px-4 py-2 space-y-8 max-w-[800px] mx-auto">

                    <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>City</FormLabel>
                                <Select
                                    onValueChange={(value) => {
                                        field.onChange(value);
                                        setSelectedCity(value);
                                    }}
                                    value={field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a city" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {cityOptions.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
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
                                <FormControl>
                                    <MultiSelect
                                        options={categoryOptions}
                                        value={categoryOptions.filter(option => (field.value || []).includes(option.value))}
                                        onChange={(selectedOptions: Option[]) => {
                                            field.onChange(selectedOptions.map(option => option.value));
                                        }}
                                        maxSelected={3}
                                    />
                                </FormControl>
                                <FormDescription>
                                    Select up to 3
                                </FormDescription>
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
                                        {formatOptions.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <Separator />
                    
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Event Name</FormLabel>
                                <FormControl>
                                    <Input {...field} />
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
                                    <Textarea {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="cost"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Cost</FormLabel>
                                <FormControl>
                                    <div className="space-y-2">
                                        {/* Cost Type Toggle Group */}
                                        <ToggleGroup
                                            type="single"
                                            value={field.value?.type ?? "single"}
                                            onValueChange={(value) => field.onChange({ ...field.value, type: value })} // Update cost type
                                            className="flex space-x-2 justify-start"
                                        >
                                            <ToggleGroupItem value="single" className="px-4 py-2 text-sm font-medium bg-gray-200 hover:bg-gray-300">
                                                Single Value
                                            </ToggleGroupItem>
                                            <ToggleGroupItem value="range" className="px-4 py-2 text-sm font-medium bg-gray-200 hover:bg-gray-300">
                                                Range
                                            </ToggleGroupItem>
                                            <ToggleGroupItem value="minimum" className="px-4 py-2 text-sm font-medium bg-gray-200 hover:bg-gray-300">
                                                Minimum
                                            </ToggleGroupItem>
                                        </ToggleGroup>

                                        {/* Single Value Input */}
                                        {field.value?.type === "single" && (
                                            <Input
                                                type="number"
                                                placeholder="Enter cost"
                                                value={typeof field.value?.value === 'number' ? field.value.value : 0}
                                                onChange={(e) => field.onChange({ ...field.value, value: parseFloat(e.target.value) })}
                                            />
                                        )}

                                        {/* Range Inputs */}
                                        {field.value?.type === "range" && (
                                            <div className="grid grid-cols-2 gap-4">
                                                <Input
                                                    type="number"
                                                    placeholder="Min cost"
                                                    value={Array.isArray(field.value?.value) ? field.value.value[0] : 0}
                                                    onChange={(e) => {
                                                        // Check if field.value.value is a tuple before updating it
                                                        const currentValue = Array.isArray(field.value.value) ? field.value.value : [0, 0];
                                                        field.onChange({ ...field.value, value: [parseFloat(e.target.value), currentValue[1]] });
                                                    }}
                                                />
                                                <Input
                                                    type="number"
                                                    placeholder="Max cost"
                                                    value={Array.isArray(field.value?.value) ? field.value.value[1] : 0}
                                                    onChange={(e) => {
                                                        // Check if field.value.value is a tuple before updating it
                                                        const currentValue = Array.isArray(field.value.value) ? field.value.value : [0, 0];
                                                        field.onChange({ ...field.value, value: [currentValue[0], parseFloat(e.target.value)] });
                                                    }}
                                                />
                                            </div>
                                        )}

                                        {/* Minimum Value Input */}
                                        {field.value?.type === "minimum" && (
                                            <div className="flex items-center">
                                                <Input
                                                    type="number"
                                                    placeholder="Min cost"
                                                    value={typeof field.value?.value === 'number' ? field.value.value : 0}
                                                    onChange={(e) => field.onChange({ ...field.value, value: parseFloat(e.target.value) })}
                                                />
                                                <span className="ml-2">+</span>
                                            </div>
                                        )}
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <Separator />

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
                                            placeholder="Enter end time"
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

                    <Separator />

                    <FormField
                        control={form.control}
                        name="neighborhood"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Neighborhood</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a neighborhood" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {neighborhoodsForCity.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
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
                    

                    <Separator />

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
                                    This is the website to the event.
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
                                    <div>
                                        {/* Display existing image if it's a string (URL) */}
                                        {typeof field.value === "string" && field.value && (
                                            <div className="mb-4">
                                                <img src={field.value} alt="Event Image" className="w-64 h-auto rounded-lg" />
                                            </div>
                                        )}

                                        {/* File input for new image */}
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => field.onChange(e.target.files?.[0])}
                                        />
                                    </div>
                                </FormControl>
                                <FormDescription>
                                    Upload an image for the event (JPG, PNG, etc.).
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit">{eventId ? "Save" : "Submit"}</Button>
                </form>
            </Form>
        </>
    );
}
