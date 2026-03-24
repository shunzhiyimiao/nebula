/** @type {import('next').NextConfig} */
const isCapacitorBuild = process.env.CAPACITOR_BUILD === "true";

const nextConfig = {
  ...(isCapacitorBuild ? { output: "export", trailingSlash: true } : {}),
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
