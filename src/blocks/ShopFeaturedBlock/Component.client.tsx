'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel"



type Product = {
    title: string
    price: string
    image: string
    url: string
}

type Props = {
    products: Product[]
}

export const ShopFeatured: React.FC<Props> = ({ products }) => {
    const t = useTranslations('ShopFeaturedBlock')


    return (
        <div className="flex flex-col items-center gap-6 w-full">
            <h2 className="text-2xl font-bold text-center text-[hsl(var(--primary))]">
                {t('featuredTitle')}
            </h2>

            <Carousel>
                <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4">

                    {/* Previous Button */}
                    <CarouselPrevious variant='default' />

                    {/* Carousel Content */}
                    <CarouselContent>
                        {products.map((product, index) => (
                            <CarouselItem
                                key={index}
                                className="pl-4 basis-full md:basis-1/3"
                            >
                                <a
                                    href={product.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="border rounded-lg p-4 hover:shadow-lg transition flex flex-col h-full"
                                    style={{ backgroundColor: 'hsl(var(--secondary))' }}
                                >
                                    <img
                                        src={product.image}
                                        alt={product.title}
                                        className="w-full h-48 object-contain mb-3"
                                    />
                                    <h3 className="text-sm font-medium mb-2">
                                        {product.title}
                                    </h3>
                                    <p className="text-lg font-semibold mt-auto">
                                        {product.price} €
                                    </p>
                                </a>
                            </CarouselItem>
                        ))}
                    </CarouselContent>

                    {/* Next Button */}
                    <CarouselNext variant='default' />
                </div>
            </Carousel>

            <div className="mt-6 text-center">
                <Button asChild variant="default">
                    <Link href="/shop">{t('viewFull')}</Link>
                </Button>
            </div>
        </div>

    )
}