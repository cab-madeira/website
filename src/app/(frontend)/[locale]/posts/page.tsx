import type { Metadata } from 'next/types'

import { CollectionArchive } from '@/components/CollectionArchive'
import { PageRange } from '@/components/PageRange'
import { Pagination } from '@/components/Pagination'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'
import PageClient from './page.client'
import { normalizeLocale, type PayloadLocale } from '@/i18n/routing'
import { getTranslations } from 'next-intl/server'

export const dynamic = 'force-static'
export const revalidate = 600

type Args = {
  params: Promise<{
    locale?: PayloadLocale
  }>
}


export default async function Page({ params: paramsPromise }: Args) {
  const payload = await getPayload({ config: configPromise })
  const { locale: localeParam = 'pt' } = await paramsPromise
  const locale = normalizeLocale(localeParam)
  const t = await getTranslations({ locale, namespace: 'PostsPage' })


  const posts = await payload.find({
    collection: 'posts',
    depth: 1,
    limit: 12,
    locale,
    overrideAccess: false,
    select: {
      title: true,
      slug: true,
      categories: true,
      meta: true,
    },
  })

  return (
    <div className="pb-24">
      <PageClient />
      <div className="container mb-16">
        <div className="prose dark:prose-invert max-w-none">
          <h1>{t('title')}</h1>
        </div>
      </div>

      <div className="container mb-8">
        <PageRange
          collection="posts"
          currentPage={posts.page}
          limit={12}
          totalDocs={posts.totalDocs}
        />
      </div>

      <CollectionArchive posts={posts.docs} />

      <div className="container">
        {posts.totalPages > 1 && posts.page && (
          <Pagination page={posts.page} totalPages={posts.totalPages} basePath="/posts" />
        )}
      </div>
    </div>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { locale: localeParam = 'pt' } = await paramsPromise
  const locale = normalizeLocale(localeParam)
  const t = await getTranslations({ locale, namespace: 'PostsPage' })

  return {
    title: t('title'),
  }
}
