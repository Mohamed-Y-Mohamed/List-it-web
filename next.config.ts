// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Only add this if you're using Next.js 13.0-13.3
  // experimental: {
  //   appDir: true,
  // },

  async redirects() {
    return [
      // Redirect old verification path to new path
      {
        source: "/auth/verification",
        destination: "/verification",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
