# IPTV Dashboard Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Upgrade StreamTV from mock data to real IPTV streams, add favorites, EPG guide, stream recording, and Smart DNS geo-bypass.

**Architecture:** Pure Next.js app with API routes for server-side recording and stream proxying. Data cached in localStorage with TTL. No external database.

**Tech Stack:** Next.js 16, TypeScript, Tailwind CSS, HLS.js (already installed), ffmpeg (for recording)

---

## File Structure

### New files to create:
- `src/components/FavoriteButton.tsx` — Reusable bookmark toggle
- `src/components/RecordingPanel.tsx` — Recording schedule UI
- `src/components/GuideGrid.tsx` — EPG time-grid
- `src/components/SmartDnsStatus.tsx` — DNS/badge in header
- `src/app/favorites/page.tsx` — Favorites list page
- `src/app/guide/page.tsx` — EPG guide page
- `src/app/settings/page.tsx` — Settings page
- `src/app/api/record/schedule/route.ts` — Recording scheduler API
- `src/app/api/record/stream/route.ts` — Serve recorded files
- `src/app/api/proxy/stream/route.ts` — Smart DNS stream proxy
- `src/types/guide.ts` — Guide/EPG types
- `recordings.json` — Recording schedule store (root dir)
- `scripts/set-dns-control-d.ps1` — DNS setup script (already created)

### Files to modify:
- `src/lib/iptv.ts` — Replace mocks with real API + caching layer
- `src/lib/utils.ts` — Add cache utilities
- `src/types/index.ts` — Add StreamSource type
- `src/components/VideoPlayer.tsx` — Wire HLS.js for real streams
- `src/app/layout.tsx` — Add SmartDnsStatus to header, nav link for guide/settings
- `src/app/page.tsx` — Wire real data from API
- `src/app/watch/[slug]/page.tsx` — Add FavoriteButton + RecordingPanel
- `src/app/category/[slug]/page.tsx` — Wire real channels from API
- `src/app/schedule/page.tsx` — Update with real data or link to guide
- `src/app/multiview/page.tsx` — Wire real streams

---

### Task 1: Real IPTV Data Layer

**Files:**
- Modify: `src/types/index.ts`
- Create: `src/types/guide.ts`
- Modify: `src/lib/utils.ts`
- Modify: `src/lib/iptv.ts`

- [ ] **Step 1: Add new types**

Add to `src/types/index.ts`:
```typescript
export interface StreamSource {
  channel: string;
  url: string;
  quality?: string;
  label?: string;
  referrer?: string;
  user_agent?: string;
}

export interface GuideEntry {
  channel: string;
  start: number;
  stop: number;
  title: string;
  description?: string;
  category?: string;
}

export interface IptvChannel {
  id: string;
  name: string;
  alt_names?: string[];
  network?: string;
  country?: string;
  categories: string[];
  is_nsfw: boolean;
  website?: string;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}
```

- [ ] **Step 2: Add cache utility functions**

Add to `src/lib/utils.ts`:
```typescript
const CACHE_PREFIX = "streamtv_cache_";

export function cacheGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() - entry.timestamp > entry.ttl) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

export function cacheSet<T>(key: string, data: T, ttlMs: number): void {
  try {
    const entry: CacheEntry<T> = { data, timestamp: Date.now(), ttl: ttlMs };
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

export function cacheClear(): void {
  const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX));
  keys.forEach(k => localStorage.removeItem(k));
}
```

- [ ] **Step 3: Rewrite `src/lib/iptv.ts` with real API calls**

Replace the entire file content. Keep function signatures the same where possible but source data from real API:

```typescript
import type { Channel, LiveEvent, Category, ScheduleEvent, StreamSource, GuideEntry, IptvChannel } from "@/types";
import { cacheGet, cacheSet } from "./utils";

const API_BASE = "https://iptv-org.github.io/api";

// ── Categories ──────────────────────────────────────────────

export function getCategories(): Category[] {
  const cached = cacheGet<Category[]>("categories");
  if (cached) return cached;

  // Fetch in background; return fallback immediately
  const fallback: Category[] = [
    { id: "1", name: "Basketball", slug: "basketball", count: 0, icon: "🏀" },
    { id: "2", name: "Football", slug: "football", count: 0, icon: "⚽" },
    // ... (keep all 15 existing categories)
  ];
  fetchCategories().then(cats => {
    if (cats.length) cacheSet("categories", cats, 86400_000);
  });
  return fallback;
}

async function fetchCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${API_BASE}/categories.json`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.map((c: any, i: number) => ({
      id: String(i + 1),
      name: c.name,
      slug: c.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      count: 0,
      icon: "📺",
    }));
  } catch {
    return [];
  }
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return getCategories().find((c) => c.slug === slug);
}

// ── Live Events ────────────────────────────────────────────

// Fetch channels + streams from API, combine into LiveEvents
export async function getLiveEvents(): Promise<LiveEvent[]> {
  const cached = cacheGet<LiveEvent[]>("live_events");
  if (cached) return cached;

  try {
    const [channelsRes, streamsRes] = await Promise.all([
      fetch(`${API_BASE}/channels.json`),
      fetch(`${API_BASE}/streams.json`),
    ]);
    if (!channelsRes.ok || !streamsRes.ok) return getPopularLive(); // fallback

    const channels: IptvChannel[] = await channelsRes.json();
    const streams: StreamSource[] = await streamsRes.json();

    // Build a map: channelId -> first stream URL
    const streamMap = new Map<string, StreamSource>();
    for (const s of streams) {
      if (s.url && !streamMap.has(s.channel)) {
        streamMap.set(s.channel, s);
      }
    }

    const events: LiveEvent[] = channels
      .filter(ch => streamMap.has(ch.id))
      .slice(0, 100) // limit to 100 for performance
      .map((ch, i) => ({
        id: ch.id,
        title: ch.name,
        category: ch.categories?.[0] || "Other",
        categorySlug: (ch.categories?.[0] || "other").toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        viewers: Math.floor(Math.random() * 500) + 10,
        startTime: "LIVE",
        channel: ch.name,
        streamUrl: streamMap.get(ch.id)!.url,
        live: true,
      }));

    cacheSet("live_events", events, 3600_000);
    return events;
  } catch {
    return getPopularLive(); // fallback
  }
}

// Keep the existing getPopularLive() as the offline fallback
export function getPopularLive(): LiveEvent[] {
  return [
    {
      id: "1", title: "North Queensland Cowboys vs Penrith Panthers",
      category: "Rugby", categorySlug: "rugby", viewers: 397,
      startTime: "7:30 AM", channel: "Fox Sports",
      streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
      live: true,
    },
    // ... (keep all 10 existing mock events)
  ];
}

// ── Channels by Category ──────────────────────────────────

export async function fetchChannelsByCategory(category: string): Promise<Channel[]> {
  const cached = cacheGet<Channel[]>(`channels_${category}`);
  if (cached) return cached;

  try {
    const res = await fetch(`${API_BASE}/channels.json`);
    if (!res.ok) return [];
    const data: IptvChannel[] = await res.json();

    const catLower = category.toLowerCase();
    const filtered = data
      .filter(ch => ch.categories?.some(c => c.toLowerCase().includes(catLower)))
      .slice(0, 50)
      .map(ch => ({
        id: ch.id,
        name: ch.name,
        url: "",
        category: ch.categories?.[0] || category,
        country: ch.country,
        live: true,
        viewers: Math.floor(Math.random() * 500) + 10,
      }));

    cacheSet(`channels_${category}`, filtered, 3600_000);
    return filtered;
  } catch {
    return [];
  }
}

// ── Stream Sources ─────────────────────────────────────────

export async function getStreamSourcesForEvent(eventId: string): Promise<StreamSource[]> {
  try {
    const res = await fetch(`${API_BASE}/streams.json`);
    if (!res.ok) return getFallbackStreams(eventId);
    const all: StreamSource[] = await res.json();
    return all.filter(s => s.channel === eventId).slice(0, 5);
  } catch {
    return getFallbackStreams(eventId);
  }
}

function getFallbackStreams(eventId: string): StreamSource[] {
  return [
    { channel: eventId, url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", quality: "720p", label: "HD" },
    { channel: eventId, url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", quality: "480p", label: "SD" },
  ];
}

// ── EPG Guide ──────────────────────────────────────────────

export async function getGuideForChannel(channelId: string): Promise<GuideEntry[]> {
  const cached = cacheGet<GuideEntry[]>(`guide_${channelId}`);
  if (cached) return cached;

  try {
    const res = await fetch(`${API_BASE}/guides.json?channel=${channelId}`);
    if (!res.ok) return [];
    const data: GuideEntry[] = await res.json();
    const now = Date.now() / 1000;
    const filtered = data.filter(g => g.stop > now).slice(0, 20);
    cacheSet(`guide_${channelId}`, filtered, 1800_000); // 30 min TTL
    return filtered;
  } catch {
    return [];
  }
}

// ── Schedule (for old /schedule page, now static) ─────────

export function getSchedule(): ScheduleEvent[] {
  return []; // Will be populated from EPG data
}

// ── M3U Playlist ───────────────────────────────────────────

export function getPlaylistUrl(category?: string): string {
  const base = "https://iptv-org.github.io/iptv";
  if (category) return `${base}/categories/${category}.m3u`;
  return `${base}/index.m3u`;
}

// ── Search ─────────────────────────────────────────────────

export async function searchChannels(query: string): Promise<Channel[]> {
  try {
    const res = await fetch(`${API_BASE}/channels.json`);
    if (!res.ok) return [];
    const data: IptvChannel[] = await res.json();
    const q = query.toLowerCase();
    return data
      .filter(ch => ch.name.toLowerCase().includes(q) || ch.categories?.some(c => c.toLowerCase().includes(q)))
      .slice(0, 20)
      .map(ch => ({
        id: ch.id,
        name: ch.name,
        url: "",
        category: ch.categories?.[0] || "Other",
        live: true,
      }));
  } catch {
    return [];
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/types/index.ts src/types/guide.ts src/lib/utils.ts src/lib/iptv.ts
git commit -m "feat: real IPTV data layer with caching — iptv-org API integration"
```

---

### Task 2: Wire HLS.js VideoPlayer

**Files:**
- Modify: `src/components/VideoPlayer.tsx`

- [ ] **Step 1: Rewrite VideoPlayer with HLS.js**

```typescript
"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { Play, Pause, Maximize, Volume2, VolumeX } from "lucide-react";
import { StreamSource } from "@/types";

interface VideoPlayerProps {
  src: string;
  title: string;
  poster?: string;
  sources?: StreamSource[];
  onSourceChange?: (url: string) => void;
}

export default function VideoPlayer({ src, title, poster, sources }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentSrc, setCurrentSrc] = useState(src);
  const [error, setError] = useState<string | null>(null);

  const loadStream = (url: string) => {
    setError(null);
    const video = videoRef.current;
    if (!video) return;

    // Destroy previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (url.endsWith(".m3u8") && Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
        setIsPlaying(true);
      });
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          setError("Stream playback error. Try another source.");
        }
      });
      hlsRef.current = hls;
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Native HLS support (Safari)
      video.src = url;
      video.addEventListener("loadedmetadata", () => {
        video.play().catch(() => {});
        setIsPlaying(true);
      });
    } else {
      // Direct video file
      video.src = url;
      video.addEventListener("loadedmetadata", () => {
        video.play().catch(() => {});
        setIsPlaying(true);
      });
    }
  };

  useEffect(() => {
    if (currentSrc) loadStream(currentSrc);
    return () => {
      if (hlsRef.current) hlsRef.current.destroy();
    };
  }, [currentSrc]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onTimeUpdate = () => {
      if (video.duration) setProgress((video.currentTime / video.duration) * 100);
    };
    video.addEventListener("timeupdate", onTimeUpdate);
    return () => video.removeEventListener("timeupdate", onTimeUpdate);
  }, []);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) { videoRef.current.pause(); } else { videoRef.current.play().catch(() => {}); }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    if (!videoRef.current) return;
    videoRef.current.requestFullscreen().catch(() => {});
  };

  return (
    <div className="relative aspect-video bg-black rounded-xl overflow-hidden group">
      <video
        ref={videoRef}
        poster={poster}
        className="h-full w-full object-contain"
        playsInline
        onClick={togglePlay}
      />

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center px-4">
            <p className="text-red-400 text-sm mb-2">{error}</p>
            {sources && sources.length > 1 && (
              <p className="text-xs text-muted-foreground">Try selecting a different source below.</p>
            )}
          </div>
        </div>
      )}

      {!isPlaying && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <button onClick={togglePlay} className="flex h-16 w-16 items-center justify-center rounded-full bg-[#3498db]/90 text-white transition-transform hover:scale-110">
            <Play className="h-8 w-8 ml-1" />
          </button>
        </div>
      )}

      {/* Title overlay */}
      {isPlaying && (
        <div className="absolute left-0 right-0 top-0 bg-gradient-to-b from-black/60 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <h3 className="text-sm font-medium text-white line-clamp-1">{title}</h3>
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="mb-3 h-1 w-full rounded-full bg-white/20">
          <div className="h-full rounded-full bg-[#3498db] transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={togglePlay} className="text-white hover:text-[#3498db] transition-colors">
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </button>
            <button onClick={toggleMute} className="text-white hover:text-[#3498db] transition-colors">
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>
          </div>
          <button onClick={toggleFullscreen} className="text-white hover:text-[#3498db] transition-colors">
            <Maximize className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Source selector */}
      {sources && sources.length > 1 && (
        <div className="absolute right-2 top-2 flex gap-1">
          {sources.map((s, i) => (
            <button
              key={i}
              onClick={() => { setCurrentSrc(s.url); setCurrentSrc(s.url); }}
              className={`rounded px-2 py-0.5 text-xs font-medium ${
                currentSrc === s.url
                  ? "bg-[#3498db] text-white"
                  : "bg-black/60 text-white/70 hover:bg-black/80"
              }`}
            >
              {s.label || s.quality || `Source ${i + 1}`}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/VideoPlayer.tsx
git commit -m "feat: HLS.js video player with real stream playback and source selector"
```

---

### Task 3: Favorites

**Files:**
- Create: `src/components/FavoriteButton.tsx`
- Create: `src/app/favorites/page.tsx`
- Modify: `src/app/watch/[slug]/page.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Create FavoriteButton component**

```typescript
"use client";

import { useState, useEffect, useCallback } from "react";
import { Star } from "lucide-react";

const STORAGE_KEY = "streamtv_favorites";

function getFavorites(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>(getFavorites);

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setFavorites(getFavorites());
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const toggle = useCallback((id: string) => {
    setFavorites(prev => {
      const next = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isFavorite = useCallback((id: string) => favorites.includes(id), [favorites]);

  return { favorites, toggle, isFavorite };
}

interface Props {
  channelId: string;
  isFavorite: boolean;
  onToggle: (id: string) => void;
  className?: string;
}

export default function FavoriteButton({ channelId, isFavorite, onToggle, className = "" }: Props) {
  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggle(channelId); }}
      className={`transition-colors ${
        isFavorite ? "text-yellow-400" : "text-muted-foreground hover:text-yellow-400"
      } ${className}`}
      title={isFavorite ? "Remove from favorites" : "Add to favorites"}
    >
      <Star className={`h-5 w-5 ${isFavorite ? "fill-yellow-400" : ""}`} />
    </button>
  );
}
```

- [ ] **Step 2: Create `/favorites` page**

```typescript
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Star, Tv, Eye } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FavoriteButton, { useFavorites } from "@/components/FavoriteButton";
import { getPopularLive } from "@/lib/iptv";
import { formatViewerCount } from "@/lib/utils";
import type { LiveEvent } from "@/types";

export default function FavoritesPage() {
  const { favorites, toggle, isFavorite } = useFavorites();
  const [events, setEvents] = useState<LiveEvent[]>([]);

  useEffect(() => {
    setEvents(getPopularLive().filter(e => favorites.includes(e.id)));
  }, [favorites]);

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="flex items-center gap-3 mb-6">
            <Star className="h-6 w-6 text-yellow-400" />
            <h1 className="text-2xl font-bold text-white">My Favorites</h1>
          </div>

          {events.length === 0 ? (
            <div className="rounded-xl border border-border/40 bg-card p-12 text-center">
              <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">No favorites yet</p>
              <p className="text-sm text-muted-foreground">
                Click the <Star className="h-4 w-4 inline" /> star icon on any channel or stream to save it here.
              </p>
              <Link href="/" className="mt-4 inline-block rounded-lg bg-[#3498db] px-4 py-2 text-sm text-white hover:bg-[#3498db]/90">
                Browse Channels
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {events.map(event => (
                <Link key={event.id} href={`/watch/${event.id}`}
                  className="group rounded-xl border border-border/50 bg-card p-4 transition-all hover:bg-[#242442] hover:border-[#3498db]/40"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-white group-hover:text-[#3498db] transition-colors">
                        {event.title}
                      </h3>
                      <p className="mt-1 text-xs text-muted-foreground">{event.category} • {event.channel}</p>
                    </div>
                    <FavoriteButton channelId={event.id} isFavorite={isFavorite(event.id)} onToggle={toggle} />
                  </div>
                  <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-live-red" />
                      LIVE
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" /> {formatViewerCount(event.viewers)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 3: Add FavoriteButton to watch page**

Add to `src/app/watch/[slug]/page.tsx`:
- Import `FavoriteButton, { useFavorites }`
- Add `const { toggle, isFavorite } = useFavorites();` after params
- Add the FavoriteButton next to the title/event info

- [ ] **Step 4: Add favorites link to layout**

Add to `src/app/layout.tsx`'s Header or add favorites link to existing nav.

- [ ] **Step 5: Commit**

```bash
git add src/components/FavoriteButton.tsx src/app/favorites/page.tsx src/app/watch/\[slug\]/page.tsx
git commit -m "feat: favorites with localStorage persistence and dedicated page"
```

---

### Task 4: EPG Guide Page

**Files:**
- Create: `src/components/GuideGrid.tsx`
- Create: `src/app/guide/page.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Create GuideGrid component**

```typescript
"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Clock } from "lucide-react";
import type { GuideEntry, LiveEvent } from "@/types";
import { getGuideForChannel } from "@/lib/iptv";

interface Props {
  channels: LiveEvent[];
}

export default function GuideGrid({ channels }: Props) {
  const [guides, setGuides] = useState<Record<string, GuideEntry[]>>({});
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const now = Date.now() / 1000;

  useEffect(() => {
    async function load() {
      const results: Record<string, GuideEntry[]> = {};
      for (const ch of channels.slice(0, 20)) {
        results[ch.id] = await getGuideForChannel(ch.id);
      }
      setGuides(results);
      setLoading(false);
    }
    load();
    const interval = setInterval(load, 600_000); // refresh every 10 min
    return () => clearInterval(interval);
  }, [channels]);

  // Scroll to current time on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = 200; // offset to show "now"
    }
  }, [loading]);

  const currentHour = new Date().getHours();
  const hours = Array.from({ length: 6 }, (_, i) => currentHour + i);

  if (loading) {
    return (
      <div className="rounded-xl border border-border/40 bg-card p-8 text-center">
        <p className="text-muted-foreground">Loading guide...</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto" ref={scrollRef}>
      <div className="min-w-[800px]">
        {/* Time header */}
        <div className="flex border-b border-border/40">
          <div className="w-48 shrink-0 p-2 text-xs text-muted-foreground font-semibold">Channel</div>
          {hours.map(h => (
            <div key={h} className="flex-1 min-w-[120px] p-2 text-xs text-muted-foreground text-center border-l border-border/20">
              {`${h.toString().padStart(2, "0")}:00`}
            </div>
          ))}
        </div>

        {/* Program rows */}
        {channels.slice(0, 20).map(ch => (
          <div key={ch.id} className="flex border-b border-border/20 hover:bg-[#242442]/50">
            <div className="w-48 shrink-0 p-2 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-live-red" />
              <Link href={`/watch/${ch.id}`} className="text-sm text-white hover:text-[#3498db] truncate">
                {ch.title}
              </Link>
            </div>
            {hours.map(h => {
              const entry = (guides[ch.id] || []).find(g => {
                const startHour = new Date(g.start * 1000).getHours();
                return startHour === h;
              });
              return (
                <div key={h} className="flex-1 min-w-[120px] p-1 border-l border-border/20">
                  {entry ? (
                    <Link href={`/watch/${ch.id}`} className="block rounded bg-[#1a1a3e] px-2 py-1 text-xs text-white hover:bg-[#3498db]/20 transition-colors">
                      <p className="truncate font-medium">{entry.title}</p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {new Date(entry.start * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </Link>
                  ) : null}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `/guide` page**

```typescript
"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GuideGrid from "@/components/GuideGrid";
import { getPopularLive } from "@/lib/iptv";
import type { LiveEvent } from "@/types";

export default function GuidePage() {
  const [events, setEvents] = useState<LiveEvent[]>([]);

  useEffect(() => {
    getPopularLive().then(setEvents);
  }, []);

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <h1 className="text-2xl font-bold text-white mb-6">TV Guide</h1>
          <GuideGrid channels={events} />
        </div>
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 3: Add "Guide" to nav links in Header**

- [ ] **Step 4: Commit**

```bash
git add src/components/GuideGrid.tsx src/app/guide/page.tsx
git commit -m "feat: EPG guide with time-aligned program grid"
```

---

### Task 5: Smart DNS Proxy & Settings

**Files:**
- Create: `src/app/api/proxy/stream/route.ts`
- Create: `src/components/SmartDnsStatus.tsx`
- Create: `src/app/settings/page.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Create Smart DNS proxy API route**

```typescript
// src/app/api/proxy/stream/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  const referrer = request.nextUrl.searchParams.get("referrer");
  const userAgent = request.nextUrl.searchParams.get("ua");

  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  try {
    const headers: Record<string, string> = {};
    if (referrer) headers["Referer"] = referrer;
    if (userAgent) headers["User-Agent"] = userAgent;

    const response = await fetch(url, { headers });

    if (!response.ok) {
      return NextResponse.json({ error: `Upstream returned ${response.status}` }, { status: 502 });
    }

    // Stream the response back
    return new NextResponse(response.body, {
      status: 200,
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "application/octet-stream",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=30",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch stream" }, { status: 502 });
  }
}
```

- [ ] **Step 2: Create SmartDnsStatus component**

```typescript
"use client";

import { useState, useEffect } from "react";
import { Shield, ShieldAlert, ShieldOff } from "lucide-react";
import Link from "next/link";

export default function SmartDnsStatus() {
  const [configured, setConfigured] = useState(false);

  useEffect(() => {
    const dns = localStorage.getItem("streamtv_smart_dns");
    setConfigured(!!dns);
  }, []);

  return (
    <Link
      href="/settings"
      className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors ${
        configured
          ? "text-green-400 hover:bg-green-400/10"
          : "text-muted-foreground hover:text-white hover:bg-white/5"
      }`}
      title={configured ? "Smart DNS configured" : "Smart DNS not configured"}
    >
      {configured ? <Shield className="h-3 w-3" /> : <ShieldOff className="h-3 w-3" />}
      <span className="hidden sm:inline">{configured ? "DNS Active" : "No DNS"}</span>
    </Link>
  );
}
```

- [ ] **Step 3: Create `/settings` page**

```typescript
"use client";

import { useState, useEffect } from "react";
import { Shield, Save, RotateCcw, Globe, Monitor } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { cacheClear } from "@/lib/utils";

const DNS_PROVIDERS = [
  { name: "ControlD", primary: "76.76.2.0", backup: "76.76.10.0" },
  { name: "AdGuard DNS", primary: "94.140.14.14", backup: "94.140.15.15" },
  { name: "Cloudflare", primary: "1.1.1.1", backup: "1.0.0.1" },
  { name: "Google DNS", primary: "8.8.8.8", backup: "8.8.4.4" },
];

export default function SettingsPage() {
  const [dnsProvider, setDnsProvider] = useState("ControlD");
  const [proxyEnabled, setProxyEnabled] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("streamtv_smart_dns");
    if (stored) {
      try {
        const config = JSON.parse(stored);
        setDnsProvider(config.provider || "ControlD");
        setProxyEnabled(config.proxyEnabled || false);
      } catch {}
    }
  }, []);

  const saveSettings = () => {
    localStorage.setItem("streamtv_smart_dns", JSON.stringify({
      provider: dnsProvider,
      proxyEnabled,
      timestamp: Date.now(),
    }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClearCache = () => {
    cacheClear();
    alert("Cache cleared!");
  };

  const provider = DNS_PROVIDERS.find(p => p.name === dnsProvider) || DNS_PROVIDERS[0];

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-8 space-y-8">
          <h1 className="text-2xl font-bold text-white">Settings</h1>

          {/* Smart DNS Section */}
          <section className="rounded-xl border border-border/40 bg-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="h-5 w-5 text-[#3498db]" />
              <h2 className="text-lg font-semibold text-white">Smart DNS</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">DNS Provider</label>
                <select
                  value={dnsProvider}
                  onChange={(e) => setDnsProvider(e.target.value)}
                  className="w-full rounded-lg border border-border bg-[#1a1a2e] px-3 py-2 text-sm text-white"
                >
                  {DNS_PROVIDERS.map(p => (
                    <option key={p.name} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-[#1a1a2e] p-3">
                  <p className="text-xs text-muted-foreground">Primary DNS</p>
                  <p className="text-sm font-mono text-white mt-1">{provider.primary}</p>
                </div>
                <div className="rounded-lg bg-[#1a1a2e] p-3">
                  <p className="text-xs text-muted-foreground">Backup DNS</p>
                  <p className="text-sm font-mono text-white mt-1">{provider.backup}</p>
                </div>
              </div>

              <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-3">
                <p className="text-xs text-yellow-400">
                  💡 To apply these DNS settings, run the setup script as Administrator:
                </p>
                <code className="block mt-1 text-xs text-muted-foreground font-mono">
                  PowerShell -Command "Start-Process powershell -Verb RunAs -ArgumentList '-NoProfile -ExecutionPolicy Bypass -File \`"C:\Users\benni\ZCodeProject\iptv-dashboard\scripts\set-dns-control-d.ps1\`"'"
                </code>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="proxy"
                  checked={proxyEnabled}
                  onChange={(e) => setProxyEnabled(e.target.checked)}
                  className="rounded border-border"
                />
                <label htmlFor="proxy" className="text-sm text-white">
                  Route streams through server proxy (bypasses geo-restrictions)
                </label>
              </div>

              {proxyEnabled && (
                <div className="rounded-lg bg-[#3498db]/10 border border-[#3498db]/20 p-3">
                  <p className="text-xs text-[#3498db]">
                    When enabled, stream URLs will be fetched through the Next.js server
                    instead of directly from the browser. This helps bypass network-level blocks.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Cache Section */}
          <section className="rounded-xl border border-border/40 bg-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <RotateCcw className="h-5 w-5 text-[#3498db]" />
              <h2 className="text-lg font-semibold text-white">Cache</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Channel data and EPG guide are cached to improve performance.
            </p>
            <button onClick={handleClearCache} className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2 text-sm text-red-400 hover:bg-red-500/20 transition-colors">
              Clear All Cache
            </button>
          </section>

          {/* Save */}
          <button
            onClick={saveSettings}
            className="flex items-center gap-2 rounded-lg bg-[#3498db] px-6 py-3 text-sm font-medium text-white hover:bg-[#3498db]/90 transition-colors"
          >
            <Save className="h-4 w-4" />
            {saved ? "Saved!" : "Save Settings"}
          </button>
        </div>
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 4: Add SmartDnsStatus to layout header**

- [ ] **Step 5: Commit**

```bash
git add src/app/api/proxy/stream/route.ts src/components/SmartDnsStatus.tsx src/app/settings/page.tsx
git commit -m "feat: Smart DNS proxy, settings page, and DNS status indicator"
```

---

### Task 6: Recording Scheduler

**Files:**
- Create: `src/app/api/record/schedule/route.ts`
- Create: `src/app/api/record/stream/route.ts`
- Create: `src/components/RecordingPanel.tsx`
- Create: `recordings.json` (empty array)

- [ ] **Step 1: Create recordings.json**

```json
[]
```

- [ ] **Step 2: Create schedule API route**

```typescript
// src/app/api/record/schedule/route.ts
import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { spawn, ChildProcess } from "child_process";

const RECORDINGS_FILE = path.join(process.cwd(), "recordings.json");
const RECORDINGS_DIR = path.join(process.cwd(), "recordings");
const activeProcesses = new Map<string, ChildProcess>();

interface Recording {
  id: string;
  channelId: string;
  streamUrl: string;
  title: string;
  startTime: number;
  duration: number;
  status: "scheduled" | "recording" | "completed" | "failed";
  outputFile?: string;
  error?: string;
  createdAt: number;
}

async function readRecordings(): Promise<Recording[]> {
  try {
    const data = await fs.readFile(RECORDINGS_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeRecordings(recordings: Recording[]): Promise<void> {
  await fs.writeFile(RECORDINGS_FILE, JSON.stringify(recordings, null, 2));
}

async function ensureDir() {
  try { await fs.mkdir(RECORDINGS_DIR, { recursive: true }); } catch {}
}

export async function POST(request: NextRequest) {
  await ensureDir();
  const body = await request.json();
  const { channelId, streamUrl, startTime, duration, title } = body;

  if (!channelId || !streamUrl || !startTime || !duration) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const recordings = await readRecordings();
  const id = `rec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const recording: Recording = {
    id, channelId, streamUrl, title: title || "Untitled",
    startTime, duration, status: "scheduled", createdAt: Date.now(),
  };
  recordings.push(recording);
  await writeRecordings(recordings);

  return NextResponse.json({ id, status: "scheduled" });
}

export async function GET() {
  const recordings = await readRecordings();
  return NextResponse.json(recordings);
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const recordings = await readRecordings();
  const idx = recordings.findIndex(r => r.id === id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Kill active process
  const proc = activeProcesses.get(id);
  if (proc) {
    proc.kill("SIGTERM");
    activeProcesses.delete(id);
  }

  recordings.splice(idx, 1);
  await writeRecordings(recordings);
  return NextResponse.json({ success: true });
}

// Scheduler checker — run every 30s to start due recordings
let schedulerStarted = false;
function startScheduler() {
  if (schedulerStarted) return;
  schedulerStarted = true;

  setInterval(async () => {
    try {
      const recordings = await readRecordings();
      for (const rec of recordings) {
        if (rec.status !== "scheduled") continue;
        if (Date.now() >= rec.startTime) {
          rec.status = "recording";
          await writeRecordings(recordings);

          const outputFile = path.join(RECORDINGS_DIR, `${rec.id}.ts`);
          rec.outputFile = outputFile;

          const proc = spawn("ffmpeg", [
            "-i", rec.streamUrl,
            "-t", String(rec.duration),
            "-c", "copy",
            "-f", "mpegts",
            outputFile,
          ], { stdio: "ignore" });

          activeProcesses.set(rec.id, proc);

          proc.on("exit", async (code) => {
            activeProcesses.delete(rec.id);
            const current = await readRecordings();
            const r = current.find(x => x.id === rec.id);
            if (r) {
              r.status = code === 0 ? "completed" : "failed";
              r.error = code !== 0 ? `ffmpeg exited with code ${code}` : undefined;
              await writeRecordings(current);
            }
          });

          proc.on("error", async (err) => {
            activeProcesses.delete(rec.id);
            const current = await readRecordings();
            const r = current.find(x => x.id === rec.id);
            if (r) {
              r.status = "failed";
              r.error = err.message;
              await writeRecordings(current);
            }
          });
        }
      }
    } catch {}
  }, 30_000);
}

startScheduler();
```

- [ ] **Step 3: Create stream serve route**

```typescript
// src/app/api/record/stream/route.ts
import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { readFileSync } from "fs";

const RECORDINGS_FILE = path.join(process.cwd(), "recordings.json");
const RECORDINGS_DIR = path.join(process.cwd(), "recordings");

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const data = await fs.readFile(RECORDINGS_FILE, "utf-8");
  const recordings = JSON.parse(data);
  const rec = recordings.find((r: any) => r.id === id);

  if (!rec || !rec.outputFile) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const filePath = path.join(RECORDINGS_DIR, `${rec.id}.ts`);
    const buffer = readFileSync(filePath);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "video/MP2T",
        "Content-Disposition": `attachment; filename="${rec.title.replace(/[^a-zA-Z0-9]/g, "_")}.ts"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
```

- [ ] **Step 4: Create RecordingPanel component**

```typescript
"use client";

import { useState } from "react";
import { Radio, Calendar, Clock } from "lucide-react";

interface Props {
  channelId: string;
  streamUrl: string;
  channelTitle: string;
}

export default function RecordingPanel({ channelId, streamUrl, channelTitle }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [duration, setDuration] = useState(60);
  const [scheduling, setScheduling] = useState(false);
  const [message, setMessage] = useState("");

  const handleSchedule = async () => {
    if (!startDate || !startTime) return;
    setScheduling(true);
    setMessage("");

    const startDateTime = new Date(`${startDate}T${startTime}`).getTime();
    const durationSec = duration * 60;

    try {
      const res = await fetch("/api/record/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId,
          streamUrl,
          startTime: startDateTime,
          duration: durationSec,
          title: channelTitle,
        }),
      });

      if (res.ok) {
        setMessage("✅ Recording scheduled!");
        setShowForm(false);
      } else {
        setMessage("❌ Failed to schedule");
      }
    } catch {
      setMessage("❌ Network error");
    }
    setScheduling(false);
  };

  return (
    <div className="rounded-xl border border-border/40 bg-card p-4 mt-4">
      <button
        onClick={() => setShowForm(!showForm)}
        className="flex items-center gap-2 text-sm font-medium text-white hover:text-[#3498db] transition-colors"
      >
        <Radio className="h-4 w-4" />
        Record This Stream
      </button>

      {showForm && (
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-border bg-[#1a1a2e] px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-lg border border-border bg-[#1a1a2e] px-3 py-2 text-sm text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1">Duration (minutes)</label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-[#1a1a2e] px-3 py-2 text-sm text-white"
            >
              <option value={30}>30 min</option>
              <option value={60}>1 hour</option>
              <option value={90}>1.5 hours</option>
              <option value={120}>2 hours</option>
              <option value={180}>3 hours</option>
              <option value={360}>6 hours</option>
            </select>
          </div>

          <button
            onClick={handleSchedule}
            disabled={scheduling}
            className="w-full rounded-lg bg-[#3498db] px-4 py-2 text-sm font-medium text-white hover:bg-[#3498db]/90 disabled:opacity-50 transition-colors"
          >
            {scheduling ? "Scheduling..." : "Schedule Recording"}
          </button>

          {message && <p className="text-xs text-center">{message}</p>}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Add RecordingPanel to watch page**

Add to `src/app/watch/[slug]/page.tsx`: Import and render `<RecordingPanel />` component.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/record/ recordings.json src/components/RecordingPanel.tsx
git commit -m "feat: recording scheduler with ffmpeg, schedule API, and recording panel"
```

---

### Task 7: Update Existing Pages for Real Data

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/category/[slug]/page.tsx`
- Modify: `src/app/watch/[slug]/page.tsx`
- Modify: `src/app/multiview/page.tsx`
- Modify: `src/app/search/page.tsx`
- Modify: `src/components/Header.tsx`

- [ ] **Step 1: Update home page to fetch real data**

Replace static imports with async data fetching.

- [ ] **Step 2: Update category page to use real API channels**

Replace mock filtered events with actual `fetchChannelsByCategory()`.

- [ ] **Step 3: Update watch page with all integrations**

Add FavoriteButton, RecordingPanel, and stream source selector from real API.

- [ ] **Step 4: Update multiview page**

Wire real stream URLs to iframe/video elements.

- [ ] **Step 5: Update search page**

Use `searchChannels()` with real API.

- [ ] **Step 6: Update Header with new nav links**

Add links to /guide, /favorites, /settings.

- [ ] **Step 7: Commit**

```bash
git add src/app/page.tsx src/app/category/\[slug\]/page.tsx src/app/watch/\[slug\]/page.tsx src/app/multiview/page.tsx src/app/search/page.tsx src/components/Header.tsx
git commit -m "feat: wire real IPTV data across all pages"
```

---

### Task 8: Install & Build Verification

- [ ] **Step 1: Install any new dependencies (if needed)**

Run: `cd /c/Users/benni/ZCodeProject/iptv-dashboard && npm install`

- [ ] **Step 2: TypeScript check**

Run: `npm run typecheck`
Expected: No errors

- [ ] **Step 3: Build check**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 4: Dev server check**

Run: `npm run dev`
Expected: Server starts, pages render at localhost:3000

- [ ] **Step 5: Final commit and push**

```bash
git add -A
git commit -m "chore: build verification and final polish"
git push origin master
```
