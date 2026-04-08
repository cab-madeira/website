import type { Metadata } from 'next/types'

import { CollectionArchive } from '@/components/CollectionArchive'
import { PageRange } from '@/components/PageRange'
import { Pagination } from '@/components/Pagination'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import PageClient from './page.client'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { normalizeLocale } from '@/i18n/routing'

export const revalidate = 600

type Args = {
  params: Promise<{
    locale?: string
    pageNumber: string
  }>
}

export default async function Page({ params: paramsPromise }: Args) {
  const { locale: localeParam, pageNumber } = await paramsPromise
  const payload = await getPayload({ config: configPromise })
  const locale = normalizeLocale(localeParam)
  const t = await getTranslations({ locale, namespace: 'GalleryPage' })

  const sanitizedPageNumber = Number(pageNumber)

  if (!Number.isInteger(sanitizedPageNumber)) notFound()

  const galleries = await payload.find({
    collection: 'gallery',
    depth: 1,
    limit: 12,
    page: sanitizedPageNumber,
  })

  const galleriesWithFirstImage = await Promise.all(
    galleries.docs.map(async (gallery) => {
      const folderId = typeof gallery.images === 'number' ? gallery.images : gallery.images?.id

      if (!folderId) return gallery

      const folderMedia = await payload.find({
        collection: 'media',
        depth: 0,
        limit: 1,
        sort: 'createdAt',
        where: {
          folder: {
            equals: folderId,
          },
        },
      })

      return {
        ...gallery,
        meta: {
          ...gallery.meta,
          image: folderMedia.docs?.[0] || gallery.meta?.image,
        },
      }
    }),
  )

  return (
    <div className="pt-24 pb-24">
      <PageClient />
      <div className="container mb-16">
        <div className="prose dark:prose-invert max-w-none">
          <h1>{t('title')}</h1>
        </div>
      </div>

      <div className="container mb-8">
        <PageRange
          collection="gallery"
          currentPage={galleries.page}
          limit={12}
          totalDocs={galleries.totalDocs}
        />
      </div>

      <CollectionArchive posts={galleriesWithFirstImage} relationTo="gallery" />

      <div className="container">
        {galleries?.page && galleries?.totalPages > 1 && (
          <Pagination page={galleries.page} totalPages={galleries.totalPages} basePath="/gallery" />
        )}
      </div>
    </div>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { locale: localeParam, pageNumber } = await paramsPromise
  const locale = normalizeLocale(localeParam)
  const t = await getTranslations({ locale, namespace: 'GalleryPage' })
  return {
    title: `${t('title')} ${pageNumber || ''}`,
  }
}

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const { totalDocs } = await payload.count({
    collection: 'gallery',
  })

  const totalPages = Math.ceil(totalDocs / 12)

  const pages: { pageNumber: string }[] = []

  for (let i = 1; i <= totalPages; i++) {
    pages.push({ pageNumber: String(i) })
  }

  return pages
}
