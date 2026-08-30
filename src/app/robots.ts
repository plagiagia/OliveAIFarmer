import type { MetadataRoute } from 'next'

const siteUrl = 'https://oliveiq.gr'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api', '/dashboard', '/sign-in', '/sign-up', '/offline'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
