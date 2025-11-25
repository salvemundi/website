/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DIRECTUS_URL: string
  readonly VITE_DIRECTUS_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

