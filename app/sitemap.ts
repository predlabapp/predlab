import { MetadataRoute } from "next"
import { locales } from "@/i18n"

const baseUrl = "https://predlab.app"

const staticRoutes = ["", "/auth/signin", "/auth/signup"]

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = []

  for (const locale of locales) {
    for (const route of staticRoutes) {
      entries.push({
        url: `${baseUrl}/${locale}${route}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: route === "" ? 1 : 0.8,
      })
    }
  }

  return entries
}
