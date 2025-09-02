// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   reactStrictMode: false,
//   experimental: {
//     esmExternals: true,
//   },
// };

// module.exports = nextConfig;
// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   eslint: {
//     // ❌ Build fail mat karo lint errors par
//     ignoreDuringBuilds: true,
//   },
// };

// module.exports = nextConfig;

// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   eslint: {
//     ignoreDuringBuilds: true,
//   },
//   typescript: {
//     // ❌ Type errors ko ignore kardo build ke waqt
//     ignoreBuildErrors: true,
//   },
// };

// module.exports = nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
