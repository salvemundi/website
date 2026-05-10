/// <reference lib="webworker" />

import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry } from "@serwist/precaching";
import { 
  Serwist, 
  NetworkFirst, 
  CacheFirst, 
  StaleWhileRevalidate, 
  ExpirationPlugin, 
  CacheableResponsePlugin 
} from "serwist";

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
};

const manifest = self.__SW_MANIFEST;

const serwist = new Serwist({
  precacheEntries: manifest,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  disableDevLogs: true,
  runtimeCaching: [
    {
      // Cache Directus assets with NetworkFirst (User preference for freshness)
      matcher: ({ url }) => {
        const directusUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL;
        if (!directusUrl) return false;
        const origin = new URL(directusUrl).origin;
        return url.origin === origin && url.pathname.startsWith("/assets/");
      },
      handler: new NetworkFirst({
        cacheName: "directus-assets",
        networkTimeoutSeconds: 3,
        plugins: [
          new CacheableResponsePlugin({
            statuses: [0, 200] }),
          new ExpirationPlugin({
            maxEntries: 100,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
          }),
        ] }) },
    {
      // Cache local images with CacheFirst (Aggressive caching for static UI elements)
      matcher: ({ url }) => {
        return url.pathname.startsWith("/img/");
      },
      handler: new CacheFirst({
        cacheName: "local-images",
        plugins: [
          new CacheableResponsePlugin({
            statuses: [0, 200] }),
          new ExpirationPlugin({
            maxEntries: 50,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          }),
        ] }) },
    ...defaultCache,
  ] });

serwist.addEventListeners();
