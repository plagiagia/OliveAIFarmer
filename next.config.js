/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['lh3.googleusercontent.com', 'images.clerk.dev'],
  },
  env: {
    NEXT_PUBLIC_APP_NAME: 'OliveLog',
    NEXT_PUBLIC_APP_DESCRIPTION: 'Ψηφιακό Ημερολόγιο Ελαιοδέντρων',
  },
}

module.exports = nextConfig 