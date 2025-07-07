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

export default nextConfig;
