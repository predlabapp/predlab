import createIntlMiddleware from 'next-intl/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { routing } from './navigation'

const intlMiddleware = createIntlMiddleware(routing)

// Locales we support — must match i18n.ts
const LOCALES = ['en', 'pt', 'es', 'fr']
const LOCALE_RE = new RegExp(`^/(${LOCALES.join('|')})(\/|$)`)

export default function middleware(request: NextRequest) {
  // 1. www → no-www (301)
  const host = request.headers.get('host') || ''
  if (host.startsWith('www.')) {
    const newUrl = request.url.replace(`//${host}`, `//${host.replace('www.', '')}`)
    return NextResponse.redirect(newUrl, { status: 301 })
  }

  // 2. Googlebot / Google Inspection Tool — rewrite to default locale content
  //    without issuing a redirect (avoids "Redirect error" in Search Console)
  const ua = request.headers.get('user-agent') || ''
  if (/googlebot|google-inspectiontool|google-structured-data/i.test(ua)) {
    const { pathname } = request.nextUrl
    // If already on a locale path, serve as-is
    if (LOCALE_RE.test(pathname)) {
      return NextResponse.next()
    }
    // Rewrite / (and any non-locale path) to /en/<path> transparently
    return NextResponse.rewrite(new URL('/en' + pathname, request.url))
  }

  // 3. Normal next-intl locale routing for everyone else
  return intlMiddleware(request)
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|admin|privacy|terms|.*\\..*).*)'],
}
