import type { Block } from 'payload'

export const ShopFeaturedBlock: Block = {
    slug: 'shopFeaturedBlock',
    interfaceName: 'ShopFeaturedBlock',
    labels: {
        singular: 'Shop Featured',
        plural: 'Shop Featured',
    },
    admin: {
        disableBlockName: true,
    },
    fields: [
        {
            name: 'shopApiUrl',
            label: 'Shop API URL',
            type: 'text',
            required: true,
        },
    ],
}
