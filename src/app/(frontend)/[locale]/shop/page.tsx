import type { Metadata } from 'next/types'

import { getCachedGlobal } from '@/utilities/getGlobals'
import { GlobalAPI } from '@/payload-types'
import { fetchUtil } from '@/utilities/fetchUtil'
import { load } from 'cheerio'
import PageClient from './page.client'


export const dynamic = 'force-static'
export const revalidate = 600

type Product = {
  title: string
  price: string
  image: string
  url: string
}


export default async function Page() {
  const globalAPI = (await getCachedGlobal('globalAPI', 1)()) as GlobalAPI
  const shopAPI = globalAPI.shopAPI

  const res = await fetchUtil(shopAPI, {
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



  return (
    <div className="pb-24">
      <div className="container mb-16">
        <div className="prose dark:prose-invert max-w-none">
          <h1>Shop</h1>
        </div>
      </div>

      <div className="container mb-8">
        <PageClient products={products} />
      </div>


    </div>
  )
}

export function generateMetadata(): Metadata {
  return {
    title: `Payload Website Template Shop`,
  }
}
