import type { Block } from 'payload'

export const DiviserBlock: Block = {
  slug: 'diviserBlock',
  interfaceName: 'DiviserBlock',
  labels: {
    singular: 'Diviser',
    plural: 'Divisers',
  },
  admin: {
    disableBlockName: true,
  },
  fields: [],
}
