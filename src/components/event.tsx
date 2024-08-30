"use client"

import * as React from "react"
import {
    AlertCircle,
    File,
    Inbox,
    MessagesSquare,
    Search,
    Send,
    Users2,
} from "lucide-react"

import { cn } from "@/lib/utils"
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"
import { Separator } from "@/components/ui/separator"
import { TooltipProvider } from "@/components/ui/tooltip"

import { CalendarDateRangePicker } from "@/components/date-range-picker"
import { EventDisplay } from "@/components/event-display"
import { EventList } from "@/components/event-list"
import { Nav } from "@/components/event-nav"

import { useEvent } from "@/app/use-event"
import { type Event } from "@/app/data"

interface EventProps {
    events: Event[]
    defaultLayout: number[] | undefined
    defaultCollapsed?: boolean
    navCollapsedSize: number
}

export function Event({
    events,
    defaultLayout = [50, 50],
    defaultCollapsed = false,
    navCollapsedSize,
}: EventProps) {
    const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed)
    const [date, setDate] = React.useState<Date | undefined>(new Date())
    const [event] = useEvent()

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
                {/* <ResizablePanel
                    defaultSize={defaultLayout[0]}
                    collapsedSize={navCollapsedSize}
                    collapsible={true}
                    minSize={15}
                    maxSize={20}
                    onCollapse={() => {
                        setIsCollapsed(true)
                        document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(
                            true
                        )}`
                    }}
                    onResize={() => {
                        setIsCollapsed(false)
                        document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(
                            false
                        )}`
                    }}
                    className={cn(isCollapsed && "min-w-[50px] transition-all duration-300 ease-in-out")}
                >
                    <Nav
                        isCollapsed={isCollapsed}
                        links={[
                            {
                                title: "Inbox",
                                label: "128",
                                icon: Inbox,
                                variant: "default",
                            },
                            {
                                title: "Drafts",
                                label: "9",
                                icon: File,
                                variant: "ghost",
                            },
                            {
                                title: "Sent",
                                label: "",
                                icon: Send,
                                variant: "ghost",
                            }
                        ]}
                    />
                    <Separator />
                    <Nav
                        isCollapsed={isCollapsed}
                        links={[
                            {
                                title: "Social",
                                label: "972",
                                icon: Users2,
                                variant: "ghost",
                            },
                            {
                                title: "Updates",
                                label: "342",
                                icon: AlertCircle,
                                variant: "ghost",
                            },
                            {
                                title: "Forums",
                                label: "128",
                                icon: MessagesSquare,
                                variant: "ghost",
                            }
                        ]}
                    />
                </ResizablePanel>

                <ResizableHandle withHandle /> */}

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