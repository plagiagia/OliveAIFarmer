import type { MetadataRoute } from 'next'

const siteUrl = 'https://www.oliveiq.gr'

export default function sitemap(): MetadataRoute.Sitemap {
  // Update a page's date when its public content changes, not on every build.
  return [
    {
      url: siteUrl,
      lastModified: '2026-10-27',
      changeFrequency: 'weekly',
      priority: 1,
    },
    { url: `${siteUrl}/about`, lastModified: '2026-10-27', changeFrequency: 'monthly', priority: 0.5 },
    { url: `${siteUrl}/imerologio-elaiwna`, lastModified: '2026-10-27', changeFrequency: 'monthly', priority: 0.8 },
    {
      url: `${siteUrl}/pricing`,
      lastModified: '2026-10-27',
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/legal/privacy`,
      lastModified: '2026-10-27',
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${siteUrl}/legal/terms`,
      lastModified: '2026-10-27',
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${siteUrl}/legal/imprint`,
      lastModified: '2026-05-17',
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]
}
