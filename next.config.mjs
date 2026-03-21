/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.r2.cloudflarestorage.com",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb", // 支持上传较大的拍照图片
    },
  },
};

export default nextConfig;
