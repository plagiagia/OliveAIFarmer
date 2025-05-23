/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['lh3.googleusercontent.com', 'images.clerk.dev'],
  },
  i18n: {
    locales: ['el', 'en'],
    defaultLocale: 'el',
  },
  env: {
    NEXT_PUBLIC_APP_NAME: 'OliveLog',
    NEXT_PUBLIC_APP_DESCRIPTION: 'Ψηφιακό Ημερολόγιο Ελαιοδέντρων',
  },
}

module.exports = nextConfig 