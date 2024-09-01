import { useState } from "react"
import { format, parse } from "date-fns"

import { cn } from "@/lib/utils"
import {
    Plus,
    Minus
} from "lucide-react"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"

import { Event } from "@/app/types"
import { useEvent } from "@/app/use-event"

interface EventListProps {
    items: Event[]
}

export function EventList({ items }: EventListProps) {
    const [event, setEvent] = useEvent()

    // Group events by the starting date
    const eventsByDate = items.reduce((acc, item) => {
        let startDate: Date

        // Handle date ranges like "October 14-15, 2024"
        if (item.date.includes("-")) {
            const [startPart] = item.date.split("-")
            startDate = parse(startPart.trim() + `, ${new Date().getFullYear()}`, "MMMM d, yyyy", new Date())
        } else {
            // Handle single dates like "September 14, 2024"
            startDate = parse(item.date, "MMMM d, yyyy", new Date())
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

    return (
        <div>
            <Collapsible defaultOpen={isOpen} className="p-4" onOpenChange={() => setIsOpen(!isOpen)}>
                <CollapsibleTrigger className="flex w-full justify-between text-left text-sm font-semibold py-0.5 gap-1">
                    <span>{date}</span>
                    {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 pt-2">
                    {events.map((item) => (
                        <button
                            key={item.id}
                            className={cn(
                                "flex flex-col w-full items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent",
                                event.selected === item.id && "bg-muted"
                            )}
                            onClick={() =>
                                setEvent({
                                    ...event,
                                    selected: item.id,
                                })
                            }
                        >
                            <div className="flex w-full flex-col gap-1">
                                <div className="flex items-center">
                                    <div className="flex items-center gap-2">
                                        <div className="font-semibold">{item.name}</div>
                                    </div>
                                </div>
                                <div className="text-xs font-medium">{item.date}</div>
                                <div className="text-xs font-medium">{item.time}</div>
                            </div>
                            <div className="line-clamp-1 text-xs text-muted-foreground">
                                {item.description.substring(0, 300)}
                            </div>
                        </button>
                    ))}
                </CollapsibleContent>
            </Collapsible>
            {!isLastItem && <Separator />}
        </div>
    )
}