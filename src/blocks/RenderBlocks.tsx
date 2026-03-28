import React, { Fragment } from 'react'

import type { Page } from '@/payload-types'

import { ArchiveBlock } from '@/blocks/ArchiveBlock/Component'
import { CallToActionBlock } from '@/blocks/CallToAction/Component'
import { ContentBlock } from '@/blocks/Content/Component'
import { FormBlock } from '@/blocks/Form/Component'
import { MediaBlock } from '@/blocks/MediaBlock/Component'
import { TeamStandingsBlock } from '@/blocks/TeamStanding/Component'
import { CalendarBlock } from './Calendar/Component'
import { NextMatchBlock } from './NextMatchBlock/Component'
import { DiviserBlock } from './Diviser/Component'
import { ShopFeaturedBlock } from './ShopFeaturedBlock/Component'
import { GalleryBlock } from './GalleryBlock/Component'

const contentBlockComponents = {
  archive: ArchiveBlock,
  content: ContentBlock,
  cta: CallToActionBlock,
  formBlock: FormBlock,
  mediaBlock: MediaBlock,
  diviserBlock: DiviserBlock,
  shopFeaturedBlock: ShopFeaturedBlock,
  galleryBlock: GalleryBlock
}

const sidebarBlockComponents = {
  teamStandingsBlock: TeamStandingsBlock,
  nextMatchBlock: NextMatchBlock,
  calendarBlock: CalendarBlock,
  formBlock: FormBlock,
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
        <div
          className={`grid grid-cols-1 gap-4 ${hasSidebarBlocks ? 'lg:grid-cols-3 lg:gap-8' : ''
            }`}
        >
          {/* Content layout */}
          <div className={hasSidebarBlocks ? 'lg:col-span-2' : 'lg:col-span-3'}>
            {hasContentBlocks &&
              contentBlocks.map((block, index) => {
                const { blockType } = block

                if (blockType && blockType in contentBlockComponents) {
                  const Block = contentBlockComponents[blockType]

                  if (Block) {
                    return (
                      <div className="my-16" key={index}>
                        {/* @ts-expect-error */}
                        <Block {...block} disableInnerContainer />
                      </div>
                    )
                  }
                }
                return null
              })}
          </div>

          {/* Sidebar layout */}
          {hasSidebarBlocks && (
            <>
              <div className="my-3 flex items-center gap-3 sm:my-4 lg:hidden" aria-hidden="true">
                <span className="h-px flex-1 bg-[hsl(var(--primary))] opacity-30" />
                <span className="h-2.5 w-2.5 rounded-full border border-[hsl(var(--primary))] bg-[hsl(var(--background))]" />
                <span className="h-px flex-1 bg-[hsl(var(--primary))] opacity-30" />
              </div>
              <div className="lg:col-span-1">
                {sidebarBlocks.map((block, index) => {
                  const { blockType } = block as {
                    blockType?: keyof typeof sidebarBlockComponents
                  }

                  if (blockType && blockType in sidebarBlockComponents) {
                    const Block = sidebarBlockComponents[blockType]

                    if (Block) {
                      return (
                        <div className="my-16" key={index}>
                          {/* @ts-expect-error */}
                          <Block {...block} disableInnerContainer />
                        </div>
                      )
                    }
                  }
                  return null
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </Fragment>
  )
}
