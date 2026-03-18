import { MetadataRoute } from "next"
import { locales } from "@/i18n"

const baseUrl = "https://predlab.app"

// Only public, indexable routes (no auth/dashboard pages)
const publicRoutes = [
  { path: "",         priority: 1.0,  changeFrequency: "weekly"  as const },
  { path: "/rankings", priority: 0.8, changeFrequency: "daily"   as const },
  { path: "/grupos",   priority: 0.7, changeFrequency: "daily"   as const },
]

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = []

  for (const locale of locales) {
    for (const route of publicRoutes) {
      entries.push({
        url: `${baseUrl}/${locale}${route.path}`,
        lastModified: new Date(),
        changeFrequency: route.changeFrequency,
        priority: route.priority,
      })
    }
  }

  // Also include the bare root so crawlers see it
  entries.unshift({
    url: `${baseUrl}/`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 1.0,
  })

  return entries
}
