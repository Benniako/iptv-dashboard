# IPTV Dashboard — Real Streams, Favorites, EPG, Recording, Smart DNS

## Overview

Upgrade the StreamTV IPTV dashboard from mock data to a fully functional local IPTV
player with real channel data from iptv-org, favorites tracking, an EPG guide,
stream recording via ffmpeg, and Smart DNS geo-bypass integration.

## Architecture

Pure Next.js app with API routes for server-side features:

```
iptv-dashboard/
├── src/
│   ├── app/
│   │   ├── favorites/page.tsx      # Bookmarked channels
│   │   ├── guide/page.tsx           # EPG TV guide
│   │   ├── settings/page.tsx        # Smart DNS config
│   │   ├── watch/[slug]/page.tsx    # Enhanced with record/fav
│   │   ├── category/[slug]/page.tsx # Channels from real API
│   │   ├── multiview/page.tsx       # Multi-stream (4 streams)
│   │   └── schedule/page.tsx        # Upgraded schedule view
│   ├── components/
│   │   ├── FavoriteButton.tsx       # Reusable bookmark toggle
│   │   ├── RecordingPanel.tsx       # Schedule a recording UI
│   │   ├── GuideGrid.tsx            # EPG time-grid component
│   │   ├── SmartDnsStatus.tsx       # DNS config status badge
│   │   └── ... (existing components)
│   ├── lib/
│   │   └── iptv.ts                 # Expanded: real API + cache
│   └── types/index.ts              # Expanded types
├── src/app/api/
│   ├── record/schedule/route.ts     # POST schedule, GET list, DELETE
│   ├── record/stream/route.ts       # GET serve recorded file
│   └── proxy/stream/route.ts        # GET proxy HLS via server
├── recordings/                      # Recorded stream output
└── recordings.json                  # Recording schedule store
```

## 1. Real IPTV Streams

### Data Sources (iptv-org API)

| Endpoint | Usage | Cache TTL |
|----------|-------|-----------|
| `https://iptv-org.github.io/api/channels.json` | Channel list with metadata | 1 hour |
| `https://iptv-org.github.io/api/streams.json` | Playable stream URLs per channel | 1 hour |
| `https://iptv-org.github.io/api/guides.json` | EPG schedule by channel | 30 min |
| `https://iptv-org.github.io/api/categories.json` | Category taxonomy | 24 hours |

### Caching

- All API data cached in `localStorage` with TTL timestamps
- Cache key prefix: `streamtv_cache_`
- Stale-while-revalidate: show cached data, refresh in background
- Fallback to mock data on network failure

### Video Player

- Wire up HLS.js for `.m3u8` playback (already in dependencies)
- Quality selector from available stream sources
- Error handling: retry with alternate stream URL, show offline message

### Types (extended)

```typescript
interface StreamSource {
  channel: string;     // channel ID
  url: string;         // stream URL (can be .m3u8, .ts, etc.)
  quality?: string;    // e.g. "1080p", "720p"
  label?: string;      // e.g. "HD", "SD"
  referrer?: string;   // HTTP Referrer header
  user_agent?: string; // Custom User-Agent
}

interface GuideEntry {
  channel: string;
  start: number;       // Unix timestamp
  stop: number;        // Unix timestamp
  title: string;
  description?: string;
  category?: string;
}
```

## 2. Favorites

### Storage

- `localStorage` key: `streamtv_favorites`
- Value: JSON array of channel IDs `string[]`
- Max: unbounded (practical limit ~1000 before perf impact)

### Components

- `FavoriteButton` — star icon toggle, placed on:
  - Channel cards in category grids
  - Watch page header
  - EPG guide program rows
  - Search results
- `/favorites` page — lists all bookmarked channels with:
  - Current live status (fetched from API)
  - Quick-play button
  - Category filter
  - Remove button

### Cross-tab Sync

- Listens to `window.addEventListener("storage", ...)` to sync favorites
  across open tabs

## 3. EPG Guide

### Page: `/guide`

- **Left sidebar**: Channel list (scrollable, with logos)
- **Main area**: Time-aligned program grid
  - X-axis: time (now → +4 hours, horizontally scrollable)
  - Y-axis: channels
  - Current time indicator (red vertical line)
  - Click a program → navigate to `/watch/<channel_id>`
- **Top bar**: Date selector, search by program name, category filter

### Data

- Fetched from `https://iptv-org.github.io/api/guides.json?channel=<id>`
- Filtered to current time window
- Cached 30 minutes

## 4. Recording (Server-Side Scheduler)

### API Routes

#### `POST /api/record/schedule`
```json
{
  "channelId": "BBCOne.uk",
  "streamUrl": "https://...",
  "startTime": 1719500000,
  "duration": 3600,
  "title": "BBC News at Ten"
}
```
Returns: `{ id: "uuid", status: "scheduled" }`

#### `GET /api/record/list`
Returns all recordings with status: `scheduled | recording | completed | failed`

#### `DELETE /api/record/schedule?id=xxx`
Cancels a pending recording. If currently recording, kills ffmpeg process.

#### `GET /api/record/stream?id=xxx`
Serves a completed recording file for download/playback.

### Scheduler Engine

- A simple setInterval (every 30s) in the API route module checks `recordings.json`
- When a recording's `startTime` is due, spawns:
  ```
  ffmpeg -i <stream_url> -t <duration> -c copy -f mpegts recordings/<id>.ts
  ```
- Process tracked by PID in the recordings.json
- On server restart, reschedules missed recordings

### Output

- Directory: `recordings/<id>.ts` (MPEG-TS format, no re-encode)
- Accessible via `/api/record/stream?id=xxx`

### UI

- `RecordingPanel` component on watch page
- "Record" button → opens date/time picker + duration selector
- `/favorites` page shows upcoming recordings for bookmarked channels
- Status badges: 🔴 Recording, ⏳ Scheduled, ✅ Completed, ❌ Failed

## 5. Smart DNS Geo-Bypass

### How It Works

Smart DNS works at the DNS resolver level — when configured on the OS/router,
DNS queries for geo-restricted streaming CDNs resolve to unblocked IPs.

Since the dashboard runs in a browser, we provide:

1. **Settings panel** (`/settings`) to configure DNS
2. **Proxied stream fetching** for streams that need server-side resolution
3. **Status indicators** showing DNS configuration state

### Settings Page (`/settings`)

- Smart DNS provider selection (ControlD by default)
- DNS server addresses (primary: `76.76.2.0`, backup: `76.76.10.0`)
- Test DNS button — resolves a known geo-restricted domain to verify
- Proxy toggle: "Route streams through server proxy"
- Connection status indicator

### Proxy API Route

`GET /api/proxy/stream?url=<encoded_url>&channel=<id>`

- Fetches the stream manifest/segment server-side
- Streams response back with correct Content-Type
- Adds custom headers (Referer, User-Agent) if specified
- Only used for channels marked as "proxied" in settings

### DNS Configuration

The app provides one-click DNS configuration for Windows:
- Sets DNS servers on the active network adapter(s)
- Primary: `76.76.2.0` (ControlD)
- Backup: `76.76.10.0` (ControlD)
- Restores original DNS on disconnect

### Status Indicator

- `SmartDnsStatus` component shows in the header
- States: not configured, configured, resolving, error
- Click opens settings

## 6. Settings Page

### Route: `/settings`

Tabs or sections:
1. **Smart DNS** — provider, DNS server IPs, proxy toggle, test button
2. **Recording** — output directory, max concurrent recordings, auto-cleanup
3. **General** — theme, language, cache management (clear all caches)
4. **About** — version, data sources, licenses

## Implementation Order

1. Real IPTV streams (data layer + VideoPlayer)
2. Favorites (storage + components + page)
3. EPG guide (data + components + page)
4. Settings page (Smart DNS + recording config)
5. Smart DNS proxy API route + DNS configuration
6. Recording scheduler (API routes + UI)

## Testing

- All components render without mock data
- Favorites persist across page refreshes
- EPG data loads and displays correctly
- Recording schedule survives server restart
- Smart DNS proxy streams HLS correctly
