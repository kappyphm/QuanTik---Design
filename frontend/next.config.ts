import type { NextConfig } from "next";
import path from "node:path";
const config:NextConfig={
  reactStrictMode:true,
  output:"standalone",
  outputFileTracingRoot:path.resolve(process.cwd(), ".."),
  poweredByHeader:false,
};
export default config;
