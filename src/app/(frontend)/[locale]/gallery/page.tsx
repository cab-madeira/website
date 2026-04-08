import type { Metadata } from 'next/types'

import { Pagination } from '@/components/Pagination'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { PageRange } from '@/components/PageRange'
import { CollectionArchive } from '@/components/CollectionArchive'
import { getTranslations } from 'next-intl/server'
import { normalizeLocale } from '@/i18n/routing'

export const dynamic = 'force-static'
export const revalidate = 600

type Args = {
    params: Promise<{
        locale?: string
    }>
}

export default async function Page({ params: paramsPromise }: Args) {
    const payload = await getPayload({ config: configPromise })
    const { locale: localeParam } = await paramsPromise
    const locale = normalizeLocale(localeParam)
    const t = await getTranslations({ locale, namespace: 'GalleryPage' })

    const galleries = await payload.find({
        collection: 'gallery',
        depth: 1,
        limit: 12,
        // overrideAccess: false,
        select: {
            title: true,
            slug: true,
            images: true,
            meta: true,
        },
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

    // const galleries = await payload.find({
    //     collection: 'gallery'
    // })

    return (
        <div className="pb-24">

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
                {galleries.totalPages > 1 && galleries.page && (
                    <Pagination page={galleries.page} totalPages={galleries.totalPages} basePath="/gallery" />
                )}
            </div>
        </div>
    )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
    const { locale: localeParam } = await paramsPromise
    const locale = normalizeLocale(localeParam)
    const t = await getTranslations({ locale, namespace: 'GalleryPage' })

    return {
        title: t('title'),
    }
}
