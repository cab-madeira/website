import { cn } from '@/utilities/ui'
import React from 'react'

import { Card, CardPostData } from '@/components/Card'
import type { FolderInterface, Media } from '@/payload-types'

type GalleryCardData = {
  slug: string
  title: string
  meta?: {
    image?: (number | null) | Media
    description?: string | null
  } | null
  images?: (number | null) | FolderInterface
}

type ArchiveItem = CardPostData | GalleryCardData

const getFirstGalleryImage = (doc: GalleryCardData): Media | undefined => {
  if (!doc.images || typeof doc.images !== 'object') return undefined

  const folderDocs = doc.images.documentsAndFolders?.docs

  if (!Array.isArray(folderDocs)) return undefined

  const firstMediaDoc = folderDocs.find(
    (entry) => entry?.relationTo === 'media' && typeof entry.value === 'object' && entry.value !== null,
  )

  if (!firstMediaDoc || typeof firstMediaDoc.value !== 'object' || firstMediaDoc.value === null) {
    return undefined
  }

  return firstMediaDoc.value as Media
}

export type Props = {
  posts: ArchiveItem[]
  relationTo?: 'posts' | 'gallery' | 'media'
}

export const CollectionArchive: React.FC<Props> = (props) => {
  const { posts, relationTo = 'posts' } = props

  return (
    <div className={cn('container')}>
      <div>
        <div className="grid grid-cols-4 sm:grid-cols-8 lg:grid-cols-12 gap-y-4 gap-x-4 lg:gap-y-8 lg:gap-x-8 xl:gap-x-8">
          {posts?.map((result, index) => {
            if (typeof result === 'object' && result !== null) {
              const cardDoc: CardPostData =
                relationTo === 'gallery'
                  ? {
                    ...(result as GalleryCardData),
                    meta: {
                      ...(result as GalleryCardData).meta,
                      image:
                        getFirstGalleryImage(result as GalleryCardData) ||
                        (result as GalleryCardData).meta?.image,
                    },
                  }
                  : (result as CardPostData)

              return (
                <div className="col-span-4" key={index}>
                  <Card
                    className="h-full"
                    doc={cardDoc}
                    relationTo={relationTo}
                  />
                </div>
              )
            }

            return null
          })}
        </div>
      </div>
    </div>
  )
}
