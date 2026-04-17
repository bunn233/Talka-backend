/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ui-avatars.com",
        port: "",
        pathname: "/api/**",
      },
    ],
  },
 
  allowedDevOrigins: [
    'stanniferous-carolynn-pronegotiation.ngrok-free.dev',
    'localhost:3000'
  ]
};

export default nextConfig;