/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercel handles Next.js natively — no need for static export
  // Allow importing .js engine files without extension resolution issues
  webpack: (config) => {
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
    };
    return config;
  },
};

export default nextConfig;
