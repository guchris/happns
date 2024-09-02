"use client"

import Link from "next/link";

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod"

import { cn } from "@/lib/utils"
// import { toast } from "@/hooks/use-toast"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const eventFormSchema = z.object({
    name: z
        .string()
        .min(2, {
            message: "Name must be at least 2 characters.",
        })
        .max(50, {
            message: "Name must not be longer than 50 characters.",
        }),
    category: z
        .string(),
    description: z.string().max(320).min(4),
    details: z.string().max(320).min(4),
    urls: z
        .array(
            z.object({
                value: z.string().url({ message: "Please enter a valid URL." }),
            })
        )
        .optional(),
})

type EventFormValues = z.infer<typeof eventFormSchema>

const defaultValues: Partial<EventFormValues> = {
    description: "Lorem ipsum description",
    details: "Lorem ipsum details"
}


export default function EventForm() {
    const form = useForm<EventFormValues>({
        resolver: zodResolver(eventFormSchema),
        defaultValues,
        mode: "onChange",
    })

    function onSubmit(data: EventFormValues) {
        // toast({
        //     title: "You submitted the following values:",
        //     description: (
        //         <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
        //             <code className="text-white">{JSON.stringify(data, null, 2)}</code>
        //         </pre>
        //     )
        // })
    }
    
    return (
        <>
            <div className="flex h-full flex-col">
                <div className="w-full flex items-center justify-between py-4 px-4 h-14">
                    <h2 className="text-lg font-semibold">
                        <Link href="/">happns</Link>
                        /add-event
                    </h2>
                    {/* <Button variant="secondary">
                        <Link href="" target="_blank">
                            Submit
                        </Link>
                    </Button> */}
                </div>
                <Separator />
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
                        <Button type="submit">Submit</Button>
                    </form>
                </Form>
            </div>
        </>
    );
}
