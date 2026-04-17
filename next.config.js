/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: require.resolve("crypto-browserify"),
      stream: require.resolve("stream-browserify"),
      buffer: require.resolve("buffer"),

      // ✅ FIX: prevent pino-pretty resolution error in WalletConnect
      "pino-pretty": false,
    };

    return config;
  },
};

module.exports = nextConfig;
