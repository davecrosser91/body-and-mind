/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',

  // Enable experimental features if needed
  experimental: {
    // typedRoutes: true,
  },
}

module.exports = nextConfig
