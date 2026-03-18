import createIntlMiddleware from 'next-intl/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { routing } from './navigation'

const intlMiddleware = createIntlMiddleware(routing)

export default function middleware(request: NextRequest) {
  // www → no-www (301)
  const host = request.headers.get('host') || ''
  if (host.startsWith('www.')) {
    const newUrl = request.url.replace(`//${host}`, `//${host.replace('www.', '')}`)
    return NextResponse.redirect(newUrl, { status: 301 })
  }

  return intlMiddleware(request)
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|admin|privacy|terms|.*\\..*).*)'],
}
