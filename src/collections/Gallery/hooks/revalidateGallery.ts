import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidatePath } from 'next/cache'

import type { Gallery } from '../../../payload-types'

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

export const revalidateGallery: CollectionAfterChangeHook<Gallery> = async ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    await revalidateGalleryListing(payload)

    const path = `/gallery/${doc.slug}`

    payload.logger.info(`Revalidating gallery at path: ${path}`)

    revalidatePath(path)

    // If slug changed, revalidate the old path too.
    if (previousDoc?.slug && doc.slug !== previousDoc.slug) {
      const oldPath = `/gallery/${previousDoc.slug}`

      payload.logger.info(`Revalidating old gallery at path: ${oldPath}`)

      revalidatePath(oldPath)
    }
  }

  return doc
}

export const revalidateGalleryDelete: CollectionAfterDeleteHook<Gallery> = async ({
  doc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    await revalidateGalleryListing(payload)
    revalidatePath(`/gallery/${doc?.slug}`)
  }

  return doc
}
