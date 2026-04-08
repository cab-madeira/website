import { fetchUtil } from '@/utilities/fetchUtil'
import type {
    ShopFeaturedBlock as ShopFeaturedProps,
} from '@/payload-types'
import { getCachedGlobal } from '@/utilities/getGlobals'
import { ShopFeatured } from './Component.client'
import React from 'react'
import { load } from 'cheerio'

type Product = {
    title: string
    price: string
    image: string
    url: string
}

export const ShopFeaturedBlock: React.FC<ShopFeaturedProps> = async ({
    shopApiUrl,
}) => {

    if (!shopApiUrl) {
        return <ShopFeatured products={[]} />
    }

    const res = await fetchUtil(shopApiUrl, {
        next: { revalidate: 3600 },
    })

    const html = await res.text()
    const $ = load(html)

    const products: Product[] = []

    $('td.oe_product').each((_, el) => {
        const container = $(el)

        const anchor = container.find('a').first()
        const url = anchor.attr('href') || ''

        const title =
            container.find('h6').text().trim() ||
            container.find('.o_wsale_products_item_title').text().trim()

        const price = container
            .find('.oe_currency_value')
            .first()
            .text()
            .trim()

        const image = container.find('img').attr('src') || ''

        products.push({
            title,
            price,
            image: image.startsWith('http')
                ? image
                : `https://lojaclubes.dhika.pt${image}`,
            url: url.startsWith('http')
                ? url
                : `https://lojaclubes.dhika.pt${url}`,
        })
    })

    const displayProducts = products.slice(0, 6)

    return (
        <ShopFeatured
            products={displayProducts}
        />
    )
}