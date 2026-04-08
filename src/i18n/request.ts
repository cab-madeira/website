import { getRequestConfig } from 'next-intl/server'
import { routing } from './routing'

export default getRequestConfig(async ({ requestLocale }) => {
  // Await the locale from the request
  let locale = await requestLocale

  // If the locale is undefined or not in your supported list, fallback to default
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale
  }

  // Import messages for the final locale
  const messages = (await import(`./messages/${locale}.json`)).default

  return {
    locale,
    messages,
  }
})
