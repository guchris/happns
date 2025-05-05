"use client"

// React Imports
import { useState, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"

// App Imports
import { Event } from "@/components/types"
import { useEvent } from "@/hooks/use-event"
import { sortEventsByTypeAndDateAndName, formatEventTime } from "@/lib/eventUtils"
import { categoryOptions } from "@/lib/selectOptions"

// Shadcn Imports
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

// Other Imports
import { ChevronLeft, ChevronRight } from "lucide-react"
import { format, parseISO, addDays, subDays, differenceInDays } from "date-fns"
import { cn } from "@/lib/utils"

interface EventCalendarViewProps {
    items: Event[]
    isFilterActive: boolean
    startDate: Date
    currentDate: Date
    setCurrentDate: (date: Date) => void
}

export function EventCalendarView({ 
    items,
    currentDate,
    setCurrentDate 
}: EventCalendarViewProps) {
    const [event, setEvent] = useEvent()
    const router = useRouter()
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768)
        }
        handleResize() // Check on mount
        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [])

    // Get events for the current day
    const eventsForDay = items.filter((item) => {
        const eventStart = parseISO(item.startDate)
        const eventEnd = parseISO(item.endDate)
        const currentDateStr = format(currentDate, "yyyy-MM-dd")
        const eventStartStr = format(eventStart, "yyyy-MM-dd")
        const eventEndStr = format(eventEnd, "yyyy-MM-dd")
        
        return currentDateStr >= eventStartStr && currentDateStr <= eventEndStr
    })

    // Sort events by time
    const sortedEvents = sortEventsByTypeAndDateAndName(eventsForDay)

    const handlePrevDay = () => {
        setCurrentDate(subDays(currentDate, 1))
    }

    const handleNextDay = () => {
        setCurrentDate(addDays(currentDate, 1))
    }

    const handleEventClick = async (eventId: string) => {
        if (isMobile) {
            // Save the current date before navigating
            localStorage.setItem("eventCurrentDate", currentDate.toISOString());
            router.push(`/events/${eventId}`)
        } else {
            setEvent({ ...event, selected: eventId })
        }
    }

    return (
        <div className="flex flex-col h-full">
            {/* Date Navigation */}
            <div className="flex items-center justify-between px-4 py-2">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handlePrevDay}
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-sm font-semibold">
                    {format(currentDate, "EEE, MMM d")}
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleNextDay}
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>

            <Separator />

            {/* Events List */}
            <ScrollArea className="flex-1">
                {sortedEvents.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                        no events
                    </div>
                ) : (
                    <div className="space-y-2 p-4">
                        {sortedEvents.map((item) => {
                            const startDate = parseISO(item.startDate)
                            const endDate = parseISO(item.endDate)
                            
                            // Calculate the index of the current date relative to the event's start date
                            const dateIndex = differenceInDays(currentDate, startDate)
                            
                            // Use dateIndex to get the corresponding time entry for this date
                            let timeEntry = item.times[dateIndex]

                            // If timeEntry is undefined and times array has only one entry, use that single entry
                            if (!timeEntry && item.times.length === 1) {
                                timeEntry = item.times[0]
                            }

                            // Check if timeEntry exists before trying to format the time
                            const formattedTime = timeEntry
                                ? `${formatEventTime(timeEntry.startTime)} - ${formatEventTime(timeEntry.endTime)}`
                                : "Time not available"

                            // Format the display date for rendering
                            const formattedDate = startDate.getTime() === endDate.getTime()
                                ? format(startDate, "MMM d")
                                : `${format(startDate, "MMM d")} - ${format(endDate, "MMM d")}`

                            return (
                                <button
                                    key={item.id}
                                    className={cn(
                                        'flex flex-row w-full items-start gap-4 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent',
                                        event.selected === item.id && "bg-muted"
                                    )}
                                    onClick={() => handleEventClick(item.id)}
                                >
                                    <Image
                                        src={item.image || "/tempFlyer1.svg"}
                                        alt={item.name}
                                        width={150}
                                        height={150}
                                        loading="lazy"
                                        className={cn(
                                            "w-24 object-cover rounded-lg"
                                        )}
                                    />
                                    <div className="flex flex-col gap-2 w-full">
                                        <div className="flex flex-col">
                                            <div className="line-clamp-1 text-base font-semibold">{item.name}</div>
                                            <div className="line-clamp-1 text-sm font-medium">{formattedDate}</div>
                                            <div className="line-clamp-1 text-sm font-medium">{formattedTime}</div>
                                        </div>
                                        <div className="inline-flex gap-1 flex-wrap">
                                            <Badge
                                                className={cn(
                                                    "inline-block",
                                                    item.eventDurationType === "single" && "bg-green-200 text-black",
                                                    item.eventDurationType === "multi" && "bg-blue-200 text-black",
                                                    item.eventDurationType === "extended" && "bg-purple-200 text-black"
                                                )}
                                            >
                                                {item.eventDurationType === "single"
                                                    ? "Single Day"
                                                    : item.eventDurationType === "multi"
                                                    ? "Multi-Day"
                                                    : "Extended"}
                                            </Badge>
                                            {item.category.map((cat, index) => {
                                                const categoryLabel = categoryOptions.find(option => option.value === cat)?.label || "Unknown"
                                                return (
                                                    <Badge key={index} variant="secondary" className="inline-block">
                                                        {categoryLabel}
                                                    </Badge>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                )}
            </ScrollArea>
        </div>
    )
} 