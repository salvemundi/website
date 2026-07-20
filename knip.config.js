const config = {
  exclude: ["exports", "types"],
  workspaces: {
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
      entry: ["src/server.ts"]
    },
    "packages/db": {
      ignore: ["drizzle/**"]
    },
    "packages/validations": {
      ignoreDependencies: ["directus-ts-typegen"]
    }
  }
};

export default config;