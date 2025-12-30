# Frontend

This is the frontend for the Salvemundi website, built with Next.js and Tailwind CSS.

## Project Structure

- `src/` — Main application source code
- `public/` — Static assets (images, fonts, data)
- `index.html` — Entry point for static hosting

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm or yarn

### Install Dependencies

```sh
npm install
```

### Development Server

```sh
npm run dev
```

The app will be available at `http://localhost:3000`.

## Environment Variables

The following environment variables are required for full functionality:

- `VITE_DIRECTUS_URL`
- `VITE_AUTH_REDIRECT_URI`
- `VITE_ENTRA_CLIENT_ID`
- `VITE_ENTRA_TENANT_ID`
- `VITE_EMAIL_API_ENDPOINT`
- `VITE_DIRECTUS_API_KEY`

You can set these in a `.env.local` file for local development.

## Local development with .env.local

1. Create a `.env.local` in the `frontend/` folder (a sample is provided in the repo).
2. Ensure the variables start with `NEXT_PUBLIC_` so they are available in the browser.
3. Install and run the dev server:

```sh
npm install
npm run dev
```

Open the app at the address printed by Next.js (commonly `http://localhost:3000`).

Tip: `.env.local` is already listed in the repository `.gitignore`, so it won't be committed.

## Building for Production

```sh
npm run build
```

## Docker Usage

A `Dockerfile` can be used to build and run the frontend in a container. Example build command:

```sh
docker build --build-arg VITE_DIRECTUS_URL=... --build-arg VITE_AUTH_REDIRECT_URI=... --build-arg VITE_ENTRA_CLIENT_ID=... --build-arg VITE_ENTRA_TENANT_ID=... --build-arg VITE_EMAIL_API_ENDPOINT=... --build-arg VITE_DIRECTUS_API_KEY=... -t ghcr.io/salvemundi/frontend:dev .
```

## Additional Info

- Tailwind CSS is configured via `tailwind.config.js` and `postcss.config.js`.
- TypeScript configuration is in `tsconfig.json` and related files.

## Contact

For questions, contact the Salvemundi development team.
