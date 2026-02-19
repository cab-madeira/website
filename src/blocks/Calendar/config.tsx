import type { Block } from 'payload'

export const CalendarBlock: Block = {
    slug: 'calendarBlock',
    interfaceName: 'CalendarBlock',
    labels: {
        singular: 'Calendar',
        plural: 'Calendars',
    },
    fields: [
        {
            name: 'apiUrl',
            label: 'Calendar API URL',
            type: 'text',
            required: true,
            admin: {
                placeholder: 'https://example.com/api/calendar',
            },
        }
    ],
}
