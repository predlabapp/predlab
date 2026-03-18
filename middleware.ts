import createIntlMiddleware from 'next-intl/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { routing } from './navigation'

const intlMiddleware = createIntlMiddleware(routing)

export default function middleware(request: NextRequest) {
  // 1. www → no-www (301)
  const host = request.headers.get('host') || ''
  if (host.startsWith('www.')) {
    const newUrl = request.url.replace(`//${host}`, `//${host.replace('www.', '')}`)
    return NextResponse.redirect(newUrl, { status: 301 })
  }

  // 2. Googlebot — skip locale redirect, serve as-is (default locale)
  const ua = request.headers.get('user-agent') || ''
  if (/googlebot|google-inspectiontool|google-structured-data/i.test(ua)) {
    return NextResponse.next()
  }

  // 3. Normal next-intl locale routing
  return intlMiddleware(request)
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|admin|privacy|terms|.*\\..*).*)'],
}
