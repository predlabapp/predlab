import { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/admin/",
        // Auth e dashboard em todos os locales
        "/auth/",
        "/dashboard/",
        "/en/",       // /en/* redireciona para /* (locale padrão sem prefixo)
        "/pt/auth/",
        "/pt/dashboard/",
        "/es/auth/",
        "/es/dashboard/",
        "/fr/auth/",
        "/fr/dashboard/",
      ],
    },
    sitemap: "https://predlab.app/sitemap.xml",
  }
}
