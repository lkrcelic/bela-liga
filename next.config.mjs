/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  // The old Manage Team addresses (bookmarks, an old Upravljanje ligom link): Nova ekipa and the Ekipe directory. The
  // query goes along (/teams/new?league=2 → /teams?new=1&league=2). A redirect here reaches the browser before anything
  // renders; redirect() in a page under the client teams layout crashed a cold load of the old address.
  async redirects() {
    return [
      {source: "/teams/new", destination: "/teams?new=1", permanent: false},
      {source: "/teams/add-teammate", destination: "/teams", permanent: false},
    ];
  },
};

export default nextConfig;
