import createIntlMiddleware from 'next-intl/middleware'
import { routing } from './navigation'

const intlMiddleware = createIntlMiddleware(routing)

export default intlMiddleware

export const config = {
  matcher: ['/((?!api|_next|_vercel|admin|privacy|terms|.*\\..*).*)'],
}
