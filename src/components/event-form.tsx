"use client"

// Next and React Imports
import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"

// App Imports
import { useAuth } from "@/context/AuthContext"
import { TopBar } from "@/components/top-bar"
import MultiSelect, { Option } from "@/components/multi-select"
import EmptyPage from "@/components/empty-page"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { cityOptions, categoryOptions, formatOptions, neighborhoodOptions } from "@/lib/selectOptions"

// Firebase Imports
import { db } from "@/lib/firebase"
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore"
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage"

// Zod Imports
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

// Shadcn Imports
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { v4 as uuidv4 } from "uuid";
import { format, eachDayOfInterval } from "date-fns"
import { CalendarIcon, ExclamationTriangleIcon } from "@radix-ui/react-icons"



// Schema for form validation
const eventFormSchema = z.object({
    category: z
        .array(z.string())
        .min(1, { message: "At least 1 category is required." })
        .max(3, { message: "You can select up to 3 categories." }),
    city: z.string({ required_error: "A city is required." }),
    cost: z.object({
        type: z.enum(["single", "range", "minimum"]),
        value: z.union([
            z.number().nonnegative(), // for single value or minimum
            z.tuple([z.number().nonnegative(), z.number().nonnegative()]), // for range
        ]),
    }).default({ type: "single", value: 0 }),
    dailyTimes: z.array(z.object({
        startTime: z.string()
            .regex(/^(0[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i, {
                message: "Start time must be in HH:mm AM/PM format.",
            })
            .nullable()
            .optional()
            .or(z.literal("")),
        endTime: z.string()
            .regex(/^(0[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i, {
                message: "End time must be in HH:mm AM/PM format.",
            })
            .nullable()
            .optional()
            .or(z.literal("")),
    })).optional(),
    details: z
        .string()
        .min(4, {
            message: "Details must be at least 4 characters.",
        })
        .max(10000, {
            message: "Details must not be longer than 10,000 characters.",
        }),
    endDate: z.date({ required_error: "An end date is required." }),
    endTime: z
        .string()
        .regex(/^(0[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i, {
            message: "End time must be in HH:mm AM/PM format.",
        })
        .optional(),
    format: z.enum(["in-person", "online", "hybrid"], { required_error: "Please select a format." }),
    gmaps: z
        .string()
        .url({
            message: "Please enter a valid Google Maps URL.",
        }),
    image: z.any({ required_error: "An image is required." }),
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
    neighborhood: z.string({ required_error: "A neighborhood is required." }),
    startDate: z.date({ required_error: "A start date is required." }),
    startTime: z
        .string()
        .regex(/^(0[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i, {
            message: "Start time must be in HH:mm AM/PM format.",
        })
        .optional()
}).refine((data) => {
    const isSingleDayEvent = data.startDate === data.endDate;
    if (isSingleDayEvent) {
        // Single day event requires both startTime and endTime
        return data.startTime && data.endTime;
    } else {
        // Multi-day event requires dailyTimes and allows nullable times
        return data.dailyTimes && data.dailyTimes.length > 0;
    }
}, {
    message: "For single-day events, start and end times are required. For multi-day events, provide varying daily times.",
    path: ["startTime"]
});

type EventFormValues = z.infer<typeof eventFormSchema>

export default function EventForm() {
    const router = useRouter();
    const { toast } = useToast();

    // Initialize form with default values
    const form = useForm<EventFormValues>({
        resolver: zodResolver(eventFormSchema),
        mode: "onChange",
        defaultValues: {
            cost: { type: "single", value: 0 },
            format: "in-person",
        },
    })

    const { user, loading, userData } = useAuth();
    const searchParams = useSearchParams();
    const eventId = searchParams ? searchParams.get("id") : null;

    // Local state to track various form-specific values
    const [selectedCity, setSelectedCity] = useState<string | null>(null);
    const [neighborhoodsForCity, setNeighborhoodsForCity] = useState<Option[]>([]);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [clicks, setClicks] = useState(0);
    const [varyingTimes, setVaryingTimes] = useState(false);
    const [dailyTimes, setDailyTimes] = useState([{ date: new Date(), startTime: "", endTime: "" }]);

    const startDate = form.watch("startDate");
    const endDate = form.watch("endDate");
    const startDateFormatted = startDate ? format(startDate, "yyyy-MM-dd") : null;
    const endDateFormatted = endDate ? format(endDate, "yyyy-MM-dd") : null;

    const hasPermission = !loading && user && userData?.role === "curator";

    // Updates the neighborhood options whenever the selected city changes
    useEffect(() => {
        if (selectedCity) {
            // Update neighborhoods based on the selected city
            setNeighborhoodsForCity(neighborhoodOptions[selectedCity] || []);
        }
    }, [selectedCity]);

    // If editing an existint event, fetches event data from Firestore and updates the form fields
    useEffect(() => {
        if (eventId) {
            // If there's an event ID in the URL, fetch the event data for editing
            const fetchEvent = async () => {
                const eventDoc = await getDoc(doc(db, "events", eventId));
                if (eventDoc.exists()) {
                    const eventData = eventDoc.data();

                    // Set form fields with event data
                    setSelectedCity(eventData.city);
                    setClicks(eventData.clicks || 0);

                    if (eventData.image && typeof eventData.image === "string") {
                        setImagePreview(eventData.image);
                    }

                    // Slight delay for form update and setting multi-day times if applicable
                    setTimeout(() => {
                        const hasMultipleTimes = eventData.times && eventData.times.length > 1;

                        form.reset({
                            ...eventData,
                            startDate: new Date(`${eventData.startDate}T00:00:00`),
                            endDate: new Date(`${eventData.endDate}T00:00:00`),
                            category: eventData.category,
                            image: eventData.image,
                            dailyTimes: hasMultipleTimes ? eventData.times : undefined,
                            startTime: hasMultipleTimes ? undefined : eventData.times[0]?.startTime,
                            endTime: hasMultipleTimes ? undefined : eventData.times[0]?.endTime,
                        });
                        setVaryingTimes(hasMultipleTimes);
                        if (hasMultipleTimes) {
                            setDailyTimes(eventData.times.map((time: { startTime: string; endTime: string }) => ({
                                date: new Date(eventData.startDate),
                                startTime: time.startTime,
                                endTime: time.endTime,
                            })));
                        }
                    }, 50);
                } else {
                    // If event does not exist, show an error message and navigate back to the homepage
                    toast({ title: "Error", description: "Event not found.", variant: "destructive" });
                    router.push("/");
                }
            };
            fetchEvent();
        }
    }, [eventId]);

    // Updates dailyTimes state based on the interval between start and end dates
    useEffect(() => {
        if (startDate && endDate && startDate !== endDate) {
            // If start and end dates are different, create an array of dates between them
            const daysBetween = eachDayOfInterval({ start: startDate, end: endDate });
            const initialTimes = daysBetween.map((date) => ({ date, startTime: "", endTime: "" }));
            setDailyTimes(initialTimes); // Set initial daily times for each date in the interval
        } else {
            // Reset to single-time mode if start and end dates are the same
            setVaryingTimes(false);
        }
    }, [startDate, endDate]);

    const handleToggleVaryingTimes = () => {
        setVaryingTimes(!varyingTimes);
    };

    // Form submission handler
    const onSubmit = async (data: EventFormValues) => {
        const storage = getStorage();
        const eventsCollectionRef = doc(db, "events", eventId || uuidv4());
        
        const startDate = data.startDate.toISOString().split('T')[0];
        const endDate = data.endDate.toISOString().split('T')[0];

        const times = varyingTimes ? data.dailyTimes : [{ startTime: data.startTime, endTime: data.endTime }];

        const uploadImage = async () => {
            if (data.image && typeof data.image !== "string") {
                const uuid = uuidv4();
                const storageRef = ref(storage, `event_images/${uuid}`);
                const uploadTask = uploadBytesResumable(storageRef, data.image);

                return new Promise<string>((resolve, reject) => {
                    uploadTask.on("state_changed", () => {}, (error) => {
                        console.error("Upload failed:", error);
                        reject(error);
                    }, async () => {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        resolve(downloadURL);
                    });
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
            times,
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

    if (loading) {
        return <EmptyPage title="happns/event-form" description="loading..." />;
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
                <TopBar title={`happns/event-form`} />
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

                    {startDate && endDate && startDateFormatted !== endDateFormatted && (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                                <Checkbox checked={varyingTimes} onCheckedChange={handleToggleVaryingTimes} />
                            </FormControl>
                            <FormLabel className="text-sm font-normal">Event has varying start and end times</FormLabel>
                        </FormItem>
                    )}

                    {varyingTimes ? (
                        <div className="space-y-2">
                            {/* Labels for the columns */}
                            <div className="flex space-x-4 pb-2">
                                <span className="w-1/5"></span>
                                <div className="w-2/5">
                                    <span className="text-sm font-medium">Start Times</span>
                                    <span className="text-sm font-normal text-muted-foreground block">HH:mm AM/PM</span>
                                </div>
                                <div className="w-2/5">
                                    <span className="text-sm font-medium">End Times</span>
                                    <span className="text-sm font-normal text-muted-foreground block">HH:mm AM/PM</span>
                                </div>
                            </div>
                        
                            {dailyTimes.map((time, index) => (
                                <div key={index} className="flex space-x-4">
                                    
                                    {/* Display Date */}
                                    <Input
                                        type="text"
                                        value={format(time.date, "MMM d")}
                                        disabled
                                        className="w-1/5"
                                    />
                                    
                                    {/* Start Time */}
                                    <FormField
                                        control={form.control}
                                        name={`dailyTimes.${index}.startTime`}
                                        render={({ field }) => (
                                            <FormItem className="w-2/5">
                                                <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder="start time"
                                                    pattern="(0[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)"
                                                    value={field.value ?? ""}
                                                />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* End Time */}
                                    <FormField
                                        control={form.control}
                                        name={`dailyTimes.${index}.endTime`}
                                        render={({ field }) => (
                                            <FormItem className="w-2/5">
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        placeholder="end time"
                                                        pattern="(0[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)"
                                                        value={field.value ?? ""}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
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
                    )}

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
                                        {/* Image Preview */}
                                        {imagePreview && (
                                            <div className="mb-4 relative w-64 h-auto">
                                                <Image
                                                    src={imagePreview}
                                                    alt="Event Image Preview"
                                                    width={160}
                                                    height={160}
                                                    className="rounded-lg object-cover"
                                                />
                                            </div>
                                        )}

                                        {/* Image Input */}
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    field.onChange(file); // Update form value with new file
                                                    setImagePreview(URL.createObjectURL(file)); // Set the preview to the new image
                                                }
                                            }}
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
