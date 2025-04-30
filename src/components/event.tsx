"use client"

// React Imports
import * as React from "react"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"

// App Imports
import { EventList } from "@/components/event-list"
import { EventDisplay } from "@/components/event-display"
import MultiSelect, { Option } from '@/components/multi-select'
import { useEvent } from "@/hooks/use-event"
import { type Event } from "@/components/types"
import { categoryOptions, costOptions } from "@/lib/selectOptions"

// Firebase Imports
import { db } from "@/lib/firebase"
import { collection, getDocs } from "firebase/firestore"
import { useAuth } from "@/context/AuthContext"

// Shadcn Imports
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Switch } from "@/components/ui/switch"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet"

// Other Imports
import { CalendarIcon, SectionIcon, ContainerIcon } from "@radix-ui/react-icons"
import { parseISO, format } from "date-fns"

interface EventProps {
    events: Event[]
    city: string
}

export function Event({ events, city }: EventProps) {
    const [event, setEvent] = useEvent()
    const defaultLayout = [50,50]

    const { user } = useAuth();
    const [bookmarkedEventIds, setBookmarkedEventIds] = React.useState<string[]>([]);
    const [showBookmarkedEvents, setShowBookmarkedEvents] = React.useState(false);

    const [selectedCategories, setSelectedCategories] = useState<Option[]>([]);
    const selectedCategoryValues = selectedCategories.map(category => category.value);
    const searchParams = useSearchParams();
    const urlCategory = searchParams?.get("category") || "";

    const [selectedCosts, setSelectedCosts] = useState<Option[]>([]);
    const selectedCostValues = selectedCosts.map(cost => cost.value);

    const [startDate, setStartDate] = useState<Date | undefined>(new Date());
    const [endDate, setEndDate] = useState<Date | undefined>(undefined);

    const [searchQuery, setSearchQuery] = useState("");

    const isFilterActive = selectedCategories.length > 0 || selectedCosts.length > 0 || searchQuery.length > 0 || showBookmarkedEvents;

    useEffect(() => {
        if (urlCategory) {
            const categoryOption = categoryOptions.find(option => option.value === urlCategory);
            if (categoryOption) {
                setSelectedCategories([categoryOption]);
            }
        }
    }, [urlCategory])

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
    }, [user])

    useEffect(() => {
        setEvent((prevEvent) => ({
            ...prevEvent,
            selected: null,
        }))
    }, [setEvent])

    const isEventInRange = (eventStart: Date, eventEnd: Date, rangeStart: Date, rangeEnd?: Date) => {
        const effectiveRangeEnd = rangeEnd || new Date(9999, 11, 31);
        const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });

        const eventStartDate = eventStart.toISOString().split('T')[0];
        const eventEndDate = eventEnd.toISOString().split('T')[0];
        const rangeStartDate = rangeStart.toISOString().split('T')[0];
        const effectiveRangeEndDate = effectiveRangeEnd.toISOString().split('T')[0];
        
        return (
            (eventStartDate <= effectiveRangeEndDate && eventEndDate >= rangeStartDate) ||
            eventEndDate === today
        );
    };
    
    // Filtered events based on selected filters
    const filteredEvents = events.filter((e) => {
        const eventStart = parseISO(e.startDate);
        const eventEnd = parseISO(e.endDate);
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

        const isCategoryMatch = selectedCategoryValues.length === 0 || 
        selectedCategoryValues.some(selectedCategory => e.category.includes(selectedCategory));

        
        const isSearchMatch = e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              e.details.toLowerCase().includes(searchQuery.toLowerCase());
    

        return (
            (!startDate || isInDateRange) &&
            isCategoryMatch &&
            isCostMatch &&
            shouldShowEvent &&
            isSearchMatch
        )
    })

    const handleClearAll = () => {
        setSelectedCategories([])
        setSelectedCosts([])
        setStartDate(new Date())
        setEndDate(undefined)
        setSearchQuery("")
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

                                            {/* Bookmarks Toogle */}
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

                                            {/* Search Input */}
                                            <Input
                                                type="text"
                                                placeholder="Search"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-full"
                                            />

                                            {/* Category MultiSelect */}
                                            <MultiSelect
                                                options={categoryOptions}
                                                value={selectedCategories}
                                                onChange={setSelectedCategories}
                                                placeholder="Category"
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
                        </div>
                        <Separator />
                        {filteredEvents.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">no events</div>
                        ) : (
                            <EventList
                                items={filteredEvents}
                                isFilterActive={isFilterActive}
                                startDate={startDate}
                            />
                        )}
                    </div>
                ) : (
                    <EventDisplay 
                        event={events.find((item) => item.id === event.selected) || null} 
                    />
                )}
            </div>

            {/* Desktop View */}
            <div className="hidden md:flex h-full items-stretch">

                {/* Filters Section */}
                <div className="min-w-[250px] max-w-[250px] p-4 space-y-4">
                    <form className="space-y-4">

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

                        {/* Search Input */}
                        <Input
                            type="text"
                            placeholder="Search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full"
                        />

                        {/* Category MultiSelect */}
                        <MultiSelect
                            options={categoryOptions}
                            value={selectedCategories}
                            onChange={setSelectedCategories}
                            placeholder="Category"
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
                    }}
                    className="h-full items-stretch"
                >
                    <ResizablePanel defaultSize={defaultLayout[0]} minSize={30} className="h-full overflow-y-auto">
                        {filteredEvents.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">No events</div>
                        ) : (
                            <div className="flex flex-col h-full">
                                <div className="flex justify-between items-center p-4">
                                    <p className="text-sm text-muted-foreground py-0.5">
                                        showing {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
                                    </p>
                                </div>
                                <Separator />
                                <EventList
                                    items={filteredEvents}
                                    isFilterActive={isFilterActive}
                                    startDate={startDate}
                                />
                            </div>
                        )}
                    </ResizablePanel>

                    <ResizableHandle withHandle />

                    <ResizablePanel defaultSize={defaultLayout[1]} minSize={30} className="h-full overflow-y-auto">
                        <div className="flex flex-col h-full">
                            {filteredEvents.length > 0 && (
                                <EventDisplay 
                                    event={events.find((item) => item.id === event.selected) || null} 
                                />
                            )}
                        </div>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>
        </TooltipProvider>
    )
}