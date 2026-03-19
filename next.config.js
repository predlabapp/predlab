const createNextIntlPlugin = require('next-intl/plugin')
const withNextIntl = createNextIntlPlugin('./i18n.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      // Bare paths (no locale) → canonical English versions
      // With localePrefix:'as-needed', /rankings already works for English
      // but /pt/rankings, /es/rankings etc. are the other locales
      // These redirects help bots that land on legacy URLs
      { source: '/boloes', destination: '/dashboard/bolaos', permanent: true },
    ]
  },
}

module.exports = withNextIntl(nextConfig)
