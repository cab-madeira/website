'use client'

import React, { useEffect, useState } from "react"
import { useTranslations } from 'next-intl'

import type { Header as HeaderType } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { Link, usePathname } from '@/i18n/routing'
import { MenuIcon, ChevronDown, X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { LanguageSelector } from '@/components/LanguageSelector'

type NavItem = any

const DisclosureNav: React.FC<{ label: string; items: any[]; onNavigate?: () => void }> = ({ label, items, onNavigate }) => {
  const [open, setOpen] = useState(false)

  return (
    <li className="border-b border-border/50 last:border-b-0">
      <button
        className="w-full flex items-center justify-between py-3 px-3 hover:bg-blue-100 dark:hover:bg-blue-900/30 outline outline-0 hover:outline-2 outline-black dark:outline-white rounded-md transition-colors"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="font-medium">{label}</span>
        <ChevronDown className={`transition-transform w-4 h-4 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <ul className="pl-6 pb-2 space-y-1">
          {items.map((it, i) => {
            const l = it?.link || it
            return (
              <li key={i}>
                {l?.url || l?.reference ? (
                  <CMSLink {...l} appearance="link" className="block py-2 px-3 hover:bg-blue-100 dark:hover:bg-blue-900/30 outline outline-0 hover:outline-2 outline-black dark:outline-white rounded-md transition-colors text-sm" onClick={onNavigate} />
                ) : (
                  <Link href={l?.url || '#'} onClick={onNavigate} className="block py-2 px-3 hover:bg-blue-100 dark:hover:bg-blue-900/30 outline outline-0 hover:outline-2 outline-black dark:outline-white rounded-md transition-colors text-sm">{l?.label || l}</Link>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </li>
  )
}



export const HeaderNav: React.FC<{ data: HeaderType }> = ({ data }) => {
  const navItems = data?.navItems || []
  const [open, setOpen] = useState(false)
  const [entered, setEntered] = useState(false)
  const pathname = usePathname()
  const t = useTranslations('HeaderNav')

  useEffect(() => {
    if (open) setOpen(false)
  }, [pathname])

  useEffect(() => {
    let t: number | undefined
    if (open) {
      // small delay to allow initial render then trigger the CSS transform
      t = window.setTimeout(() => setEntered(true), 10)
    } else {
      // reset entered for next open; we intentionally do not animate closing
      setEntered(false)
    }
    return () => {
      if (t) clearTimeout(t)
    }
  }, [open])

  return (
    <div>

      <Button
        onClick={() => setOpen(true)}
        variant="link"
        aria-label={t('openMenu')}
      >
        <MenuIcon />
      </Button>

      {open && (
        <div className="fixed inset-0 z-10 flex">
          <div
            className="fixed inset-0 bg-black/60"
            onClick={() => setOpen(false)}
            aria-hidden
          />

          <aside
            role="dialog"
            aria-modal="true"
            className={`relative h-full w-[85%] max-w-sm bg-background shadow-2xl transform transition-transform duration-300 ease-out ${entered ? "translate-x-0" : "-translate-x-full"
              } rounded-tr-2xl rounded-br-2xl border-r`}
          >
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-bold">{t('navigation')}</h3>
              <button
                aria-label={t('closeMenu')}
                onClick={() => setOpen(false)}
                className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 outline outline-0 hover:outline-2 outline-black dark:outline-white rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col h-[calc(100%-5rem)]">
              <nav className="p-4 flex-1 overflow-y-auto">
                <ul className="flex flex-col gap-2">
                  {navItems.map((item: NavItem, idx: number) => {
                    const link = item?.link || {}
                    const label = link.label || ""

                    const sub = (item.items || item.subItems || []) as NavItem[]

                    if (sub && sub.length > 0) {
                      return <DisclosureNav key={idx} label={label} items={sub} onNavigate={() => setOpen(false)} />
                    }

                    return (
                      <li key={idx}>
                        <CMSLink {...link} appearance="link" className="block py-3 px-3 hover:bg-blue-100 dark:hover:bg-blue-900/30 outline outline-0 hover:outline-2 outline-black dark:outline-white rounded-md transition-colors font-medium" onClick={() => setOpen(false)} />
                      </li>
                    )
                  })}
                </ul>
              </nav>

              <div className="p-4 border-t">
                <LanguageSelector />
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>

  )
}

