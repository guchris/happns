"use client"

// React Imports
import * as React from "react"
import { useEffect, useState } from "react"

// Firebase Imports
import { db } from "@/app/firebase";
import { collection, getDocs } from "firebase/firestore"
import { useAuth } from "@/context/AuthContext"

// Components Imports
import { EventList } from "@/components/event-list"
import { EventDisplay } from "@/components/event-display"
import MultiSelect, { Option } from '@/components/multi-select'

// Lib Imports
import { useEvent } from "@/app/use-event"
import { type Event } from "@/components/types"
import { categoryOptions, formatOptions, neighborhoodOptions, costOptions } from "@/lib/selectOptions"

// Shadcn Imports
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Switch } from "@/components/ui/switch"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"
import {
    Sheet,
    SheetContent,
    SheetTrigger,
    SheetClose
} from "@/components/ui/sheet";

// Icon Imports
import {
    CalendarIcon,
    ViewHorizontalIcon,
    ViewVerticalIcon,
    FontBoldIcon,
    FontItalicIcon,
    UnderlineIcon,
    SectionIcon,
    ContainerIcon
} from "@radix-ui/react-icons"

// Other Imports
import { isWithinInterval, parse, format } from "date-fns"

interface EventProps {
    events: Event[]
}

export function Event({
    events
}: EventProps) {
    const [event, setEvent] = useEvent()
    const defaultLayout = [50,50]

    const { user } = useAuth();
    const [bookmarkedEventIds, setBookmarkedEventIds] = React.useState<string[]>([]);
    const [showBookmarkedEvents, setShowBookmarkedEvents] = React.useState(false);

    const [isVerticalLayout, setIsVerticalLayout] = React.useState(false);

    const [selectedCategories, setSelectedCategories] = useState<Option[]>([]);
    const selectedCategoryValues = selectedCategories.map(category => category.value);
    const [selectedFormats, setSelectedFormats] = useState<Option[]>([]);
    const selectedFormatValues = selectedFormats.map(format => format.value);
    const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<Option[]>([]);
    const selectedNeighborhoodValues = selectedNeighborhoods.map(neighborhood => neighborhood.value);
    const [selectedCosts, setSelectedCosts] = useState<Option[]>([]);
    const selectedCostValues = selectedCosts.map(cost => cost.value);

    const [startDate, setStartDate] = useState<Date | undefined>(new Date());
    const [endDate, setEndDate] = useState<Date | undefined>(undefined);

    useEffect(() => {
        if (user) {
            const fetchBookmarkedEvents = async () => {
                const userBookmarksRef = collection(db, `users/${user.uid}/user-bookmarks`);
                const snapshot = await getDocs(userBookmarksRef);
                const bookmarkedIds = snapshot.docs.map(doc => doc.id);
                setBookmarkedEventIds(bookmarkedIds);
            };

            fetchBookmarkedEvents();
        }
    }, [user]);

    useEffect(() => {
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
        const { startDate: eventStart, endDate: eventEnd } = parseEventDate(e.date);
        const isInDateRange = startDate && isEventInRange(eventStart, eventEnd, startDate, endDate);

        // Filter based on switch state (false = All Events, true = Bookmarked Events)
        const isBookmarked = bookmarkedEventIds.includes(e.id)
        const shouldShowEvent = !showBookmarkedEvents || (showBookmarkedEvents && isBookmarked)

        const isCostMatch = selectedCostValues.length === 0 || selectedCostValues.some(costValue => {
            if (!e.cost) return false; // No cost information, so no match
        
            switch (e.cost.type) { 
                case "single":
                case "minimum":
                    if (typeof e.cost.value !== 'number') return false;
                    return (
                        (costValue === "free" && e.cost.value === 0) ||
                        (costValue === "$0-$25" && e.cost.value > 0 && e.cost.value <= 25) ||
                        (costValue === "$25-$50" && e.cost.value > 25 && e.cost.value <= 50) ||
                        (costValue === "$50-$100" && e.cost.value > 50 && e.cost.value <= 100) ||
                        (costValue === "$100+" && e.cost.value > 100)
                    );
                case "range":
                    if (!Array.isArray(e.cost.value)) return false;
                    const [min, max] = e.cost.value;
                    return (
                        (costValue === "$0-$25" && min <= 25) ||
                        (costValue === "$25-$50" && min <= 50 && max >= 25) ||
                        (costValue === "$50-$100" && min <= 100 && max >= 50) ||
                        (costValue === "$100+" && max >= 100)
                    );
                default:
                    return false;
            }
        });

        // Updated category matching logic to handle array of categories
        const isCategoryMatch = selectedCategoryValues.length === 0 || 
        selectedCategoryValues.some(selectedCategory => e.category.includes(selectedCategory));
    

        return (
            (!startDate || isInDateRange) &&
            isCategoryMatch &&
            (selectedFormatValues.length === 0 || selectedFormatValues.includes(e.format)) &&
            (selectedNeighborhoodValues.length === 0 || selectedNeighborhoodValues.includes(e.neighborhood)) &&
            isCostMatch &&
            shouldShowEvent
        )
    })

    const handleClearAll = () => {
        setSelectedCategories([])
        setSelectedFormats([])
        setSelectedNeighborhoods([])
        setSelectedCosts([])
        setStartDate(new Date())
        setEndDate(undefined)
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
                                            <div className="grid grid-cols-1 gap-4 w-full">
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            className="pl-3 text-left font-normal"
                                                        >
                                                            {startDate ? format(startDate, "MMM d, yyyy") : "Start Date"}
                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0">
                                                        <Calendar
                                                            mode="single"
                                                            selected={startDate}
                                                            onSelect={setStartDate}
                                                        />
                                                    </PopoverContent>
                                                </Popover>

                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            className="pl-3 text-left font-normal"
                                                        >
                                                            {endDate ? format(endDate, "MMM d, yyyy") : "End Date"}
                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0">
                                                        <Calendar
                                                            mode="single"
                                                            selected={endDate}
                                                            onSelect={setEndDate}
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                            {user && (
                                                <div className="flex items-center w-auto max-w-fit border border-[hsl(var(--border))] rounded-md px-2 py-1.5">
                                                    <Switch
                                                        checked={showBookmarkedEvents}
                                                        onCheckedChange={setShowBookmarkedEvents}
                                                        className="mx-2"
                                                    />
                                                    <span className="text-sm">Bookmarked</span>
                                                </div>
                                            )}

                                            {/* Category MultiSelect */}
                                            <MultiSelect
                                                options={categoryOptions}
                                                value={selectedCategories}
                                                onChange={setSelectedCategories}
                                                placeholder="Category"
                                            />

                                            {/* Format MultiSelect */}
                                            <MultiSelect
                                                options={formatOptions}
                                                value={selectedFormats}
                                                onChange={setSelectedFormats}
                                                placeholder="Format"
                                            />

                                            {/* Neighborhood MultiSelect */}
                                            <MultiSelect
                                                options={neighborhoodOptions}
                                                value={selectedNeighborhoods}
                                                onChange={setSelectedNeighborhoods}
                                                placeholder="Neighborhood"
                                            />

                                            {/* Cost MultiSelect */}
                                            <MultiSelect
                                                options={costOptions}
                                                value={selectedCosts}
                                                onChange={setSelectedCosts}
                                                placeholder="Cost"
                                            />

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
                            <Button
                                variant="outline"
                                className="ml-2"
                                onClick={() => setIsVerticalLayout(prev => !prev)}
                            >
                                {isVerticalLayout ? <SectionIcon /> : <ContainerIcon />}
                            </Button>
                        </div>
                        <Separator />
                        {filteredEvents.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">No events</div>
                        ) : (
                            <EventList items={filteredEvents} isVerticalLayout={isVerticalLayout} />
                        )}
                    </div>
                ) : (
                    <EventDisplay 
                        event={events.find((item) => item.id === event.selected) || null} 
                        onBack={() => setEvent({ ...event, selected: null })} 
                    />
                )}
            </div>

            {/* Desktop View */}
            <div className="hidden md:flex h-full items-stretch">

                {/* Filters Section */}
                <div className="min-w-[250px] max-w-[250px] p-4 space-y-4">
                    <form className="space-y-4">

                        {/* Date Options */}
                        {/* <ToggleGroup type="single" defaultValue="today" className="flex flex-col w-full">
                            <ToggleGroupItem value="today" className="w-full px-4 py-2">
                                Today
                            </ToggleGroupItem>
                            <ToggleGroupItem value="tomorrow" className="w-full px-4 py-2">
                                Tomorrow
                            </ToggleGroupItem>
                            <ToggleGroupItem value="this-week" className="w-full px-4 py-2">
                                This Week
                            </ToggleGroupItem>
                            <ToggleGroupItem value="this-weekend" className="w-full px-4 py-2">
                                This Weekend
                            </ToggleGroupItem>
                        </ToggleGroup> */}

                        {/* Start Date */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="pl-3 text-left font-normal w-full"
                                >
                                    {startDate ? format(startDate, "MMM d, yyyy") : "Start Date"}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={startDate}
                                    onSelect={setStartDate}
                                />
                            </PopoverContent>
                        </Popover>

                        {/* End Date */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="pl-3 text-left font-normal w-full"
                                >
                                    {endDate ? format(endDate, "MMM d, yyyy") : "End Date"}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={endDate}
                                    onSelect={setEndDate}
                                />
                            </PopoverContent>
                        </Popover>
                        
                        {/* Bookmarks Toogle */}
                        {user && (
                            <div className="flex items-center border border-[hsl(var(--border))] rounded-md px-2 py-1.5">
                                <Switch
                                    checked={showBookmarkedEvents}
                                    onCheckedChange={setShowBookmarkedEvents}
                                    className="mx-2"
                                />
                                <span className="text-sm">Bookmarked</span>
                            </div>
                        )}

                        {/* Category MultiSelect */}
                        <MultiSelect
                            options={categoryOptions}
                            value={selectedCategories}
                            onChange={setSelectedCategories}
                            placeholder="Category"
                        />

                        {/* Format MultiSelect */}
                        <MultiSelect
                            options={formatOptions}
                            value={selectedFormats}
                            onChange={setSelectedFormats}
                            placeholder="Format"
                        />

                        {/* Neighborhood MultiSelect */}
                        <MultiSelect
                            options={neighborhoodOptions}
                            value={selectedNeighborhoods}
                            onChange={setSelectedNeighborhoods}
                            placeholder="Neighborhood"
                        />
                        
                        {/* Cost MultiSelect */}
                        <MultiSelect
                            options={costOptions}
                            value={selectedCosts}
                            onChange={setSelectedCosts}
                            placeholder="Cost"
                        />

                        <Button variant="outline" onClick={handleClearAll} className="w-full">
                            Reset
                        </Button>
                    </form>
                </div>

                <Separator orientation="vertical" />

                <ResizablePanelGroup
                    direction="horizontal"
                    onLayout={(sizes: number[]) => {
                        document.cookie = `react-resizable-panels:layout:mail=${JSON.stringify(
                            sizes
                        )}`
                    }}
                    className="h-full items-stretch"
                >
                    <ResizablePanel defaultSize={defaultLayout[0]} minSize={30} className="h-full overflow-y-auto">
                        {filteredEvents.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">No events</div>
                        ) : (
                            <EventList items={filteredEvents} isVerticalLayout={isVerticalLayout} />
                        )}
                    </ResizablePanel>

                    <ResizableHandle withHandle />

                    <ResizablePanel defaultSize={defaultLayout[1]} minSize={30} className="h-full overflow-y-auto">
                        <div className="flex flex-col h-full">
                            {filteredEvents.length > 0 && (
                                <EventDisplay 
                                    event={events.find((item) => item.id === event.selected) || null} 
                                    onBack={() => setEvent({ ...event, selected: null })} 
                                />
                            )}
                        </div>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>
        </TooltipProvider>
    )
}