import type { NextConfig } from "next";

const BACKEND = process.env.BACKEND_URL || "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND}/api/:path*`,
      },
      /*
       * Passthrough for backend routes that live at the domain root.
       *
       * `/health`, `/live` and `/ready` are served by FastAPI outside the `/api`
       * namespace, so the rule above never reached them. Rewriting those three
       * paths directly would be the obvious move and also a trap: `/health` was a
       * page in this app, so the System page's probe got a 200 back from Next
       * itself and reported the backend as healthy while the backend was never
       * contacted. A green light that cannot go red is worse than no light.
       *
       * A distinct prefix makes the hop explicit and can never collide with a
       * route in `app/`.
       */
      {
        source: "/_backend/:path*",
        destination: `${BACKEND}/:path*`,
      },
    ];
  },
};

export default nextConfig;
