import type { Metadata } from 'next'

import { PayloadRedirects } from '@/components/PayloadRedirects'
import configPromise from '@payload-config'
import { getPayload, type RequiredDataFromCollectionSlug } from 'payload'
import { draftMode } from 'next/headers'
import React, { cache } from 'react'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import { generateMeta } from '@/utilities/generateMeta'
import PageClient from './page.client'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { HeroBlock } from '@/blocks/Hero/Component'
import { SponsorsBlock } from '@/blocks/Sponsors/Component'
import { PayloadLocale, routing } from '@/i18n/routing'

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const pages = await payload.find({
    collection: 'pages',
    draft: false,
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    select: {
      slug: true,
    },
  })

  const params = pages.docs
    ?.filter((doc) => {
      return doc.slug !== 'home'
    })
    .map(({ slug }) => {
      return { slug }
    })

  return params
}

type Args = {
  params: Promise<{
    slug?: string,
    locale?: PayloadLocale
  }>
}

export default async function Page({ params: paramsPromise }: Args) {
  const { isEnabled: draft } = await draftMode()
  const { slug = 'home', locale = routing.defaultLocale } = await paramsPromise

  // Decode to support slugs with special characters
  const decodedSlug = decodeURIComponent(slug)
  const url = '/' + decodedSlug
  const page: RequiredDataFromCollectionSlug<'pages'> | null = await queryPageBySlug({
    slug: decodedSlug,
    locale
  })

  if (!page) {
    return <PayloadRedirects url={url} />
  }

  const { hero, contentLayout, sidebarLayout, sponsors } = page


  return (
    <article className="pb-24">
      <PageClient />
      {/* Allows redirects for valid pages too */}
      <PayloadRedirects disableNotFound url={url} />

      {draft && <LivePreviewListener />}
      {hero && hero.map((heroBlock, index) => (
        <div key={index}>
          <HeroBlock {...heroBlock} />
        </div>
      ))}
      {(contentLayout || sidebarLayout) && (
        <RenderBlocks
          contentBlocks={contentLayout}
          sidebarBlocks={sidebarLayout}
        />
      )}
      {sponsors && sponsors.map((sponsorBlock, index) => (
        <div key={index}>
          <SponsorsBlock {...sponsorBlock} />
        </div>
      ))}
    </article>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = 'home', locale = routing.defaultLocale } = await paramsPromise
  // Decode to support slugs with special characters
  const decodedSlug = decodeURIComponent(slug)
  const page = await queryPageBySlug({
    slug: decodedSlug,
    locale
  })

  return generateMeta({ doc: page })
}

const queryPageBySlug = cache(async ({ slug, locale }: { slug: string, locale: PayloadLocale }) => {
  const { isEnabled: draft } = await draftMode()

  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'pages',
    draft,
    limit: 1,
    locale,
    pagination: false,
    overrideAccess: draft,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  return result.docs?.[0] || null
})
