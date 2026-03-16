import type { Block } from 'payload'

export const Archive: Block = {
  slug: 'archive',
  interfaceName: 'ArchiveBlock',
  labels: {
    plural: 'Archives',
    singular: 'Archive',
  },
  admin: {
    disableBlockName: true,
  },
  fields: [
    {
      name: 'Description',
      type: 'text',
      admin: {
        readOnly: true,
      },
      defaultValue: 'Display a list of recent posts from the archive.',
    },
  ],
}
