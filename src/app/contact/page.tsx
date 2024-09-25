"use client"

// Components Imports
import { TopBar } from "@/components/top-bar"

// Shadcn Imports
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { useToast } from "@/hooks/use-toast"

// Other Imports
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import emailjs from "emailjs-com"

const contactFormSchema = z.object({
    name: z.string()
        .min(2, { message: "Name must be at least 2 characters." })
        .max(50, { message: "Name must be no longer than 50 characters." }),
    email: z.string()
        .email({ message: "Please enter a valid email address." }),
    phone: z.string()
        .regex(/^[0-9]{10}$/, { message: "Please enter a valid 10-digit phone number." }),
    message: z.string()
        .min(10, { message: "Message must be at least 10 characters." })
        .max(1000, { message: "Message must not be longer than 1000 characters." }),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

export default function ContactForm() {
    const { toast } = useToast();
    const form = useForm<ContactFormValues>({
        resolver: zodResolver(contactFormSchema),
        mode: "onChange",
    });

    const onSubmit = async (data: ContactFormValues) => {
        try {
            const serviceID = "service_a88v82m";
            const templateID = "template_o16thhl";
            const publicKey = "f_LEIx68G0nwD2rXS";

            // Send the form data via EmailJS
            await emailjs.send(
                serviceID,
                templateID,
                {
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    message: data.message,
                },
                publicKey
            );

            toast({
                title: "Message Sent",
                description: "Thank you for reaching out. We'll get back to you soon.",
            });

            form.reset({
                name: "",
                email: "",
                phone: "",
                message: "",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to send message. Please try again later.",
                variant: "destructive",
            });
        }
    }

    return (
        <>
            <div className="flex h-full flex-col">
                <TopBar title={`happns/contact`} />
                <Separator />
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col px-4 pt-8 space-y-8 max-w-[800px] mx-auto">

                        {/* Title and Description */}
                        <div className="space-y-2">
                            <h1 className="text-lg font-medium">Contact Us</h1>
                            <p className="text-sm text-muted-foreground">
                                Need to reach us? Please fill out the form below with your contact info and message, and we'll get back to you as soon as possible. Let's make it happn!
                            </p>
                        </div>

                        {/* Name Field */}
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="Name" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Email Field */}
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input type="email" {...field} placeholder="Email" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Phone Number Field */}
                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Phone Number</FormLabel>
                                    <FormControl>
                                        <Input type="tel" {...field} placeholder="Phone Number" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Message Field */}
                        <FormField
                            control={form.control}
                            name="message"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Message</FormLabel>
                                    <FormControl>
                                        <Textarea {...field} placeholder="Your message" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit">Submit</Button>
                    </form>
                </Form>
            </div>
        </>
    )
}