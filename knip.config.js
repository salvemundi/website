const config = {
  exclude: ["exports", "types"],
  ignore: ["apps/frontend/public/**", "apps/wieisdemol/app/static/**"],
  workspaces: {
    ".": {
      entry: ["tests/*.test.mjs", "apps/mobile/tests/*.test.mjs"]
    },
    "apps/frontend": {
      entry: ["src/sw.ts"],
      next: {
        entry: ["src/app/**/*.{ts,tsx}", "src/pages/**/*.{ts,tsx}", "next.config.ts"]
      },
      ignoreDependencies: [
        "@serwist/sw",
        "@serwist/webpack-plugin"
      ],
      ignoreExportsUsedInFile: false
    },
    "apps/services/*": {
      entry: ["src/index.ts", "src/server.ts"]
    },
    "packages/db": {},
    "packages/validations": {}
  }
};

export default config;