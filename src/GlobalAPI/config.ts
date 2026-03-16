import type { GlobalConfig } from 'payload'

export const GlobalAPI: GlobalConfig = {
  slug: 'globalAPI',
  label: 'Global API Variables',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'shopAPI',
      type: 'text',
      label: 'Shop API URL',
      required: true,
    },
  ],
}
