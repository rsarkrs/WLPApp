/** @type {import('next').NextConfig} */
const apiBase = (process.env.API_BASE_INTERNAL || process.env.NEXT_PUBLIC_API_BASE || 'http://127.0.0.1:4000').replace(/\/$/, '');

const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiBase}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
