import withPWAInit from '@ducanh2912/next-pwa';

const isDev = process.env.NODE_ENV === 'development';

const withPWA = withPWAInit({
  dest: 'public',
  disable: isDev,
  register: true,
  skipWaiting: true,
  reloadOnOnline: true,
  sw: '/sw.js',
  scope: '/',
  fallbacks: {
    document: '/offline',
  },
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/.*tile\.openstreetmap\.org\/.*/i,
        handler: 'NetworkOnly',
      },
      {
        urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'static-images',
          expiration: { maxEntries: 64, maxAgeSeconds: 60 * 60 * 24 * 30 }
        }
      }
    ]
  },
});

/ @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-avatar',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      'recharts',
      'date-fns',
      'framer-motion',
    ],
    serverActions: {
      bodySizeLimit: "20mb",
      allowedOrigins: ['absensi.ubig.web.id']
    },
  },

  compiler: {
    removeConsole: !isDev ? { exclude: ['error', 'warn'] } : false,
  },
  
  poweredByHeader: false,
  reactStrictMode: true,

  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      }
    ];
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '.supabase.co' },
      { protocol: 'https', hostname: '**.supabase.in' },
    ],
  },
};

export default withPWA(nextConfig);