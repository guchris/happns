import { ComponentProps } from "react"
import { formatDistanceToNow } from "date-fns"

import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Event } from "@/app/data"
import { useEvent } from "@/app/use-event"

interface EventListProps {
    items: Event[]
}

export function EventList({ items }: EventListProps) {
    const [event, setEvent] = useEvent()

    return (
        <ScrollArea className="h-screen">
            <div className="flex flex-col gap-2 p-4 pt-4">
                {items.map((item) => (
                    <button
                        key={item.id}
                        className={cn(
                            "flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent",
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
                            {item.subject.substring(0, 300)}
                        </div>
                    </button>
                ))}
            </div>
        </ScrollArea>
    )
}