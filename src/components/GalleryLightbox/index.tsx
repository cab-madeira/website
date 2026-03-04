'use client'

import React, { FC, useCallback, useRef } from 'react'
import LightGallery from 'lightgallery/react'
import { LightGallery as ILightGallery } from 'lightgallery/lightgallery'
import lgZoom from 'lightgallery/plugins/zoom'
import lgThumbnail from 'lightgallery/plugins/thumbnail'
import { cn } from '@/utilities/ui'

import 'lightgallery/css/lightgallery.css'
import 'lightgallery/css/lg-zoom.css'
import 'lightgallery/css/lg-thumbnail.css'

export type GalleryItem = {
    src: string
    thumb?: string
    subHtml?: string
}

type GalleryProps = {
    gallery: GalleryItem[]
}

export const GalleryLightbox: FC<GalleryProps> = ({ gallery }) => {
    const lightGalleryRef = useRef<ILightGallery | null>(null)

    const onInit = useCallback((detail: { instance: ILightGallery }) => {
        lightGalleryRef.current = detail.instance
    }, [])

    if (!gallery.length) return null

    return (
        <div className={cn('container py-8')}>
            <LightGallery
                onInit={onInit}
                plugins={[lgZoom, lgThumbnail]}
                appendSubHtmlTo={'.lg-item'}
                elementClassNames={'inline-gallery-container'}
                thumbnail={true} // Show thumbnail strip
                selector=".gallery-item" // Only items with this class will open in lightbox
            >
                <div className="grid grid-cols-4 sm:grid-cols-8 lg:grid-cols-12 gap-y-4 gap-x-4 lg:gap-y-8 lg:gap-x-8">
                    {gallery.map((item, index) => (
                        <div key={index} className="col-span-4">
                            <a
                                href={item.src}
                                className={cn(
                                    'gallery-item relative block overflow-hidden transition-all duration-300',
                                    'border border-border rounded-lg',
                                    'bg-card hover:shadow-md'
                                )}
                                data-sub-html={item.subHtml || ''}
                            >
                                <img
                                    src={item.thumb || item.src}
                                    alt={`Gallery item ${index + 1}`}
                                    className="w-full h-48 object-cover"
                                />

                            </a>
                        </div>
                    ))}
                </div>
            </LightGallery>
        </div>
    )
}