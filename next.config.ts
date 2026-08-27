import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
  // firebase-admin (via @google-cloud/firestore's gRPC internals) breaks when
  // Next.js's server bundler tries to bundle it instead of letting Node
  // require it natively at runtime — a very common cause of serverless
  // functions that import it crashing instantly with no stack trace on
  // Vercel. Marking it external fixes that.
  serverExternalPackages: ["firebase-admin"],
};

export default nextConfig;
