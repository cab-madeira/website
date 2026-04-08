import type { Post, ArchiveBlock as ArchiveBlockProps } from '@/payload-types'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'

import { Media } from '@/components/Media'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

import { useTranslations } from 'next-intl'


export const ArchiveBlock: React.FC<
  ArchiveBlockProps & {
    id?: string
  }
> = async (props) => {
  const t = useTranslations('ArchiveBlock')

  const { id } = props

  const payload = await getPayload({ config: configPromise })

  const fetchedPosts = await payload.find({
    collection: 'posts',
    depth: 1,
    limit: 3,
    sort: '-publishedAt',
  })

  const posts = fetchedPosts.docs

  if (!posts?.length) return null

  const [firstPost, ...otherPosts] = posts

  return (
    <section id={`block-${id}`}>
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-6 px-4">
        {/* Reusable title */}
        <h2 className="text-2xl font-bold text-center text-[hsl(var(--primary))]">{t('title')}</h2>


        <div className="grid w-full grid-cols-1 md:grid-cols-2 gap-6 justify-items-center">
          {/* First Post - Full Width */}
          <a
            href={`/posts/${firstPost.slug}`}
            className="group border md:col-span-2 w-full max-w-[760px] rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition duration-300"
            style={{ backgroundColor: 'hsl(var(--secondary))' }}
          >
            {firstPost?.meta?.image && typeof firstPost.meta.image === 'object' && (
              <div className="relative h-[280px] w-full overflow-hidden">
                <Media
                  fill
                  imgClassName="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  resource={firstPost.meta.image}
                />
              </div>
            )}

            <div className="p-6">
              {/* Date: same on small and medium, bigger on large */}
              <p className="text-sm lg:text-md mb-2">
                {firstPost.publishedAt && new Date(firstPost.publishedAt).toLocaleDateString()}
              </p>

              {/* Title: same on small/medium, larger on large screens */}
              <h3 className="text-xl lg:text-2xl font-semibold text-[hsl(var(--primary))] group-hover:underline">
                {firstPost.title}
              </h3>
            </div>
          </a>

          {/* Second Row - Two Posts */}
          {otherPosts.map((post: Post) => (
            <a
              key={post.id}
              href={`/posts/${post.slug}`}
              className="group border w-full max-w-[360px] rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition duration-300"
              style={{ backgroundColor: 'hsl(var(--secondary))' }}

            >
              {post?.meta?.image && typeof post.meta.image === 'object' && (
                <div className="relative h-[180px] w-full overflow-hidden">
                  <Media
                    fill
                    imgClassName="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    resource={post.meta.image}
                  />
                </div>
              )}

              <div className="p-5">
                <p className="text-xs mb-2">
                  {post.publishedAt && new Date(post.publishedAt).toLocaleDateString()}
                </p>
                <h3 className="text-lg font-semibold text-[hsl(var(--primary))] group-hover:underline">
                  {post.title}
                </h3>
              </div>
            </a>
          ))}
        </div>

        <div className="mt-6 text-center">
          <Button asChild variant="default">
            <Link href="/posts">{t('moreNews')}</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}