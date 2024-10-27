/** @type {import('next').NextConfig} */
const nextConfig = {
  rewrites: async () => {
    return [
      {
        source: "/companies",
        destination: "/company",
      },
    ];
  },
};

module.exports = nextConfig;