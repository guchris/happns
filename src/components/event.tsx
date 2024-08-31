"use client"

import * as React from "react"
import { isWithinInterval, parse } from "date-fns"
import { DateRange } from "react-day-picker"

import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"  
import { TooltipProvider } from "@/components/ui/tooltip"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

import { CalendarDateRangePicker } from "@/components/date-range-picker"
import { EventDisplay } from "@/components/event-display"
import { EventList } from "@/components/event-list"

import { useEvent } from "@/app/use-event"
import { type Event } from "@/app/types"

interface EventProps {
    events: Event[]
}

export function Event({
    events
}: EventProps) {
    const [event, setEvent] = useEvent()
    const defaultLayout = [20, 40, 40]

    const [selectedCategory, setSelectedCategory] = React.useState<string | undefined>(undefined)
    const [selectedFormat, setSelectedFormat] = React.useState<string | undefined>(undefined)
    const [selectedNeighborhood, setSelectedNeighborhood] = React.useState<string | undefined>(undefined)
    const [selectedCost, setSelectedCost] = React.useState<string | undefined>(undefined)
    const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
        from: new Date(),
        to: undefined,
    })

    React.useEffect(() => {
        setEvent((prevEvent) => ({
            ...prevEvent,
            selected: null,
        }))
    }, [setEvent])

    const parseEventDate = (dateString: string) => {
        if (dateString.includes("-")) {
            // Handle ranges like "October 27-28, 2024"
            const [startPart, endPart] = dateString.split("-")
            const year = startPart.match(/\d{4}$/) ? '' : `, ${new Date().getFullYear()}`; // If the year is missing in the second part, assume it's the same as the first part
            const startDate = parse(startPart.trim() + year, "MMMM d, yyyy", new Date())
            const endDate = parse(endPart.trim(), "MMMM d, yyyy", startDate)
            return { startDate, endDate }
        } else {
            // Handle single dates like "October 27, 2024"
            const date = parse(dateString, "MMMM d, yyyy", new Date())
            return { startDate: date, endDate: date }
        }
    }

    const isEventInRange = (eventStart: Date, eventEnd: Date, rangeStart: Date, rangeEnd?: Date) => {
        const effectiveRangeEnd = rangeEnd || new Date(9999, 11, 31); // Use far-future date if rangeEnd is undefined
        return (
            isWithinInterval(eventStart, { start: rangeStart, end: effectiveRangeEnd }) || 
            isWithinInterval(eventEnd, { start: rangeStart, end: effectiveRangeEnd }) || 
            (rangeStart <= eventStart && effectiveRangeEnd >= eventEnd)
        )
    }

    const filteredEvents = events.filter((e) => {
        const { startDate, endDate } = parseEventDate(e.date)
        const isInDateRange =
            dateRange?.from &&
            isEventInRange(startDate, endDate, dateRange.from, dateRange.to)

        return (
            (!dateRange?.from || isInDateRange) &&
            (!selectedCategory || e.category === selectedCategory) &&
            (!selectedFormat || e.format === selectedFormat) &&
            (!selectedNeighborhood || e.neighborhood === selectedNeighborhood) &&
            (!selectedCost ||
                (selectedCost === "free" && e.cost === 0) ||
                (selectedCost === "varies" && e.cost === -1) ||
                (selectedCost === "$0-$25" && e.cost > 0 && e.cost <= 25) ||
                (selectedCost === "$25-$50" && e.cost > 25 && e.cost <= 50) ||
                (selectedCost === "$50-$100" && e.cost > 50 && e.cost <= 100) ||
                (selectedCost === "$100+" && e.cost > 100))
        )
    })

    const handleClearAll = () => {
        setSelectedCategory(undefined)
        setSelectedFormat(undefined)
        setSelectedNeighborhood(undefined)
        setSelectedCost(undefined)
        setDateRange({ from: new Date(), to: undefined })
    }

    return (
        <TooltipProvider delayDuration={0}>
            <ResizablePanelGroup
                direction="horizontal"
                onLayout={(sizes: number[]) => {
                    document.cookie = `react-resizable-panels:layout:mail=${JSON.stringify(
                        sizes
                    )}`
                }}
                className="h-full items-stretch"
            >
                <ResizablePanel defaultSize={defaultLayout[0]} minSize={15} maxSize={20} className="h-full overflow-y-auto">
                    <div className="p-4">
                        <form className="space-y-4">
                            <CalendarDateRangePicker
                                selected={dateRange}
                                onSelect={setDateRange}
                            />
                            <div className="space-y-2">
                                {/* <Label htmlFor="category">Event Category</Label> */}
                                <Select onValueChange={setSelectedCategory}>
                                    <SelectTrigger id="category" className="w-full">
                                        <SelectValue placeholder="Category" />
                                    </SelectTrigger>
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
                            </div>
                            <div className="space-y-2">
                                {/* <Label htmlFor="format">Event Format</Label> */}
                                <Select onValueChange={setSelectedFormat}>
                                    <SelectTrigger id="format" className="w-full">
                                        <SelectValue placeholder="Format" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="in-person">In-Person</SelectItem>
                                        <SelectItem value="online">Online</SelectItem>
                                        <SelectItem value="hybrid">Hybrid</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                {/* <Label htmlFor="neighborhood">Neighborhood</Label> */}
                                <Select onValueChange={setSelectedNeighborhood}>
                                    <SelectTrigger id="neighborhood" className="w-full">
                                        <SelectValue placeholder="Neighborhood" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="capitol-hill">Capitol Hill</SelectItem>
                                        <SelectItem value="ballard">Ballard</SelectItem>
                                        <SelectItem value="beacon-hill">Beacon Hill</SelectItem>
                                        <SelectItem value="fremont">Fremont</SelectItem>
                                        <SelectItem value="queen-anne">Queen Anne</SelectItem>
                                        <SelectItem value="seattle">Seattle</SelectItem>
                                        <SelectItem value="tukwila">Tukwila</SelectItem>
                                        <SelectItem value="tukwila">Wallingford</SelectItem>
                                        <SelectItem value="west-seattle">West Seattle</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                {/* <Label htmlFor="cost">Cost</Label> */}
                                <Select onValueChange={setSelectedCost}>
                                    <SelectTrigger id="cost" className="w-full">
                                        <SelectValue placeholder="Cost" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="free">Free</SelectItem>
                                        <SelectItem value="varies">Varies</SelectItem>
                                        <SelectItem value="$0-$25">$0-$25</SelectItem>
                                        <SelectItem value="$25-$50">$25-$50</SelectItem>
                                        <SelectItem value="$50-$100">$50-$100</SelectItem>
                                        <SelectItem value="$100+">$100+</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button variant="outline" onClick={handleClearAll} className="w-full">
                                Reset
                            </Button>
                        </form>
                    </div>
                </ResizablePanel>

                <ResizableHandle withHandle />

                <ResizablePanel defaultSize={defaultLayout[1]} minSize={30} className="h-full overflow-y-auto">
                    <EventList items={filteredEvents} />
                </ResizablePanel>

                <ResizableHandle withHandle />

                <ResizablePanel defaultSize={defaultLayout[2]} minSize={30} className="h-full overflow-y-auto">
                    {filteredEvents.length > 0 && (
                        <EventDisplay event={events.find((item) => item.id === event.selected) || null} />
                    )}
                </ResizablePanel>
            </ResizablePanelGroup>
        </TooltipProvider>
    )
}