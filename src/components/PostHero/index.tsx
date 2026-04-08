import { formatDateTime } from 'src/utilities/formatDateTime'
import React from 'react'

import type { Post } from '@/payload-types'

import { Media } from '@/components/Media'
import { formatAuthors } from '@/utilities/formatAuthors'

export const PostHero: React.FC<{
  post: Post
}> = ({ post }) => {
  const { heroImage, populatedAuthors, publishedAt, title } = post

  const hasAuthors =
    populatedAuthors && populatedAuthors.length > 0 && formatAuthors(populatedAuthors) !== ''

  return (
    <div className="relative w-full">
      {/* Text content at top, centered */}
      <div className="container mx-auto text-center z-60 relative">
        <h1 className="mb-6 text-3xl md:text-5xl lg:text-6xl">{title}</h1>

        <div className="flex flex-col md:flex-row justify-center gap-8 text-center md:text-left">
          {hasAuthors && (
            <div className="flex flex-col gap-1">
              <p className="text-sm">Author</p>
              <p>{formatAuthors(populatedAuthors)}</p>
            </div>
          )}
          {publishedAt && (
            <div className="flex flex-col gap-1">
              <p className="text-sm">Date Published</p>
              <time dateTime={publishedAt}>{formatDateTime(publishedAt)}</time>
            </div>
          )}
        </div>
      </div>

      {/* Image below text, full container width */}
      {heroImage && typeof heroImage !== 'string' && (
        <div className='mx-auto mt-3 w-[720px] max-w-full px-4 md:px-8' >
          <Media priority imgClassName="w-full h-full border border-border rounded-[0.8rem] m-0" resource={heroImage} />
        </div>
      )}
    </div>
  )
}