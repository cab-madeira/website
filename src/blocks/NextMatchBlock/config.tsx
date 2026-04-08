import type { Block } from 'payload'

export const NextMatchBlock: Block = {
    slug: 'nextMatchBlock',
    interfaceName: 'NextMatchBlock',
    labels: {
        singular: 'Next Match',
        plural: 'Next Matches',
    },
    admin: {
        disableBlockName: true,
    },
    fields: [
        {
            name: 'maleApiUrl',
            label: 'Male Team Game Schedule API URL',
            type: 'text',
            required: true,
        },
        {
            name: 'femaleApiUrl',
            label: 'Female Team Game Schedule API URL',
            type: 'text',
            required: true,
        },
    ],
}
