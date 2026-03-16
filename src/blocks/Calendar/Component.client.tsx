"use client"

import * as React from "react"
import { format } from "date-fns"
import {
    DayButton,
    getDefaultClassNames,
    useDayPicker,
} from "react-day-picker"

import { Calendar } from "@/components/ui/calendar"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/utilities/ui"
import { ChevronLeftCircle, ChevronRightCircle } from "lucide-react"

type CalendarEvent = {
    id: string
    title: string
    start: string
    end?: string | null
    description?: string
    location?: string
    allDay?: boolean
}

interface CalendarWithEventsProps {
    events: CalendarEvent[]
}

/* -------------------- CUSTOM HEADER -------------------- */

function CustomMonthCaption() {
    const { months, goToMonth, previousMonth, nextMonth } = useDayPicker()
    const displayMonth = months[0].date

    return (
        <div className="w-full rounded-lg overflow-hidden ">
            {/* Header */}
            <div
                className="relative flex font-semibold text-sm"
                style={{
                    backgroundColor: 'hsl(var(--primary))',
                    color: 'hsl(var(--primary-foreground))',
                }
                }
            >
                <div className="flex items-center justify-between flex-1 px-4 py-3">
                    <div className="flex items-center gap-1">

                        <button
                            type="button"
                            className="p-1 rounded hover:bg-white/10"
                            disabled={!previousMonth}
                            onClick={() => previousMonth && goToMonth(previousMonth)}
                        >
                            <ChevronLeftCircle size={22} />
                        </button>

                        <button
                            type="button"
                            className="p-1 rounded hover:bg-white/10"
                            disabled={!nextMonth}
                            onClick={() => nextMonth && goToMonth(nextMonth)}
                        >
                            <ChevronRightCircle size={22} />
                        </button>
                    </div>
                    <div className="whitespace-nowrap text-right">
                        {displayMonth.toLocaleString("default", {
                            month: "long",
                            year: "numeric",
                        })}
                    </div>

                </div>

                <div
                    className="w-16 -skew-x-12 translate-x-3 z-60"
                    style={{ backgroundColor: 'hsl(var(--yellow))' }}
                />
            </div >
        </div >

    )
}

/* -------------------- CUSTOM DAY BUTTON -------------------- */

const CustomDayButton = React.forwardRef<
    HTMLButtonElement,
    React.ComponentProps<typeof DayButton> & {
        eventsData?: Record<string, CalendarEvent[]>
        onEventClick?: (date: Date) => void
    }
>(({ className, day, eventsData, onEventClick, ...props }, ref) => {
    const defaultClassNames = getDefaultClassNames()
    const dateKey = format(day.date, "yyyy-MM-dd")
    const dayEvents = eventsData?.[dateKey] || []
    const hasEvents = dayEvents.length > 0

    return (
        <div className="relative flex min-h-[56px] w-full flex-col items-center gap-1.5">
            <button
                ref={ref}
                className={cn(
                    "flex aspect-square h-12 w-full min-w-[48px] items-center justify-center rounded-md bg-secondary text-secondary-foreground text-sm hover:bg-primary hover:text-primary-foreground ]",
                    defaultClassNames.day,
                    className
                )}
                {...props}
            >
                {day.date.getDate()}
            </button>

            {hasEvents && (
                <div
                    onClick={(e) => {
                        e.stopPropagation()
                        onEventClick?.(day.date)
                    }}
                    className="absolute bottom-3 flex gap-1"
                >
                    {dayEvents.slice(0, 3).map((_, i) => (
                        <div
                            key={i}
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: "hsl(var(--yellow))" }}
                        />
                    ))}
                </div>
            )}
        </div>
    )
})

CustomDayButton.displayName = "CustomDayButton"

/* -------------------- MAIN COMPONENT -------------------- */

export function CalendarWithEvents({
    events,
}: CalendarWithEventsProps) {
    const [currentMonth, setCurrentMonth] = React.useState(new Date())
    const [selectedDate, setSelectedDate] = React.useState<Date | null>(null)
    const [isDialogOpen, setIsDialogOpen] = React.useState(false)

    const eventsByDate = React.useMemo(() => {
        const map: Record<string, CalendarEvent[]> = {}

        events.forEach((event) => {
            const date = new Date(event.start)
            const key = format(date, "yyyy-MM-dd")

            if (!map[key]) map[key] = []
            map[key].push(event)
        })

        return map
    }, [events])

    const handleDateSelect = (date: Date | undefined) => {
        if (!date) return

        const key = format(date, "yyyy-MM-dd")
        if (eventsByDate[key]?.length) {
            setSelectedDate(date)
            setIsDialogOpen(true)
        }
    }

    const selectedDateKey = selectedDate
        ? format(selectedDate, "yyyy-MM-dd")
        : null

    const selectedDateEvents = selectedDateKey
        ? eventsByDate[selectedDateKey] || []
        : []

    return (
        <div className="flex flex-col gap-6 w-full">

            <h2 className="text-2xl font-bold text-center text-[hsl(var(--primary))]">
                Calendar
            </h2>

            <div className="w-full shadow-md rounded-lg border" style={{ borderColor: 'hsl(var(--border))' }}>
                <Calendar
                    mode="single"
                    month={currentMonth}
                    onMonthChange={setCurrentMonth}
                    onSelect={handleDateSelect}
                    className="w-full p-0 m-0 bg-secondary [--cell-size:48px]"
                    components={{
                        MonthCaption: CustomMonthCaption,
                        DayButton: (props) => (
                            <CustomDayButton
                                {...props}
                                eventsData={eventsByDate}
                                onEventClick={(date) => {
                                    setSelectedDate(date)
                                    setIsDialogOpen(true)
                                }}
                            />
                        ),
                    }}
                />
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedDate
                                ? format(selectedDate, "EEEE, MMMM d, yyyy")
                                : "Events"}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedDateEvents.length} event
                            {selectedDateEvents.length !== 1 ? "s" : ""}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {selectedDateEvents.map((event) => (
                            <div key={event.id} className="space-y-2 rounded-lg border p-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold">{event.title}</h3>
                                    <span className="text-muted-foreground text-sm">
                                        {event.allDay
                                            ? "All Day"
                                            : `${format(new Date(event.start), "HH:mm")}${event.end
                                                ? ` - ${format(new Date(event.end), "HH:mm")}`
                                                : ""
                                            }`}
                                    </span>
                                </div>

                                {event.description && (
                                    <p className="text-muted-foreground text-sm">
                                        {event.description}
                                    </p>
                                )}

                                {event.location && (
                                    <p className="text-muted-foreground text-xs">
                                        {event.location}
                                    </p>
                                )}
                            </div>
                        ))}

                        {selectedDateEvents.length === 0 && (
                            <p className="text-muted-foreground text-center text-sm">
                                No events scheduled.
                            </p>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )

}
