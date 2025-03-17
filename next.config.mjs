/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'firebasestorage.googleapis.com',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'd2sa0osf92td39.cloudfront.net',
                pathname: '/**',
            },
        ],
    },
};

export default nextConfig;