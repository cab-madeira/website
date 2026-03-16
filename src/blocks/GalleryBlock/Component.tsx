import type { GalleryBlock as GalleryProps } from '@/payload-types'
import { getPayload } from 'payload'
import React from 'react'
import configPromise from '@payload-config'
import { GalleryFeatured } from './Component.client'

type GalleryThumbnail = {
    title: string
    galleryUrl: string
    imageUrl: string | null
}

export const GalleryBlock: React.FC<GalleryProps & {
    id?: string
}> = async (props) => {
    const payload = await getPayload({ config: configPromise })

    const fetchedGalleries = await payload.find({
        collection: 'gallery',
        depth: 1,
        limit: 6,
        sort: '-publishedAt',
    })

    const galleryThumbnails: GalleryThumbnail[] = await Promise.all(
        fetchedGalleries.docs.map(async (gallery) => {
            const folderId = typeof gallery.images === 'number' ? gallery.images : gallery.images?.id
            let imageUrl: string | null = null

            if (folderId) {
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

                imageUrl = folderMedia.docs?.[0]?.url || null
            }

            return {
                title: gallery.title,
                galleryUrl: gallery.slug,
                imageUrl,
            }
        }),
    )

    return <GalleryFeatured galleryThumbnails={galleryThumbnails} />
}