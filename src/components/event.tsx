"use client"

// React Imports
import * as React from "react"

// Components Imports
import { EventList } from "@/components/event-list"
import { EventDisplay } from "@/components/event-display"
import { CalendarDateRangePicker } from "@/components/date-range-picker"

// Lib Imports
import { useEvent } from "@/app/use-event"
import { type Event } from "@/components/types"
import { categoryOptions, formatOptions, neighborhoodOptions, costOptions } from "@/lib/selectOptions";

// Shadcn Imports
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { TooltipProvider } from "@/components/ui/tooltip"
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
import {
    Sheet,
    SheetContent,
    SheetTrigger,
    SheetClose
} from "@/components/ui/sheet";

// Other Imports
import { DateRange } from "react-day-picker"
import { isWithinInterval, parse } from "date-fns"

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
            // Handle ranges like "10/27/2024 - 10/29/2024"
            const [startPart, endPart] = dateString.split(" - ")
            const startDate = parse(startPart.trim(), "MM/dd/yyyy", new Date())
            const endDate = parse(endPart.trim(), "MM/dd/yyyy", startDate)
            return { startDate, endDate }
        } else {
            // Handle single dates like "10/27/2024"
            const date = parse(dateString, "MM/dd/yyyy", new Date())
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
            {/* Mobile View */}
            <div className="md:hidden">
                {!event.selected ? (
                    <div>
                        <div className="flex items-center px-4 py-2">
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button variant="secondary" className="w-full">Filters</Button>
                                </SheetTrigger>
                                <SheetContent side="bottom">
                                    <div className="p-4">
                                        <form className="space-y-4">
                                            <CalendarDateRangePicker
                                                selected={dateRange}
                                                onSelect={setDateRange}
                                            />
                                            <div className="space-y-2">
                                                <Select onValueChange={setSelectedCategory}>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Category" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {categoryOptions.map(option => (
                                                            <SelectItem key={option.value} value={option.value}>
                                                                {option.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Select onValueChange={setSelectedFormat}>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Format" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {formatOptions.map(option => (
                                                            <SelectItem key={option.value} value={option.value}>
                                                                {option.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Select onValueChange={setSelectedNeighborhood}>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Neighborhood" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {neighborhoodOptions.map(option => (
                                                            <SelectItem key={option.value} value={option.value}>
                                                                {option.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Select onValueChange={setSelectedCost}>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Cost" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {costOptions.map(option => (
                                                            <SelectItem key={option.value} value={option.value}>
                                                                {option.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <Button variant="outline" onClick={handleClearAll} className="w-full">
                                                Reset
                                            </Button>
                                            <SheetClose asChild>
                                                <Button className="w-full mt-4">Apply Filters</Button>
                                            </SheetClose>
                                        </form>
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </div>
                        <Separator />
                        <EventList items={filteredEvents} />
                    </div>
                ) : (
                    <div>
                        <EventDisplay 
                            event={events.find((item) => item.id === event.selected) || null} 
                            onBack={() => setEvent({ ...event, selected: null })} 
                        />
                    </div>
                )}
            </div>

            {/* Desktop View */}
            <div className="hidden md:flex h-full items-stretch">
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
                                    <Select onValueChange={setSelectedCategory}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categoryOptions.map(option => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Select onValueChange={setSelectedFormat}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Format" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {formatOptions.map(option => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Select onValueChange={setSelectedNeighborhood}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Neighborhood" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {neighborhoodOptions.map(option => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Select onValueChange={setSelectedCost}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Cost" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {costOptions.map(option => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
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
                            <EventDisplay 
                                event={events.find((item) => item.id === event.selected) || null} 
                                onBack={() => setEvent({ ...event, selected: null })} 
                            />
                        )}
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>
        </TooltipProvider>
    )
}