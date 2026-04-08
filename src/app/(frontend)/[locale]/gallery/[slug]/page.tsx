import type { Metadata } from 'next'

import { PayloadRedirects } from '@/components/PayloadRedirects'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { draftMode } from 'next/headers'
import React, { cache } from 'react'


import { generateMeta } from '@/utilities/generateMeta'
import PageClient from './page.client'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { GalleryLightbox, GalleryItem } from '@/components/GalleryLightbox'
import { Media } from '@/payload-types'


export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const galleries = await payload.find({
    collection: 'gallery',
    draft: false,
    limit: 1000,
    pagination: false,
    select: {
      slug: true,
    },
  })

  const params = galleries.docs.map(({ slug }) => {
    return { slug }
  })

  return params
}

type Args = {
  params: Promise<{
    slug?: string
  }>
}

export default async function GalleryPage({ params: paramsPromise }: Args) {
  const { isEnabled: draft } = await draftMode()
  const { slug = '' } = await paramsPromise
  // Decode to support slugs with special characters
  const decodedSlug = decodeURIComponent(slug)
  const url = '/gallery/' + decodedSlug
  const gallery = await queryGalleryBySlug({ slug: decodedSlug })

  if (!gallery) return <PayloadRedirects url={url} />

  const folderId = typeof gallery.images === 'number' ? gallery.images : gallery.images?.id

  if (!folderId) {
    return <PayloadRedirects url='/' />
  }

  const folderMedia = await queryMediaByFolderId({ folderId })

  const galleryItems: GalleryItem[] =
    folderMedia.flatMap((media) => {
      const imageUrl = media.url

      if (!imageUrl) return []

      return [
        {
          src: imageUrl,
          thumb: media.sizes?.thumbnail?.url || imageUrl,
          subHtml: media.alt || '',
        },
      ]
    }) || []

  return (
    <article className="pt-16 pb-16">
      <PageClient />

      {/* Allows redirects for valid pages too */}
      <PayloadRedirects disableNotFound url={url} />

      {draft && <LivePreviewListener />}

      <div className="container">
        <h1 className="text-4xl text-center font-bold mb-8">{gallery.title}</h1>

        <GalleryLightbox gallery={galleryItems} />
      </div>
    </article>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = '' } = await paramsPromise
  // Decode to support slugs with special characters
  const decodedSlug = decodeURIComponent(slug)
  const gallery = await queryGalleryBySlug({ slug: decodedSlug })

  return generateMeta({ doc: gallery })
}

const queryGalleryBySlug = cache(async ({ slug }: { slug: string }) => {
  const { isEnabled: draft } = await draftMode()

  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'gallery',
    depth: 1,
    draft,
    limit: 1,
    pagination: false,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  return result.docs?.[0] || null
})

const queryMediaByFolderId = cache(async ({ folderId }: { folderId: number }) => {
  const { isEnabled: draft } = await draftMode()
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'media',
    depth: 1,
    draft,
    limit: 1000,
    pagination: false,
    where: {
      folder: {
        equals: folderId,
      },
    },
  })

  return (result.docs || []) as Media[]
})
