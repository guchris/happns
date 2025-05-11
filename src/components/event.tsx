"use client"

// React Imports
import * as React from "react"
import { useEffect, useState, useRef } from "react"
import { useSearchParams } from "next/navigation"

// App Imports
import { EventListView } from "@/components/event-list-view"
import { EventDisplay } from "@/components/event-display"
import { EventCalendarView } from "@/components/event-calendar-view"
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
import { CalendarIcon, MixerHorizontalIcon } from "@radix-ui/react-icons"
import { parse, format as formatDateFns, parseISO } from "date-fns"

interface EventProps {
    events: Event[]
    city: string
}

export function Event({ events, city }: EventProps) {
    const [event, setEvent] = useEvent()
    const defaultLayout = [50,50]
    const [currentDate, setCurrentDate] = useState<Date | null>(null)

    const { user } = useAuth();
    const [bookmarkedEventIds, setBookmarkedEventIds] = React.useState<string[]>([]);
    const [showBookmarkedEvents, setShowBookmarkedEvents] = React.useState(false);
    const [viewMode, setViewMode] = useState<"list" | "calendar">(
        typeof window !== "undefined" 
            ? localStorage.getItem("eventViewMode") as "list" | "calendar" || "list"
            : "list"
    );

    const [selectedCategories, setSelectedCategories] = useState<Option[]>([]);
    const selectedCategoryValues = selectedCategories.map(category => category.value);
    const searchParams = useSearchParams();
    const urlCategory = searchParams?.get("category") || "";

    const [selectedCosts, setSelectedCosts] = useState<Option[]>([]);
    const selectedCostValues = selectedCosts.map(cost => cost.value);

    const [startDate, setStartDate] = useState<Date | undefined>(new Date());
    const [endDate, setEndDate] = useState<Date | undefined>(undefined);
    const [hasSelectedStartDate, setHasSelectedStartDate] = useState(false);

    const [searchQuery, setSearchQuery] = useState("");

    const isFilterActive = selectedCategories.length > 0 || selectedCosts.length > 0 || searchQuery.length > 0 || showBookmarkedEvents;

    // Initialize currentDate from localStorage or default to today (with 1 hour expiration)
    useEffect(() => {
        if (!currentDate && typeof window !== "undefined") {
            const savedDate = localStorage.getItem("eventCurrentDate");
            const savedTimestamp = localStorage.getItem("eventCurrentDateTimestamp");
            const now = Date.now();
            if (savedDate && savedTimestamp) {
                const timestamp = parseInt(savedTimestamp, 10);
                // 1 hour = 3600000 ms
                if (!isNaN(timestamp) && now - timestamp <= 3600000) {
                    setCurrentDate(new Date(savedDate));
                    return;
                }
            }
            setCurrentDate(startDate || new Date());
        }
    }, [startDate, currentDate]);

    // Save currentDate to localStorage whenever it changes (with timestamp)
    useEffect(() => {
        if (currentDate && typeof window !== "undefined") {
            localStorage.setItem("eventCurrentDate", currentDate.toISOString());
            localStorage.setItem("eventCurrentDateTimestamp", Date.now().toString());
        }
    }, [currentDate]);

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

    useEffect(() => {
        if (typeof window !== "undefined") {
            localStorage.setItem("eventViewMode", viewMode)
        }
    }, [viewMode])

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

    const handleStartDateSelect = (date: Date | undefined) => {
        setStartDate(date);
        setHasSelectedStartDate(true);
    };

    return (
        <TooltipProvider delayDuration={0}>
            {/* Mobile View */}
            <div className="md:hidden">
                {!event.selected ? (
                    <div>
                        <div className="flex items-center gap-2 px-4 py-2">
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={`w-auto min-w-[44px] flex items-center justify-center p-0${isFilterActive ? " bg-secondary" : ""}`}
                                    >
                                        <MixerHorizontalIcon className="w-5 h-5" />
                                    </Button>
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
                                                            {hasSelectedStartDate && startDate ? formatDateFns(startDate, "MMM d, yyyy") : "Start Date"}
                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0">
                                                        <Calendar
                                                            mode="single"
                                                            selected={startDate}
                                                            onSelect={handleStartDateSelect}
                                                        />
                                                    </PopoverContent>
                                                </Popover>

                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            className="pl-3 text-left font-normal"
                                                        >
                                                            {endDate ? formatDateFns(endDate, "MMM d, yyyy") : "End Date"}
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
                            <Input
                                type="text"
                                placeholder="Search"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="flex-1"
                            />
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setViewMode(viewMode === "list" ? "calendar" : "list")}
                                className={viewMode === "calendar" ? "bg-secondary" : ""}
                            >
                                <CalendarIcon className="h-5 w-5" />
                            </Button>
                        </div>
                        <Separator />
                        {filteredEvents.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">no events</div>
                        ) : viewMode === "list" ? (
                            <EventListView
                                items={filteredEvents}
                                isFilterActive={isFilterActive}
                                startDate={startDate}
                            />
                        ) : currentDate ? (
                            <EventCalendarView
                                items={filteredEvents}
                                isFilterActive={isFilterActive}
                                startDate={startDate || new Date()}
                                currentDate={currentDate}
                                setCurrentDate={setCurrentDate}
                            />
                        ) : null}
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

                        {/* Search Input */}
                        <Input
                            type="text"
                            placeholder="Search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full"
                        />

                        {/* Start Date */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="pl-3 text-left font-normal w-full"
                                >
                                    {hasSelectedStartDate && startDate ? formatDateFns(startDate, "MMM d, yyyy") : "Start Date"}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={startDate}
                                    onSelect={handleStartDateSelect}
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
                                    {endDate ? formatDateFns(endDate, "MMM d, yyyy") : "End Date"}
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
                                <div className="flex justify-between items-center px-4 py-2">
                                    <p className="text-sm text-muted-foreground py-0.5">
                                        showing {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
                                    </p>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setViewMode(viewMode === "list" ? "calendar" : "list")}
                                        className={viewMode === "calendar" ? "bg-secondary" : ""}
                                    >
                                        <CalendarIcon className="h-5 w-5" />
                                    </Button>
                                </div>
                                <Separator />
                                {viewMode === "list" ? (
                                    <EventListView
                                        items={filteredEvents}
                                        isFilterActive={isFilterActive}
                                        startDate={startDate}
                                    />
                                ) : currentDate ? (
                                    <EventCalendarView
                                        items={filteredEvents}
                                        isFilterActive={isFilterActive}
                                        startDate={startDate || new Date()}
                                        currentDate={currentDate}
                                        setCurrentDate={setCurrentDate}
                                    />
                                ) : null}
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