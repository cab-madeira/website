'use client'
import React, { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { LayoutGrid, List } from 'lucide-react'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type Product = {
  title: string
  price: string
  image: string
  url: string
}

type Props = {
  products: Product[]
}

const PageClient: React.FC<Props> = ({ products }) => {

  const [sortBy, setSortBy] = React.useState<string>("name-asc")
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid")

  const sortedProducts = React.useMemo(() => {
    const parsed = [...products]

    const getNumericPrice = (price: string) =>
      parseFloat(price.replace(",", "."))

    switch (sortBy) {
      case "name-desc":
        return parsed.sort((a, b) => b.title.localeCompare(a.title))
      case "price-asc":
        return parsed.sort(
          (a, b) => getNumericPrice(a.price) - getNumericPrice(b.price)
        )
      case "price-desc":
        return parsed.sort(
          (a, b) => getNumericPrice(b.price) - getNumericPrice(a.price)
        )
      case "name-asc":
      default:
        return parsed.sort((a, b) => a.title.localeCompare(b.title))
    }
  }, [products, sortBy])

  return (

    <div className="w-full flex flex-col gap-6">

      {/* Toolbar */}
      <div className="flex items-center justify-between border rounded-lg p-4 bg-[hsl(var(--primary))]">

        {/* View Toggle */}
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "grid" ? "outline" : "ghost"}
            size="icon"
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className={`h-4 w-4${viewMode !== "grid" ? " invert" : ""}`} />
          </Button>

          <Button
            variant={viewMode === "list" ? "outline" : "ghost"}
            size="icon"
            onClick={() => setViewMode("list")}
          >
            <List className={`h-4 w-4${viewMode !== "list" ? " invert" : ""}`} />
          </Button>
        </div>

        {/* Sorting */}
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Order products" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name-asc">Name (A–Z)</SelectItem>
            <SelectItem value="name-desc">Name (Z–A)</SelectItem>
            <SelectItem value="price-asc">Price (Low → High)</SelectItem>
            <SelectItem value="price-desc">Price (High → Low)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Products */}
      {viewMode === "grid" ? (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {sortedProducts.map((product, index) => (
            <a
              key={index}
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
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          {sortedProducts.map((product, index) => (
            <a
              key={index}
              href={product.url}
              target="_blank"
              rel="noopener noreferrer"
              className="border rounded-lg p-4 hover:shadow-lg transition flex items-center gap-6 w-full max-w-3xl"
              style={{ backgroundColor: 'hsl(var(--secondary))' }}
            >
              <img
                src={product.image}
                alt={product.title}
                className="w-32 h-32 object-contain"
              />

              <div className="flex flex-1 items-center justify-between">
                <h3 className="text-base font-medium">
                  {product.title}
                </h3>

                <p className="text-lg font-semibold whitespace-nowrap">
                  {product.price} €
                </p>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

export default PageClient
