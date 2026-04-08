import { defineRouting } from 'next-intl/routing'
import { createNavigation } from 'next-intl/navigation'
import localization from './localization'

export const localeCodes = ['en', 'pt'] as const

export const routing = defineRouting({
  locales: localeCodes,
  defaultLocale: localization.defaultLocale,
})

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const { Link, redirect, usePathname, useRouter } = createNavigation(routing)

export type Locale = (typeof routing.locales)[number]

export type PayloadLocale = Locale | 'all'

export function isLocale(locale?: string): locale is Locale {
  return routing.locales.includes(locale as Locale)
}

export function normalizeLocale(locale?: string): Locale {
  return isLocale(locale) ? locale : routing.defaultLocale
}
