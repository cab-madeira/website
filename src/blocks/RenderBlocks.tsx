import React, { Fragment } from 'react'

import type { Page } from '@/payload-types'

import { ArchiveBlock } from '@/blocks/ArchiveBlock/Component'
import { CallToActionBlock } from '@/blocks/CallToAction/Component'
import { ContentBlock } from '@/blocks/Content/Component'
import { FormBlock } from '@/blocks/Form/Component'
import { MediaBlock } from '@/blocks/MediaBlock/Component'
import { TeamStandingsBlock } from '@/blocks/TeamStanding/Component'
import { CalendarBlock } from './Calendar/Component'

const contentBlockComponents = {
  archive: ArchiveBlock,
  content: ContentBlock,
  cta: CallToActionBlock,
  formBlock: FormBlock,
  mediaBlock: MediaBlock,
  calendarBlock: CalendarBlock
}

const sidebarBlockComponents = {
  teamStandingsBlock: TeamStandingsBlock,
}

export const RenderBlocks: React.FC<{
  contentBlocks: Page['contentLayout']
  sidebarBlocks: Page['sidebarLayout']
}> = (props) => {
  const { contentBlocks, sidebarBlocks } = props

  const hasContentBlocks =
    contentBlocks && Array.isArray(contentBlocks) && contentBlocks.length > 0
  const hasSidebarBlocks =
    sidebarBlocks && Array.isArray(sidebarBlocks) && sidebarBlocks.length > 0

  if (!hasContentBlocks && !hasSidebarBlocks) return null

  return (
    <Fragment>
      <div className="container">

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-8">
          {/* Left side: content layout */}
          <div className="lg:col-span-2">
            {hasContentBlocks &&
              contentBlocks.map((block, index) => {
                const { blockType } = block

                if (blockType && blockType in contentBlockComponents) {
                  const Block = contentBlockComponents[blockType]

                  if (Block) {
                    return (
                      <div className="my-16" key={index}>
                        {/* @ts-expect-error there may be some mismatch between the expected types here */}
                        <Block {...block} disableInnerContainer />
                      </div>
                    )
                  }
                }
                return null
              })}
          </div>

          {/* Right side: sidebar layout */}
          <div className="lg:col-span-1">
            {hasSidebarBlocks &&
              sidebarBlocks.map((block, index) => {
                const { blockType } = block as { blockType?: keyof typeof sidebarBlockComponents }

                if (blockType && blockType in sidebarBlockComponents) {
                  const Block = sidebarBlockComponents[blockType]

                  if (Block) {
                    return (
                      <div className="my-16" key={index}>
                        {/* @ts-expect-error there may be some mismatch between the expected types here */}
                        <Block {...block} disableInnerContainer />
                      </div>
                    )
                  }
                }
                return null
              })}
          </div>
        </div>
      </div>
    </Fragment>
  )
}
