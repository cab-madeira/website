import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidatePath } from 'next/cache'

import type { Media } from '../../../payload-types'

const getFolderId = (folder: Media['folder'] | null | undefined): number | null => {
  if (!folder) return null
  return typeof folder === 'number' ? folder : folder.id
}

const GALLERY_PAGE_SIZE = 12

const revalidateGalleryListing = async (payload: any) => {
  const { totalDocs } = await payload.count({
    collection: 'gallery',
  })

  const totalPages = Math.max(1, Math.ceil(totalDocs / GALLERY_PAGE_SIZE))

  revalidatePath('/gallery')
  revalidatePath('/')

  for (let page = 1; page <= totalPages; page++) {
    revalidatePath(`/gallery/page/${page}`)
  }
}

const revalidateRelatedGalleries = async ({
  payload,
  folderIds,
}: {
  payload: any
  folderIds: number[]
}) => {
  if (folderIds.length === 0) return

  await revalidateGalleryListing(payload)

  for (const folderId of folderIds) {
    const galleries = await payload.find({
      collection: 'gallery',
      limit: 1000,
      pagination: false,
      select: {
        slug: true,
      },
      where: {
        images: {
          equals: folderId,
        },
      },
    })

    for (const gallery of galleries.docs) {
      if (!gallery.slug) continue
      revalidatePath(`/gallery/${gallery.slug}`)
    }
  }
}

export const revalidateGalleryFromMediaChange: CollectionAfterChangeHook<Media> = async ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    const currentFolderId = getFolderId(doc.folder)
    const previousFolderId = getFolderId(previousDoc?.folder)

    const folderIds = Array.from(
      new Set([currentFolderId, previousFolderId].filter(Boolean)),
    ) as number[]

    await revalidateRelatedGalleries({ payload, folderIds })
  }

  return doc
}

export const revalidateGalleryFromMediaDelete: CollectionAfterDeleteHook<Media> = async ({
  doc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    const folderId = getFolderId(doc?.folder)
    const folderIds = folderId ? [folderId] : []

    await revalidateRelatedGalleries({ payload, folderIds })
  }

  return doc
}
