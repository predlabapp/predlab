import { createNavigation } from 'next-intl/navigation'
import { defineRouting } from 'next-intl/routing'
import { locales, defaultLocale } from './i18n'

export const routing = defineRouting({
  locales,
  defaultLocale,
})

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing)
