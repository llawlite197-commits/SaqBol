import type { NextConfig } from "next";

const workspaceBasePath = process.env.NEXT_PUBLIC_WORKSPACE_BASE_PATH || "";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(workspaceBasePath ? { basePath: workspaceBasePath } : {})
};

export default nextConfig;
