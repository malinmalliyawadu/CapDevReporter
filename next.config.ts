import MillionLint from "@million/lint";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
};

export default process.env.DISABLE_MILLION
  ? nextConfig
  : MillionLint.next({
      enabled: true,
      rsc: true,
    })(nextConfig);
