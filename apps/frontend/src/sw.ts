import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry } from "@serwist/precaching";
import { Serwist, StaleWhileRevalidate } from "serwist";

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
};

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      // Cache Directus assets with StaleWhileRevalidate
      matcher: ({ url }) => {
        const directusUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL;
        if (!directusUrl) return false;
        const origin = new URL(directusUrl).origin;
        return url.origin === origin && url.pathname.startsWith("/assets/");
      },
      handler: new StaleWhileRevalidate({
        cacheName: "directus-assets",
      }),
    },
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher({ request }) {
          return request.mode === "navigate";
        },
      },
    ],
  },
});

serwist.addEventListeners();
