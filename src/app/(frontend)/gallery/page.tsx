import type { Metadata } from 'next/types'

import { Pagination } from '@/components/Pagination'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { PageRange } from '@/components/PageRange'
import { CollectionArchive } from '@/components/CollectionArchive'

export const dynamic = 'force-static'
export const revalidate = 600

export default async function Page() {
    const payload = await getPayload({ config: configPromise })

    const galleries = await payload.find({
        collection: 'gallery',
        depth: 1,
        limit: 12,
        // overrideAccess: false,
        select: {
            title: true,
            slug: true,
            meta: true,
        },
    })

    // const galleries = await payload.find({
    //     collection: 'gallery'
    // })

    return (
        <div className="pb-24">

            <div className="container mb-16">
                <div className="prose dark:prose-invert max-w-none">
                    <h1>Galleries</h1>
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

            <CollectionArchive posts={galleries.docs} relationTo="gallery" />


            <div className="container">
                {galleries.totalPages > 1 && galleries.page && (
                    <Pagination page={galleries.page} totalPages={galleries.totalPages} basePath="/gallery" />
                )}
            </div>
        </div>
    )
}

export function generateMetadata(): Metadata {
    return {
        title: `Payload Website Template Galleries`,
    }
}
