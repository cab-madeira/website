'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from '@/components/ui/carousel'

type GalleryThumbnail = {
    title: string
    galleryUrl: string
    imageUrl: string | null
}

type GalleryFeaturedProps = {
    galleryThumbnails: GalleryThumbnail[]
}

export const GalleryFeatured: React.FC<GalleryFeaturedProps> = (props) => {
    const { galleryThumbnails } = props

    return (
        <div className="flex flex-col items-center gap-6 w-full">
            <h2 className="text-2xl font-bold text-center text-[hsl(var(--primary))]">Featured Gallery</h2>

            <Carousel>
                <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4">
                    <CarouselPrevious variant="default" />

                    <CarouselContent>
                        {galleryThumbnails.map((gallery, index) => (
                            <CarouselItem key={index} className="pl-4 basis-full md:basis-1/3">
                                <Link
                                    href={`/gallery/${gallery.galleryUrl}`}
                                    className="border rounded-lg p-4 hover:shadow-lg transition flex flex-col h-full"
                                    style={{ backgroundColor: 'hsl(var(--secondary))' }}
                                >
                                    {gallery.imageUrl ? (
                                        <img
                                            src={gallery.imageUrl}
                                            alt={gallery.title}
                                            className="w-full h-48 object-contain mb-3"
                                        />
                                    ) : (
                                        <div className="w-full h-48 mb-3 rounded-md bg-muted" />
                                    )}

                                    <h3 className="text-sm font-medium">{gallery.title}</h3>
                                </Link>
                            </CarouselItem>
                        ))}
                    </CarouselContent>

                    <CarouselNext variant="default" />
                </div>
            </Carousel>

            <div className="mt-6 text-center">
                <Button asChild variant="default">
                    <Link href="/gallery">View Full Gallery</Link>
                </Button>
            </div>

        </div>
    )
}