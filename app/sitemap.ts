import { MetadataRoute } from "next"
import { locales, defaultLocale } from "@/i18n"

const baseUrl = "https://predlab.app"

const publicRoutes = [
  { path: "",          priority: 1.0, changeFrequency: "weekly" as const },
  { path: "/rankings", priority: 0.8, changeFrequency: "daily"  as const },
  { path: "/grupos",   priority: 0.7, changeFrequency: "daily"  as const },
]

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = []

  for (const locale of locales) {
    // Default locale has no prefix (localePrefix: 'as-needed')
    const prefix = locale === defaultLocale ? "" : `/${locale}`

    for (const route of publicRoutes) {
      entries.push({
        url: `${baseUrl}${prefix}${route.path || "/"}`,
        lastModified: new Date(),
        changeFrequency: route.changeFrequency,
        priority: route.priority,
      })
    }
  }

  return entries
}
