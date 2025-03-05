import MillionLint from "@million/lint";
import type { NextConfig } from "next";
import CopyWebpackPlugin from "copy-webpack-plugin";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // add copy webpack plugin
    if (isServer) {
      config.plugins.push(
        new CopyWebpackPlugin({
          patterns: [
            {
              // copy the templates folder
              from: "prisma/",
              to: "prisma/",
            },
          ],
        })
      );
    }
    return config;
  },
};

export default process.env.IS_UNDER_TEST
  ? nextConfig
  : MillionLint.next({
      enabled: true,
      rsc: true,
    })(nextConfig);
