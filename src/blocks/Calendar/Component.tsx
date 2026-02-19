import type { CalendarBlock as CalendarBlockProps } from '@/payload-types'
import { CalendarWithEvents } from './Component.client'
import { fetchUtil } from '@/utilities/fetchUtil'
import ICAL from 'ical.js'

export const CalendarBlock: React.FC<CalendarBlockProps> = async ({
    apiUrl,
}) => {
    const res = await fetchUtil(apiUrl, {
        next: { revalidate: 3600 },
    })

    const icsText = typeof res === 'string' ? res : await res.text()

    const jcalData = ICAL.parse(icsText)
    const comp = new ICAL.Component(jcalData)
    const vevents = comp.getAllSubcomponents('vevent')

    const events = vevents.map((vevent) => {
        const event = new ICAL.Event(vevent)

        return {
            id: event.uid,
            title: event.summary,
            start: event.startDate?.toJSDate().toISOString(),
            end: event.endDate?.toJSDate().toISOString() ?? null,
            description: event.description ?? '',
            location: event.location ?? '',
            allDay: event.startDate?.isDate ?? false,
        }
    })

    return <CalendarWithEvents events={events} />
}
