"use client"

import React from 'react'
import { useTranslations } from 'next-intl'

export const PageRange: React.FC<{
  className?: string
  collection?: 'posts' | 'gallery'
  collectionLabels?: {
    plural?: string
    singular?: string
  }
  currentPage?: number
  limit?: number
  totalDocs?: number
}> = (props) => {
  const {
    className,
    collection,
    collectionLabels: collectionLabelsFromProps,
    currentPage,
    limit,
    totalDocs,
  } = props
  const tPagination = useTranslations('Pagination')
  const tPageRange = useTranslations('PageRange')

  let indexStart = (currentPage ? currentPage - 1 : 1) * (limit || 1) + 1
  if (totalDocs && indexStart > totalDocs) indexStart = 0

  let indexEnd = (currentPage || 1) * (limit || 1)
  if (totalDocs && indexEnd > totalDocs) indexEnd = totalDocs

  const defaultLabels =
    collection === 'posts'
      ? { plural: tPageRange('postsPlural'), singular: tPageRange('postSingular') }
      : collection === 'gallery'
        ? { plural: tPageRange('galleriesPlural'), singular: tPageRange('gallerySingular') }
        : { plural: tPageRange('docsPlural'), singular: tPageRange('docSingular') }

  const { plural, singular } = collectionLabelsFromProps || defaultLabels

  return (
    <div className={[className, 'font-semibold'].filter(Boolean).join(' ')}>
      {(typeof totalDocs === 'undefined' || totalDocs === 0) && tPagination('noResults')}
      {typeof totalDocs !== 'undefined' &&
        totalDocs > 0 &&
        `${tPagination('showing')} ${indexStart}${indexStart > 0 ? ` - ${indexEnd}` : ''} ${tPagination('of')} ${totalDocs} ${totalDocs > 1 ? plural : singular
        }`}
    </div>
  )
}
