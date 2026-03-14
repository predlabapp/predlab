import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations } from 'next-intl/server'
import { Providers } from '@/components/layout/Providers'
import { locales, type Locale } from '@/i18n'
import { notFound } from 'next/navigation'

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string }
}) {
  const t = await getTranslations({ locale, namespace: 'Metadata' })
  return {
    title: {
      default: 'PredLab',
      template: '%s — PredLab',
    },
    description: t('description'),
    openGraph: {
      siteName: 'PredLab',
      title: 'PredLab — Record and verify your predictions',
      description: t('description'),
      url: 'https://predlab.app',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'PredLab — Record and verify your predictions',
      description: t('description'),
    },
  }
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  if (!locales.includes(locale as Locale)) notFound()

  const messages = await getMessages()

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <Providers>{children}</Providers>
    </NextIntlClientProvider>
  )
}
