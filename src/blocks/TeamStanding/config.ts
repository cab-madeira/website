import type { Block } from 'payload'

export const TeamStandingsBlock: Block = {
  slug: 'teamStandingsBlock',
  interfaceName: 'TeamStandingsBlock',
  labels: {
    singular: 'Team Standings',
    plural: 'Team Standings',
  },
  admin: {
    disableBlockName: true,
  },
  fields: [
    {
      name: 'maleApiUrl',
      label: 'Male Team Standings API URL',
      type: 'text',
      required: true,
      admin: {
        placeholder: 'https://example.com/api/standings?gender=male',
      },
    },
    {
      name: 'femaleApiUrl',
      label: 'Female Team Standings API URL',
      type: 'text',
      required: true,
      admin: {
        placeholder: 'https://example.com/api/standings?gender=female',
      },
    },
  ],
}
