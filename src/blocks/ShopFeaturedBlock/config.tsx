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
            name: 'apiField',
            label: 'API Variable',
            type: 'select',
            required: true,
            options: [
                {
                    label: 'Shop API URL',
                    value: 'shopAPI',
                },
            ],
        },
    ],
}
