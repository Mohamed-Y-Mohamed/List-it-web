import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Old verification path.
      {
        source: "/auth/verification",
        destination: "/verification",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
