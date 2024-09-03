{/* React Imports */}
import { useState } from "react"

{/* Next Imports */}
import Image from "next/image"

{/* Lib Imports */}
import { cn } from "@/lib/utils"
import { Event } from "@/components/types"
import { useEvent } from "@/app/use-event"

{/* Shadcn Imports */}
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"

{/* Icon Imports */}
import {
    Plus,
    Minus
} from "lucide-react"

{/* Other Imports */}
import { format, parse } from "date-fns"

interface EventListProps {
    items: Event[]
}

export function EventList({ items }: EventListProps) {
    const [event, setEvent] = useEvent()

    // Group events by the starting date
    const eventsByDate = items.reduce((acc, item) => {
        let startDate: Date

        // Handle date ranges like "10/14/2024 - 10/15/2024"
        if (item.date.includes("-")) {
            const [startPart] = item.date.split(" - ")
            startDate = parse(startPart.trim(), "MM/dd/yyyy", new Date())
        } else {
            // Handle single dates like "09/14/2024"
            startDate = parse(item.date, "MM/dd/yyyy", new Date())
        }

        const formattedDate = format(startDate, "MMMM d, yyyy")

        if (!acc[formattedDate]) {
            acc[formattedDate] = []
        }
        acc[formattedDate].push(item)
        return acc
    }, {} as Record<string, Event[]>)

    // Sort dates in ascending order based on Date objects
    const sortedDates = Object.keys(eventsByDate).sort((a, b) => {
        const dateA = parse(a, "MMMM d, yyyy", new Date())
        const dateB = parse(b, "MMMM d, yyyy", new Date())
        return dateA.getTime() - dateB.getTime()
    })

    return (
        <ScrollArea className="h-screen">
            <div className="flex flex-col">
                {sortedDates.map((date, index) => (
                    <div key={date}>
                        <CollapsibleItem date={date} events={eventsByDate[date]} isLastItem={index === sortedDates.length - 1} />
                    </div>
                ))}
            </div>
        </ScrollArea>
    )
}

interface CollapsibleItemProps {
    date: string
    events: Event[]
    isLastItem: boolean
}

function CollapsibleItem({ date, events, isLastItem }: CollapsibleItemProps) {
    const [isOpen, setIsOpen] = useState(true)
    const [event, setEvent] = useEvent()

    // Parse the date for display in the trigger
    const parsedDate = parse(date, "MMMM d, yyyy", new Date())
    const triggerDate = format(parsedDate, "EEE, MMM d") // Format as "Mon, Sep 2"

    return (
        <div>
            <Collapsible defaultOpen={isOpen} className="p-4" onOpenChange={() => setIsOpen(!isOpen)}>
                <CollapsibleTrigger className="flex w-full justify-between text-left text-sm font-semibold py-0.5 gap-1">
                    <span>{triggerDate}</span>
                    {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 pt-2">
                    {events.map((item) => {
                        // Parse and format the date here
                        const formattedDate = item.date.includes("-") 
                            ? `${format(parse(item.date.split(" - ")[0].trim(), "MM/dd/yyyy", new Date()), "MMM d, yyyy")} - ${format(parse(item.date.split(" - ")[1].trim(), "MM/dd/yyyy", new Date()), "MMM d, yyyy")}` 
                            : format(parse(item.date, "MM/dd/yyyy", new Date()), "MMM d, yyyy");

                        return (
                            <button
                                key={item.id}
                                className={cn(
                                    "flex flex-col md:flex-row w-full items-start gap-4 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent",
                                    event.selected === item.id && "bg-muted"
                                )}
                                onClick={() =>
                                    setEvent({
                                        ...event,
                                        selected: item.id,
                                    })
                                }
                            >
                                <Image
                                    src={item.image || "/tempFlyer1.svg"}
                                    alt={item.name}
                                    width={150}
                                    height={150}
                                    className="object-cover rounded-lg w-full md:w-48 md:h-auto"
                                />
                                <div className="flex flex-col gap-2 w-full">
                                    <div className="flex flex-col gap-1">
                                        <div className="font-semibold">{item.name}</div>
                                        <div className="text-xs font-medium">{formattedDate}</div>
                                        <div className="text-xs font-medium">{item.time}</div>
                                    </div>
                                    <div className="line-clamp-4 text-xs text-muted-foreground">
                                        {item.description.substring(0, 300)}
                                    </div>
                                    <div className="inline-flex">
                                        <Badge variant="secondary" className="inline-block">
                                            {item.category}
                                        </Badge>
                                    </div>
                                </div>
                            </button>
                        )
                    })}
                </CollapsibleContent>
            </Collapsible>
            {!isLastItem && <Separator />}
        </div>
    )
}