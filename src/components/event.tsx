"use client"

import * as React from "react"

import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"
import { TooltipProvider } from "@/components/ui/tooltip"

import { CalendarDateRangePicker } from "@/components/date-range-picker"
import { EventDisplay } from "@/components/event-display"
import { EventList } from "@/components/event-list"

import { useEvent } from "@/app/use-event"
import { type Event } from "@/app/data"

interface EventProps {
    events: Event[]
}

export function Event({
    events
}: EventProps) {
    const [event] = useEvent()
    const defaultLayout = [50, 50]

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
                <ResizablePanel defaultSize={defaultLayout[0]} minSize={30} className="h-full overflow-y-auto">
                    <div className="p-4">
                        <form>
                            <div className="relative">
                                <CalendarDateRangePicker />
                            </div>
                        </form>
                    </div>
                    <EventList items={events} />
                </ResizablePanel>

                <ResizableHandle withHandle />

                <ResizablePanel defaultSize={defaultLayout[1]} minSize={30} className="h-full overflow-y-auto">
                    <EventDisplay event={events.find((item) => item.id === event.selected) || null} />
                </ResizablePanel>
            </ResizablePanelGroup>
        </TooltipProvider>
    )
}