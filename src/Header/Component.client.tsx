'use client'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import React, { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link, usePathname } from '@/i18n/routing'

import type { Header } from '@/payload-types'

import { Logo } from '@/components/Logo/Logo'
import { SearchIcon } from 'lucide-react'

import { Item } from "@/components/ui/item"


import { HeaderNav } from './Nav'
import { ThemeSelector } from '@/providers/Theme/ThemeSelector'

interface HeaderClientProps {
  data: Header
}

export const HeaderClient: React.FC<HeaderClientProps> = ({ data }) => {
  /* Storing the value in a useState to avoid hydration errors */
  const [theme, setTheme] = useState<string | null>(null)
  const { headerTheme, setHeaderTheme } = useHeaderTheme()
  const pathname = usePathname()
  const t = useTranslations('Header')

  useEffect(() => {
    setHeaderTheme(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  useEffect(() => {
    if (headerTheme && headerTheme !== theme) setTheme(headerTheme)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headerTheme])

  return (
    <header
      className="container relative"
      {...(theme ? { 'data-theme': theme } : {})}
    >
      <div className="py-8 grid grid-cols-12 items-center w-full">
        {/* Left column: span 2 */}
        <div className="col-span-2 flex items-center">
          <Item>
            <HeaderNav data={data} />
          </Item>
        </div>

        {/* Middle column: span 8 */}
        <div className="col-span-8 flex justify-center">
          {pathname && (
            <Link href="/">
              <Logo loading="eager" priority="high" className='h-28' />
            </Link>
          )}
        </div>

        {/* Right column: span 2 */}
        <div className="col-span-2 flex justify-end">
          <Item>
            <div className="flex items-center gap-4">
              <ThemeSelector />
              <Link href="/search">
                <span className="sr-only">{t('search')}</span>
                <SearchIcon className="w-5 text-primary" />
              </Link>
            </div>
          </Item>
        </div>
      </div>
    </header>
  )

}
