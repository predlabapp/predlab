import { notFound } from 'next/navigation'
import { getRequestConfig } from 'next-intl/server'

export const locales = ['en', 'pt', 'es', 'fr'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'en'

export default getRequestConfig(async ({ requestLocale }) => {
  // Typically corresponds to the `[locale]` segment
  let locale = await requestLocale

  // Ensure that the incoming locale is valid
  if (!locale || !locales.includes(locale as Locale)) {
    locale = defaultLocale
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  }
})
