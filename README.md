# IPTV Dashboard

Sports-first IPTV dashboard for browsing live channels, upcoming events, and source directories.

## What it does

- Prioritizes live sports and event channels before the full catalog
- Surfaces trending sports fixtures, including World Cup-style upcoming games
- Loads curated playlist sources and reference directories
- Proxies `eja.tv` into a local M3U feed for sports discovery
- Lets you switch sources, search broadcasters, and preview streams in the browser

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Notes

- The app is designed around public and curated sources already wired into the dashboard.
- Directory entries are reference links unless they expose a playlist the app can ingest.
