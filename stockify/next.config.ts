import type { NextConfig } from "next"

// Project pages are served from https://<org>.github.io/<repo>/, so the
// build needs a matching basePath/assetPrefix when running in Actions.
const isGithubActions = process.env.GITHUB_ACTIONS === "true"
const repo = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? ""

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  ...(isGithubActions && {
    basePath: `/${repo}`,
    assetPrefix: `/${repo}/`,
  }),
}

export default nextConfig
